import logging
from typing import List
from threading import RLock

logger = logging.getLogger(__name__)

class LocalEmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        self._lock = RLock()

    @property
    def model(self):
        with self._lock:
            if self._model is None:
                logger.info(f"Loading local SentenceTransformer model: {self.model_name}...")
                from sentence_transformers import SentenceTransformer
                # This downloads or loads the cached model
                self._model = SentenceTransformer(self.model_name)
                logger.info("SentenceTransformer model loaded successfully.")
            return self._model

    def get_embedding(self, text: str) -> List[float]:
        if not text.strip():
            return [0.0] * 384
        try:
            with self._lock:
                vector = self.model.encode(text)
            return vector.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 384

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            with self._lock:
                vectors = self.model.encode(texts)
            return vectors.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return [[0.0] * 384 for _ in texts]

embedding_service = LocalEmbeddingService()
