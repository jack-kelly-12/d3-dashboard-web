from typing import Dict, List, Tuple, Optional, Any
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from thefuzz import fuzz
from dataclasses import dataclass
import json
import sqlite3
import logging
import re
from dotenv import load_dotenv
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
from contextlib import contextmanager

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class TableSchema:
    """Schema information for a database table."""
    columns: List[str]
    types: List[str]
    required_filters: Dict[str, str]
    sample_data: Optional[Dict] = None


class DatabaseConnection:
    """Manages database connections and query execution."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._initialize_optimizations()

    def _initialize_optimizations(self):
        """Initialize database optimizations with modest memory usage."""
        with self.get_connection() as conn:
            # Basic performance optimizations
            conn.execute("PRAGMA journal_mode=WAL")  # Use Write-Ahead Logging
            # Reduce synchronous writes
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA cache_size=-512")  # Set cache to 512KB
            # Store temp tables in memory
            conn.execute("PRAGMA temp_store=MEMORY")
            # Memory-map up to 256MB
            conn.execute("PRAGMA mmap_size=268435456")

    @contextmanager
    def get_connection(self) -> sqlite3.Connection:
        """Context manager for database connections with optimized settings."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    @contextmanager
    def get_connection(self) -> sqlite3.Connection:
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, query: str) -> Tuple[List[str], List[Tuple]]:
        """Execute a query and return headers and rows."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            headers = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            return headers, rows


class ReferenceData:
    """Manages reference data for entity matching."""

    def __init__(self, db: DatabaseConnection):
        self.db = db
        self._team_names: Optional[set] = None
        self._player_names: Optional[set] = None

    @property
    @lru_cache(maxsize=1)
    def team_names(self) -> set:
        """Cached set of team names."""
        if self._team_names is None:
            headers, rows = self.db.execute_query(
                "SELECT DISTINCT Team FROM batting_team_war"
            )
            self._team_names = {row[0] for row in rows}
        return self._team_names

    @property
    @lru_cache(maxsize=1)
    def player_names(self) -> set:
        """Cached set of player names."""
        if self._player_names is None:
            headers, rows = self.db.execute_query(
                "SELECT DISTINCT player_name FROM rosters"
            )
            self._player_names = {row[0] for row in rows}
        return self._player_names

    def fuzzy_match(self, term: str, reference_set: set, threshold: int = 80) -> Dict:
        """Find closest match using fuzzy string matching."""
        if not term:
            return {"match": None, "score": 0}

        with ThreadPoolExecutor() as executor:
            matches = list(executor.map(
                lambda ref: (ref, fuzz.ratio(term.lower(), ref.lower())),
                reference_set
            ))

        best_match = max(matches, key=lambda x: x[1])
        return {
            "match": best_match[0] if best_match[1] >= threshold else None,
            "score": best_match[1]
        }


class QueryPreprocessor:
    """Handles query preprocessing and standardization."""

    def __init__(
        self,
        llm: ChatOpenAI,
        reference_data: ReferenceData
    ):
        self.llm = llm
        self.reference_data = reference_data

    def preprocess(self, question: str) -> str:
        """Preprocess and standardize a question."""
        messages = [
            {
                "role": "system",
                "content": self._get_preprocessor_prompt()
            },
            {
                "role": "user",
                "content": f"Preprocess this question and return JSON: {question}"
            }
        ]

        response = self.llm.invoke(messages)
        processed = json.loads(self._clean_json_string(response.content))

        return self._standardize_entities(processed)

    def _get_preprocessor_prompt(self) -> str:
        """Get the prompt for query preprocessing."""
        return """
        You are a baseball statistics query preprocessor. Your task is to:
        1. Identify team and player names
        2. Standardize statistical terminology
        3. Structure questions clearly
        
        Return JSON format:
        {
            "processed_question": "standardized question",
            "entities": {
                "teams": ["team names"],
                "players": ["player names"],
                "stats": ["requested statistics"]
            }
        }
        """

    def _standardize_entities(self, processed: Dict) -> str:
        """Standardize entity names using fuzzy matching."""
        question = processed["processed_question"]

        # Replace team names with best matches
        for team in processed["entities"]["teams"]:
            match = self.reference_data.fuzzy_match(
                team,
                self.reference_data.team_names
            )
            if match["match"]:
                question = question.replace(team, match["match"])

        # Replace player names with best matches
        for player in processed["entities"]["players"]:
            match = self.reference_data.fuzzy_match(
                player,
                self.reference_data.player_names
            )
            if match["match"]:
                question = question.replace(player, match["match"])

        return question

    @staticmethod
    def _clean_json_string(json_str: str) -> str:
        """Clean JSON string from LLM response."""
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', json_str)
        cleaned = re.sub(
            r'```json\s*|\s*```',
            '',
            cleaned,
            flags=re.IGNORECASE
        )
        return cleaned.strip()


class InsightsProcessor:
    """Main class for processing baseball statistics queries."""

    def __init__(self):
        self.db = DatabaseConnection('./ncaa.db')
        self.reference_data = ReferenceData(self.db)

        # Create LLMs with different configurations
        self.json_llm = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0.1,
            model_kwargs={"response_format": {"type": "json_object"}}
        )

        self.agent_llm = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0.1
        )

        self.preprocessor = QueryPreprocessor(
            self.json_llm,
            self.reference_data
        )

        self.schema: Optional[Dict[str, TableSchema]] = None
        self.agent_executor: Optional[AgentExecutor] = None

    def initialize(self):
        """Initialize the processor with schema and tools."""
        if not self.schema:
            self.schema = self._load_schema()
            self._setup_agent()
            logger.info("System initialized with current schema")

    def _parse_thought_steps(self, log: str) -> List[str]:
        """Parse thought steps from the action log."""
        steps = []
        if not log:
            return steps

        # Split the log into lines and process each line
        current_step = []
        for line in log.split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith(('Thought:', 'Action:', 'Action Input:')):
                # If we have a previous step collected, add it
                if current_step:
                    steps.append('\n'.join(current_step))
                    current_step = []

                current_step.append(line)
            else:
                # Continue adding to current step
                current_step.append(line)

        # Add the last step if exists
        if current_step:
            steps.append('\n'.join(current_step))

        return steps

    def _format_observation(self, observation: Any, action: Any) -> Dict:
        """Format the observation result."""
        if isinstance(observation, dict) and 'headers' in observation and 'rows' in observation:
            # Store SQL results for visualization if appropriate
            data = None
            if hasattr(action, 'tool') and action.tool == 'execute_sql':
                data = observation

            # Format the result for display
            headers = observation['headers']
            rows = observation['rows']

            result_str = f"Observation: Query returned {len(rows)} results"
            if rows:
                result_str += "\nResults:"
                for row in rows[:3]:  # Show up to 3 rows
                    formatted_row = [
                        f"{headers[i]}: {val}" for i, val in enumerate(row)]
                    result_str += f"\n  {' | '.join(formatted_row)}"

            return {
                "step": result_str,
                "data": data
            }
        elif isinstance(observation, dict) and 'match' in observation:
            # Handle fuzzy match results
            return {
                "step": f"Observation: Found match '{observation['match']}' with confidence {observation['score']}%",
                "data": None
            }
        else:
            return {
                "step": f"Observation: {str(observation)}",
                "data": None
            }

    def process_question(self, question: str) -> Dict:
        """Process a baseball statistics question and extract detailed analysis."""
        try:
            self.initialize()

            # Execute using agent with verbose=True to capture all steps
            result = self.agent_executor.invoke({
                "input": question,
                "return_intermediate_steps": True  # Ensure we get all steps
            })

            print(f'Result: {result}')

            # Initialize lists to store different types of steps
            thoughts = []
            actions = []
            observations = []
            final_data = None
            final_answer = None

            # Process intermediate steps
            if "intermediate_steps" in result:
                for step in result["intermediate_steps"]:
                    # Unpack the step tuple
                    if not isinstance(step, tuple) or len(step) != 2:
                        continue

                    action, observation = step

                    # Extract thought and action from the log
                    if hasattr(action, 'log'):
                        log_parts = action.log.strip().split('\n')
                        for part in log_parts:
                            part = part.strip()
                            if part.startswith('Thought:'):
                                thoughts.append(part)
                            elif part.startswith('Action:'):
                                actions.append(part)
                            elif part.startswith('Action Input:'):
                                if 'execute_sql' in actions[-1]:
                                    # Format SQL queries nicely
                                    query = part.replace(
                                        'Action Input:', '').strip()
                                    actions[-1] = f"{actions[-1]}\nSQL Query: {query}"

                    # Process observation
                    if observation:
                        if isinstance(observation, dict):
                            if 'headers' in observation and 'rows' in observation:
                                # Store SQL results for visualization
                                if hasattr(action, 'tool') and action.tool == 'execute_sql':
                                    final_data = observation

                                # Format observation nicely
                                obs_text = f"Results: Found {len(observation['rows'])} rows"
                                if observation['rows']:
                                    headers = observation['headers']
                                    sample_row = observation['rows'][0]
                                    formatted_row = [
                                        f"{headers[i]}: {val}" for i, val in enumerate(sample_row)]
                                    obs_text += f"\nSample: {' | '.join(formatted_row)}"
                                observations.append(obs_text)
                            elif 'match' in observation:
                                observations.append(
                                    f"Found match: {observation['match']} (confidence: {observation['score']}%)")
                        else:
                            observations.append(str(observation))

            # Extract final answer
            if "output" in result:
                output = result["output"]
                if "Final Answer:" in output:
                    final_answer = output.split("Final Answer:", 1)[1].strip()
                else:
                    final_answer = output.strip()

            # Combine all steps in order
            all_steps = []
            for i in range(max(len(thoughts), len(actions), len(observations))):
                if i < len(thoughts):
                    all_steps.append(thoughts[i])
                if i < len(actions):
                    all_steps.append(actions[i])
                if i < len(observations):
                    all_steps.append(observations[i])

            # Add final answer as the last step if available
            if final_answer:
                all_steps.append(f"Final Answer: {final_answer}")

            # Create formatted result
            formatted_result = {
                "answer": final_answer,
                "analysis": all_steps,
                "data": final_data
            }

            # Log all steps for debugging
            logger.info("Analysis steps:")
            for step in all_steps:
                logger.info(f"  {step}")

            return {
                "type": "success",
                "result": formatted_result
            }

        except Exception as e:
            logger.error(f"Error processing question: {str(e)}", exc_info=True)
            return {
                "type": "error",
                "result": {
                    "answer": "An error occurred processing your request.",
                    "analysis": [f"Error: {str(e)}"],
                    "data": None
                }
            }

    def _extract_final_answer(self, output: str) -> Optional[str]:
        """Extract the final answer from the output."""
        if "Final Answer:" in output:
            return output.split("Final Answer:", 1)[1].strip()
        return output.strip()

    def _load_schema(self) -> Dict[str, TableSchema]:
        """Load database schema with required filters."""
        schema = {}

        # Define required filters for each table
        filters = {
            "batting_war": {"PA": ">= 50", "Division": "= 3"},
            "pitching_war": {"IP": ">= 15", "Division": "= 3"},
            "batting_team_war": {"Division": "= 3"},
            "pitching_team_war": {"Division": "= 3"},
            "rosters": {"Division": "= 3"},
            "pbp": {"division": "= 3"},
        }

        with self.db.get_connection() as conn:
            cursor = conn.cursor()

            # Get table schemas
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table';"
            )
            tables = cursor.fetchall()

            for table in tables:
                table_name = table[0]
                cursor.execute(f"PRAGMA table_info({table_name});")
                columns = cursor.fetchall()

                schema[table_name] = TableSchema(
                    columns=[col[1] for col in columns],
                    types=[col[2] for col in columns],
                    required_filters=filters.get(table_name, {}),
                    sample_data=self._get_sample_data(cursor, table_name)
                )

        return schema

    def _get_sample_data(
        self,
        cursor: sqlite3.Cursor,
        table: str,
        limit: int = 3
    ) -> Dict:
        """Get sample data from a table."""
        cursor.execute(f"SELECT * FROM {table} LIMIT {limit}")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        return {
            "columns": columns,
            "sample_rows": [dict(zip(columns, row)) for row in rows]
        } if rows else None

    def _setup_agent(self):
        """Set up the LangChain agent with tools."""
        tools = [
            Tool(
                name="fuzzy_match_team",
                func=lambda x: self.reference_data.fuzzy_match(
                    x,
                    self.reference_data.team_names
                ),
                description="Find closest matching Division 3 team name"
            ),
            Tool(
                name="fuzzy_match_player",
                func=lambda x: self.reference_data.fuzzy_match(
                    x,
                    self.reference_data.player_names
                ),
                description="Find closest matching Division 3 player name"
            ),
            Tool(
                name="execute_sql",
                func=lambda x: self._execute_sql(x),
                description="Execute a SQL query on the database"
            )
        ]

        agent = create_react_agent(
            llm=self.agent_llm,
            tools=tools,
            prompt=self._get_agent_prompt()
        )

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            return_intermediate_steps=True,  # Make sure this is True
            max_iterations=8
        )

    def _get_agent_prompt(self) -> PromptTemplate:
        """Create the agent prompt template."""
        return self._load_agent_prompt_template()

    def _format_result(self, result: Dict) -> Dict:
        """Format the agent's response."""
        return {
            "answer": str(result.get("output", "")),
            "analysis": [
                str(step) for step in result.get("intermediate_steps", [])
            ],
            "data": result.get("final_data", None)
        }

    def _execute_sql(self, query: str) -> Dict:
        """Execute SQL query with proper formatting.

        Args:
            query (str): SQL query string to execute

        Returns:
            Dict: Dictionary containing query results with headers and rows

        Raises:
            sqlite3.OperationalError: If there's an error in SQL execution
        """
        # Strip any extra quotes that might be wrapping the entire query
        query = query.strip('"')

        # Validate that the query isn't empty after stripping
        if not query:
            raise ValueError("Empty query string provided")

        try:
            headers, rows = self.db.execute_query(query)
            return {
                "headers": headers,
                "rows": [list(row) for row in rows]
            }
        except sqlite3.OperationalError as e:
            # Add more context to the error
            raise sqlite3.OperationalError(
                f"SQL execution failed for query: {query}. Error: {str(e)}"
            ) from e

    def _load_agent_prompt_template(self) -> PromptTemplate:
        """Load the agent prompt template for D3 baseball statistics analysis."""
        template = """You are a D3 baseball statistics expert using ReAct format. Analysis covers 2021-2024.
        Your key strength is accurately analyzing player statistics while maintaining proper team context.

        CORE TABLES AND RELATIONSHIPS:
        1. rosters: Central source of player-team relationships
        - player_id (links to pbp)
        - player_name (for identification)
        - team_name (current team)
        KEY POINT: Always join through rosters to ensure correct player-team context
        
        2. pbp: Play-by-play events with player IDs
        - Links to rosters for both batter and pitcher
        - Contains game context and matchup details
        - MUST JOIN with rosters on both player_id AND team_name
        
        3. batting_war/pitching_war: Season statistics
        - Contains Player and Team fields
        - Must validate against rosters for accuracy
        
        MATCHUP ANALYSIS PROTOCOL:
        1. Player Identification:
        - First use fuzzy_match_player to find exact player names
        - Then get their team context from rosters
        
        2. Team Context:
        - Always include team information in player lookups
        - Example matchup query structure:
            ```
            SELECT COUNT(*) as encounters
            FROM pbp p
            JOIN rosters r_batter 
            ON p.batter_id = r_batter.player_id 
            JOIN rosters r_pitcher 
            ON p.pitcher_id = r_pitcher.player_id
            WHERE r_batter.player_name = ? 
            AND r_batter.team_name = (SELECT team_name FROM rosters WHERE player_name = ? LIMIT 1)
            AND r_pitcher.player_name = ? 
            AND r_pitcher.team_name = (SELECT team_name FROM rosters WHERE player_name = ? LIMIT 1)
            ```

        QUERY PRINCIPLES:
        1. Always maintain player-team relationships
        2. Use rosters as the source of truth for team affiliations
        3. Include team context in all player-specific queries
        4. Validate matchups against proper team contexts
            
            QUERY RULES:
            1. Use brackets for special columns: [K%], [BB%], [wOBA], [HR%]
            2. Column names are case-sensitive
            3. Use SQLite syntax (double quotes)
            4. Always filter Division = 3
            5. Always include Season in queries
            6. Default to all seasons (2021-2024) unless specified
            7. For class/year queries, use rosters table (Fr., So., Jr., Sr.)

            WAR ANALYSIS PROTOCOL:
            1. Check both batting_war and pitching_war tables
            2. Query steps:
            - Get batting WAR
            - Get pitching WAR
            - Sum for total WAR
            3. Present both component and total WAR values

            Example WAR query:
            SELECT Player, SUM(WAR) as batting_war 
            FROM batting_war 
            WHERE Division = 3 
            AND Season BETWEEN 2021 AND 2024 
            GROUP BY Player;

            Available tools: {tools}
            Tool names: {tool_names}
            Current question: {input}
            
            IMPORTANT: WHEN GENERATING SQL QUERIES, DONT PRECEDE AND FOLLOW THEM WITH ANYTHING
            LIKE ```sql, JUST GIVE THE PURE SQL

            Analysis steps:
            1. Analyze requirements
            2. Select tool from: {tool_names}
            3. Use format:
                Thought: reasoning
                Action: tool_name
                Action Input: input
                Observation: result
            4. Repeat if needed
            5. Conclude with:
                Thought: Found answer
                Final Answer: response

            {schema_str}
            {agent_scratchpad}
            """

        # Build schema info
        schema_info = []
        for table, schema in self.schema.items():
            filters = ", ".join(
                f"{k} {v}" for k, v in schema.required_filters.items())
            schema_info.append(f"{table}:")
            schema_info.append(f"Columns: {', '.join(schema.columns)}")
            if filters:
                schema_info.append(f"Required filters: {filters}")
            schema_info.append("")

        return PromptTemplate.from_template(
            template,
            partial_variables={
                "schema_str": "\n".join(schema_info),
                "tool_names": "'fuzzy_match_team', 'fuzzy_match_player', 'execute_sql'"
            }
        )
