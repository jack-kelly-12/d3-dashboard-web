from typing import Dict, List, Tuple, Optional, Any
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TableSchema:
    columns: List[str]
    types: List[str]
    required_filters: Dict[str, str]
    sample_data: Optional[Dict] = None
    embeddings: Optional[List[float]] = None


class DatabaseConnection:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._initialize_optimizations()

    def _initialize_optimizations(self):
        with self.get_connection() as conn:
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA synchronous=NORMAL")
            conn.execute("PRAGMA cache_size=-512")
            conn.execute("PRAGMA temp_store=MEMORY")
            conn.execute("PRAGMA mmap_size=268435456")

    @contextmanager
    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def execute_query(self, query: str) -> Tuple[List[str], List[Tuple]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            headers = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            return headers, rows


class VectorStore:
    def __init__(self, embedding_model: str = "text-embedding-3-small"):
        self.embeddings = OpenAIEmbeddings(model=embedding_model)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        self.vector_store = None

    def initialize_store(self, documents: List[Document]):
        texts = self.text_splitter.split_documents(documents)
        self.vector_store = Chroma.from_documents(
            documents=texts,
            embedding=self.embeddings,
            collection_name="baseball_stats"
        )

    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        if not self.vector_store:
            raise ValueError("Vector store not initialized")
        return self.vector_store.similarity_search(query, k=k)


class ReferenceData:
    def __init__(self, db: DatabaseConnection, vector_store: VectorStore):
        self.db = db
        self.vector_store = vector_store
        self._team_names: Optional[set] = None
        self._player_names: Optional[set] = None
        self._initialize_vectors()

    def _initialize_vectors(self):
        with self.db.get_connection() as conn:
            # Get column names dynamically
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(batting_war)")
            batting_columns = [col[1] for col in cursor.fetchall()]
            cursor.execute("PRAGMA table_info(pitching_war)")
            pitching_columns = [col[1] for col in cursor.fetchall()]

            # Build batting query
            batting_cols = [
                col for col in batting_columns if col not in ['ID', 'Division']]
            batting_query = f"""
                SELECT r.player_name, r.team_name, 
                       {', '.join(f'b.[{col}]' if '[' in col or ']' in col or '%' in col else f'b.{col}' for col in batting_cols)}
                FROM rosters r
                LEFT JOIN batting_war b ON r.player_name = b.Player
                WHERE r.Division = 3
            """
            batting_data = pd.read_sql(batting_query, conn)

            # Build pitching query
            pitching_cols = [
                col for col in pitching_columns if col not in ['ID', 'Division']]
            pitching_query = f"""
                SELECT r.player_name, r.team_name,
                       {', '.join(f'p.[{col}]' if '[' in col or ']' in col or '%' in col else f'p.{col}' for col in pitching_cols)}
                FROM rosters r
                LEFT JOIN pitching_war p ON r.player_name = p.Player
                WHERE r.Division = 3
            """
            pitching_data = pd.read_sql(pitching_query, conn)

            documents = []

            # Process batting stats
            for _, row in batting_data.iterrows():
                if pd.notna(row.player_name):
                    stats = {col: row[col]
                             for col in batting_cols if pd.notna(row[col])}
                    content = f"""
                    Player: {row.player_name}
                    Team: {row.team_name}
                    Type: Batting
                    Statistics: {json.dumps(stats)}
                    """
                    documents.append(Document(
                        page_content=content,
                        metadata={
                            "player": row.player_name,
                            "team": row.team_name,
                            "type": "batting"
                        }
                    ))

            # Process pitching stats
            for _, row in pitching_data.iterrows():
                if pd.notna(row.player_name):
                    stats = {col: row[col]
                             for col in pitching_cols if pd.notna(row[col])}
                    content = f"""
                    Player: {row.player_name}
                    Team: {row.team_name}
                    Type: Pitching
                    Statistics: {json.dumps(stats)}
                    """
                    documents.append(Document(
                        page_content=content,
                        metadata={
                            "player": row.player_name,
                            "team": row.team_name,
                            "type": "pitching"
                        }
                    ))

            self.vector_store.initialize_store(documents)

    @property
    @lru_cache(maxsize=1)
    def team_names(self) -> set:
        if self._team_names is None:
            headers, rows = self.db.execute_query(
                "SELECT DISTINCT Team FROM batting_team_war WHERE Division = 3"
            )
            self._team_names = {row[0] for row in rows}
        return self._team_names

    @property
    @lru_cache(maxsize=1)
    def player_names(self) -> set:
        if self._player_names is None:
            headers, rows = self.db.execute_query(
                "SELECT DISTINCT player_name FROM rosters WHERE Division = 3"
            )
            self._player_names = {row[0] for row in rows}
        return self._player_names

    def fuzzy_match(self, term: str, reference_set: set, threshold: int = 80) -> Dict:
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

    def get_relevant_context(self, query: str) -> List[Document]:
        return self.vector_store.similarity_search(query)


class QueryPreprocessor:
    def __init__(self, llm: ChatOpenAI, reference_data: ReferenceData):
        self.llm = llm
        self.reference_data = reference_data

    def preprocess(self, question: str) -> Dict[str, Any]:
        context_docs = self.reference_data.get_relevant_context(question)
        context = "\n".join(doc.page_content for doc in context_docs)

        messages = [
            {
                "role": "system",
                "content": self._get_preprocessor_prompt()
            },
            {
                "role": "user",
                "content": f"""
                Context: {context}
                Question: {question}
                """
            }
        ]

        response = self.llm.invoke(messages)
        processed = json.loads(self._clean_json_string(response.content))

        return {
            "processed_question": self._standardize_entities(processed),
            "context": context,
            "entities": processed["entities"]
        }

    def _get_preprocessor_prompt(self) -> str:
        return """
        You are a baseball statistics query preprocessor. Analyze the provided context and question to:
        1. Identify team and player names
        2. Standardize statistical terminology
        3. Structure questions clearly
        4. Use context for player-team relationships
        
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
        question = processed["processed_question"]

        for team in processed["entities"]["teams"]:
            match = self.reference_data.fuzzy_match(
                team,
                self.reference_data.team_names
            )
            if match["match"]:
                question = question.replace(team, match["match"])

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
        cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', json_str)
        cleaned = re.sub(r'```json\s*|\s*```', '',
                         cleaned, flags=re.IGNORECASE)
        return cleaned.strip()


class InsightsProcessor:
    def __init__(self):
        self.db = DatabaseConnection('./ncaa.db')
        self.vector_store = VectorStore()
        self.reference_data = ReferenceData(self.db, self.vector_store)

        self.llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview",
            temperature=0.1
        )

        self.preprocessor = QueryPreprocessor(
            self.llm,
            self.reference_data
        )

        self.schema: Optional[Dict[str, TableSchema]] = None
        self.agent_executor: Optional[AgentExecutor] = None

    def initialize(self):
        if not self.schema:
            self.schema = self._load_schema()
            self._setup_agent()

    def process_question(self, question: str) -> Dict:
        try:
            self.initialize()

            processed = self.preprocessor.preprocess(question)

            result = self.agent_executor.invoke({
                "input": processed["processed_question"],
                "context": processed["context"],
                "return_intermediate_steps": True
            })

            return self._format_result(result, processed)

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

    def _format_result(self, result: Dict, processed: Dict) -> Dict:
        formatted = {
            "type": "success",
            "result": {
                "answer": result.get("output", ""),
                "analysis": [
                    str(step) for step in result.get("intermediate_steps", [])
                ],
                "data": result.get("final_data", None),
                "context": processed["context"],
                "entities": processed["entities"]
            }
        }

        return formatted

    def _load_schema(self) -> Dict[str, TableSchema]:
        schema = {}

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
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table';")
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

    def _get_sample_data(self, cursor: sqlite3.Cursor, table: str, limit: int = 3) -> Dict:
        cursor.execute(f"SELECT * FROM {table} LIMIT {limit}")
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        return {
            "columns": columns,
            "sample_rows": [dict(zip(columns, row)) for row in rows]
        } if rows else None

    def _setup_agent(self):
        tools = [
            Tool(
                name="fuzzy_match_team",
                func=lambda x: self.reference_data.fuzzy_match(
                    x, self.reference_data.team_names),
                description="Find closest matching Division 3 team name"
            ),
            Tool(
                name="fuzzy_match_player",
                func=lambda x: self.reference_data.fuzzy_match(
                    x, self.reference_data.player_names),
                description="Find closest matching Division 3 player name"
            ),
            Tool(
                name="execute_sql",
                func=lambda x: self._execute_sql(x),
                description="Execute a SQL query on the database"
            )
        ]

        prompt = self._load_agent_prompt_template()
        agent = create_react_agent(llm=self.llm, tools=tools, prompt=prompt)

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            return_intermediate_steps=True,
            max_iterations=8
        )

    def _execute_sql(self, query: str) -> Dict:
        query = query.strip('"')

        if not query:
            raise ValueError("Empty query string provided")

        try:
            headers, rows = self.db.execute_query(query)
            return {
                "headers": headers,
                "rows": [list(row) for row in rows]
            }
        except sqlite3.OperationalError as e:
            raise sqlite3.OperationalError(
                f"SQL execution failed for query: {query}. Error: {str(e)}"
            ) from e

    def _load_agent_prompt_template(self) -> PromptTemplate:
        template = """You are a D3 baseball statistics expert using ReAct format. Analysis covers 2021-2024.
        Your key strength is accurately analyzing player statistics while maintaining proper team context.

        Context provided: {context}

        CORE TABLES AND RELATIONSHIPS:
        1. rosters: Central source of player-team relationships
        - player_id
        - player_name (for identification)
        - team_name (current team)
        
        2. pbp: Play-by-play events with player IDs
        - Links to rosters for both batter and pitcher
        - Contains game context and matchup details
        - MUST JOIN with rosters on both player_id to get batter and pitcher names
        
        3. batting_war/pitching_war: Season statistics
        - Contains Player and Team fields
        - Must validate against rosters for accuracy
        
        4. batted_ball, situational, value, and baserunning
        - Leaderboards
        - Use for specific questions about high leverage situations, extra bases, etc.
        
        5. d3_park_factors
        - Park factors for D3 teams
        
        QUERY RULES:
        1. Use brackets for special columns: [K%], [BB%], [wOBA], [HR%]
        2. Column names are case-sensitive
        3. Use SQLite syntax
        4. Always filter Division = 3
        5. Always include Season in queries (2021-2024 default)
        6. For class/year queries, use rosters table (Fr., So., Jr., Sr.)

        WAR ANALYSIS PROTOCOL:
        1. Check both batting_war and pitching_war tables
        2. Sum for total WAR when needed
        3. Always present component and total values

        Available tools: {tools}
        Tool names: {tool_names}
        Current question: {input}

        Analysis steps:
        1. Use the provided context
        2. Select appropriate tool
        3. Format:
            Thought: reasoning
            Action: tool_name
            Action Input: input
            Observation: result
        4. Repeat if needed
        5. Conclude:
            Thought: Found answer
            Final Answer: response

        {schema_str}
        {agent_scratchpad}
        """

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
