import os
import uuid
from app.core.config import settings

class LocalStorage:
    def __init__(self, base_dir: str = settings.UPLOAD_DIR):
        self.base_dir = base_dir
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, content: bytes, original_filename: str) -> str:
        # Generate unique filename to avoid collision
        ext = os.path.splitext(original_filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        full_path = os.path.join(self.base_dir, unique_filename)
        
        with open(full_path, "wb") as f:
            f.write(content)
            
        return full_path

    def delete_file(self, file_path: str) -> None:
        if os.path.exists(file_path):
            os.remove(file_path)

    def get_file_bytes(self, file_path: str) -> bytes:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            return f.read()

    def save_document_asset(self, document_id: str, content: bytes, original_filename: str) -> tuple[str, str]:
        """Save an inline editor asset under uploads/assets/{document_id}/."""
        ext = os.path.splitext(original_filename)[1].lower()
        asset_filename = f"{uuid.uuid4()}{ext}"
        asset_dir = os.path.join(self.base_dir, "assets", document_id)
        os.makedirs(asset_dir, exist_ok=True)
        full_path = os.path.join(asset_dir, asset_filename)
        with open(full_path, "wb") as f:
            f.write(content)
        return full_path, asset_filename

    def get_document_asset_path(self, document_id: str, asset_filename: str) -> str:
        safe_name = os.path.basename(asset_filename)
        return os.path.join(self.base_dir, "assets", document_id, safe_name)

storage = LocalStorage()
