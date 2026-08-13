import logging
import os
import re

from sqlalchemy.orm import Session

from app.models.models import Document
from app.services.extraction import convert_docx_to_html, is_html_content

logger = logging.getLogger(__name__)


def wrap_html_for_editor(html: str) -> str:
    cleaned = (html or "").strip()
    if not cleaned:
        return '<div data-type="page" class="tiptap-page-sheet"><p></p></div>'
    if 'data-type="page"' in cleaned:
        return cleaned
    return f'<div data-type="page" class="tiptap-page-sheet">{cleaned}</div>'


def ensure_document_editor_content(doc: Document, db: Session) -> None:
    """
    Ensure Document.content holds editor-ready HTML for editable formats.
    Plain-text extraction for search/RAG is handled separately in processing.
    """
    file_type = (doc.file_type or "").lower().strip(".")
    if file_type not in {"docx", "doc"}:
        return

    if doc.content and is_html_content(doc.content):
        return

    if not doc.file_path or not os.path.exists(doc.file_path):
        logger.warning("Cannot convert DOCX for %s: file missing at %s", doc.id, doc.file_path)
        return

    html = convert_docx_to_html(doc.file_path)
    if not html.strip():
        return

    doc.content = wrap_html_for_editor(html)
    db.commit()
    db.refresh(doc)


def content_looks_like_plain_docx(text: str) -> bool:
    if not text or not text.strip():
        return True
    if is_html_content(text):
        return False
    return not re.search(r"<(p|h[1-6]|ul|ol|table|div|strong|em)\b", text, re.I)
