import pytest
from unittest.mock import MagicMock
import os

# Set test environment variables before importing any app settings/modules
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "testsecretkeyforrunningtests"
os.environ["ENV"] = "development"
os.environ["GEMINI_API_KEY"] = "mock-key-for-testing-only"

from app.services.rag import llm_provider

@pytest.fixture(autouse=True)
def mock_llm():
    # Mock the LLM response generator
    llm_provider.generate_response = MagicMock(
        return_value="This is a test response generated under mock testing."
    )
    # Mock the executive summary and keywords generator
    llm_provider.generate_summary_and_keywords = MagicMock(
        return_value=("This is a test summary for testing.", ["test", "document", "mock"])
    )
    yield
