from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
import sqlite3
import json
import yaml
import logging
from pathlib import Path
import sqlparse
from functools import lru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class QueryExample:
    """Structure for storing example queries"""
    query: str
    description: str
    use_case: str
    table_names: List[str]
    category: str
    sample_question: str


class SchemaManager:
    """Manages database schema introspection and caching"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._schema_cache = {}

    @lru_cache(maxsize=32)
    def get_table_schema(self, table_name: str) -> Dict[str, str]:
        """Get schema for a specific table"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA table_info({table_name})")
            return {row[1]: row[2] for row in cursor.fetchall()}

    def get_all_tables(self) -> List[str]:
        """Get list of all tables in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            return [row[0] for row in cursor.fetchall()]

    def get_relationships(self, table_name: str) -> List[Dict]:
        """Get foreign key relationships for a table"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(f"PRAGMA foreign_key_list({table_name})")
            return cursor.fetchall()


class QueryLibrary:
    """Manages example queries and their embeddings"""

    def __init__(self, examples_path: str, embeddings_dir: str):
        self.examples_path = Path(examples_path)
        self.examples: List[QueryExample] = []
        self.embeddings = OpenAIEmbeddings()
        self._load_examples()

    def _load_examples(self):
        """Load examples from YAML file"""
        with open(self.examples_path) as f:
            data = yaml.safe_load(f)

        for example in data['examples']:
            query_example = QueryExample(
                query=example['query'],
                description=example['description'],
                use_case=example['use_case'],
                table_names=example['tables'],
                category=example['category'],
                sample_question=example['sample_question']
            )
            self.examples.append(query_example)

            # Add to vector store if not exists
            self.vector_store.add_texts(
                texts=[query_example.sample_question],
                metadatas=[{
                    'query': query_example.query,
                    'description': query_example.description,
                    'category': query_example.category
                }]
            )

    def find_similar_queries(self, question: str, k: int = 3) -> List[Dict]:
        """Find similar queries based on question"""
        results = self.vector_store.similarity_search_with_score(
            question,
            k=k
        )
        return [doc.metadata for doc, score in results]

    def get_examples_by_category(self, category: str) -> List[QueryExample]:
        """Get all examples for a specific category"""
        return [ex for ex in self.examples if ex.category == category]


class SafeQueryExecutor:
    """Handles safe execution of SQL queries"""

    def __init__(self, db_path: str):
        self.db_path = db_path

    def validate_query(self, query: str) -> bool:
        """Validate query structure and safety"""
        try:
            parsed = sqlparse.parse(query)[0]

            # Check for required filters
            if 'WHERE' in query.upper() and 'Division = 3' not in query:
                raise ValueError("Missing Division filter")

            # Add more validation as needed
            return True

        except Exception as e:
            logger.error(f"Query validation failed: {str(e)}")
            return False

    def execute_query(self, query: str) -> Dict:
        """Safely execute a SQL query"""
        if not self.validate_query(query):
            raise ValueError("Invalid query")

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            headers = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            return {"headers": headers, "rows": list(rows)}


class InsightsProcessor:
    """Main class for processing baseball statistics queries"""

    def __init__(self, db_path: str = './ncaa.db'):
        self.schema_manager = SchemaManager(db_path)
        self.query_executor = SafeQueryExecutor(db_path)
        self.query_library = QueryLibrary(
            'config/query_examples.yml',
            'storage/embeddings'
        )

        self.llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview",
            temperature=0.1
        )

        self.agent_executor = self._setup_agent()

    def _get_prompt_template(self) -> str:
        """Load and format prompt template"""
        with open('config/prompt_template.txt') as f:
            template = f.read()

        # Get dynamic schema information
        tables = self.schema_manager.get_all_tables()
        schema_info = []

        for table in tables:
            schema = self.schema_manager.get_table_schema(table)
            relations = self.schema_manager.get_relationships(table)

            schema_info.append(f"\n{table} table:")
            for col, type_ in schema.items():
                schema_info.append(f"  - {col} ({type_})")
            if relations:
                schema_info.append("  Relations:")
                for rel in relations:
                    schema_info.append(f"  - Links to {rel[2]}.{rel[4]}")

        return template.replace('{schema}', '\n'.join(schema_info))

    def _setup_agent(self) -> AgentExecutor:
        """Set up the LangChain agent"""
        tools = [
            Tool(
                name="execute_sql",
                func=self.query_executor.execute_query,
                description="Execute a SQL query on the baseball database"
            )
        ]

        prompt = PromptTemplate(
            template=self._get_prompt_template(),
            input_variables=[
                "input", "conversation_history", "agent_scratchpad"],
            partial_variables={
                "tools": str(tools),
                "tool_names": "execute_sql"
            }
        )

        agent = create_react_agent(
            llm=self.llm,
            tools=tools,
            prompt=prompt
        )

        return AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5
        )

    def process_question(self, question: str) -> Dict:
        """Process a question and return insights"""
        try:
            # Get relevant example queries
            similar_queries = self.query_library.find_similar_queries(question)

            # Add examples to conversation context
            context = f"\nRelevant examples:\n"
            for example in similar_queries:
                context += f"\nQuestion: {example['sample_question']}\n"
                context += f"Query: {example['query']}\n"

            result = self.agent_executor.invoke({
                "input": question,
                "conversation_history": context
            })

            return {
                "type": "success",
                "result": {
                    "answer": result.get("output", ""),
                    "analysis": [str(step) for step in result.get("intermediate_steps", [])]
                }
            }

        except Exception as e:
            logger.error(f"Error processing question: {str(e)}", exc_info=True)
            return {
                "type": "error",
                "result": {
                    "answer": f"Sorry, I encountered an error: {str(e)}",
                    "analysis": []
                }
            }
