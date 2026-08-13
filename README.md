<div align="center">

# AI-Powered Enterprise<br/>Knowledge & Document Management System

**A modern enterprise knowledge platform for documents, organizational knowledge,<br/>permissions, approvals, and AI-powered retrieval.**

<br/>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![RAG](https://img.shields.io/badge/RAG-Enabled-6366F1?style=for-the-badge)]()
[![Tiptap](https://img.shields.io/badge/Tiptap-3.29-000000?style=for-the-badge)](https://tiptap.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

[Features](#features) · [Architecture](#architecture) · [AI](#ai-powered-knowledge-layer) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started)

<br/>

**Repository:** [github.com/Riwitika/AI-Powered-Enterprise-Knowledge-Document-Management-System-DMS-](https://github.com/Riwitika/AI-Powered-Enterprise-Knowledge-Document-Management-System-DMS-)

</div>

---

> An AI-powered enterprise workspace that brings document management, structured knowledge, semantic search, role-based access, and intelligent document assistance into one unified platform.

---

## Platform Overview

```mermaid
flowchart LR
    subgraph Workspace["Enterprise Workspace"]
        A[Document Explorer]
        B[Rich Editor / Viewer]
        C[Inspector Panel]
    end

    subgraph Intelligence["AI Knowledge Layer"]
        D[Semantic Search]
        E[RAG Retrieval]
        F[Gemini Assistant]
    end

    subgraph Foundation["Platform Core"]
        G[FastAPI Backend]
        H[(SQLite / PostgreSQL)]
        I[File Storage]
    end

    A --> B --> C
    B --> G
    C --> G
    G --> H
    G --> I
    G --> D --> E --> F
    F --> B

    style Workspace fill:#0f172a,stroke:#334155,color:#e2e8f0
    style Intelligence fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style Foundation fill:#0c4a6e,stroke:#0284c7,color:#e0f2fe
```

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Enterprise Document Management
Hierarchical folders, multi-format uploads, favorites, archival, and full document lifecycle management across departments.

### Rich Document Editor
Paginated Tiptap editor with professional formatting, tables, images, links, and autosave — built for long-form corporate documents.

### AI Document Assistant
Ask questions, summarize content, improve writing, rewrite passages, and generate new text with document-aware context.

### RAG-Powered Knowledge Search
Semantic retrieval over embedded document chunks powers both search relevance and contextual AI responses.

</td>
<td width="50%" valign="top">

### Role-Based Access Control
Super Admin, Admin, Manager, Employee, and Guest roles with department-scoped and document-level permissions.

### Document Versioning
Automatic version history with manual checkpoints — track every meaningful change over time.

### Approval Workflows
Submit documents for review, approve or reject with remarks, and manage pending approvals from a dedicated dashboard.

### Permissions & Sharing
Grant view or edit access to users and departments with fine-grained document permission controls.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Document Processing
Background extraction, chunking, embedding, and AI summarization on every upload — originals preserved separately.

### Comments & Notifications
Threaded document comments and in-app notifications to keep teams aligned on document activity.

### Dashboard & Analytics
Organization overview with document metrics, recent activity, department insights, and AI usage signals.

### Semantic Search
Full-text and metadata search across documents, tags, categories, and departments.

</td>
<td width="50%" valign="top">

&nbsp;

</td>
</tr>
</table>

---

## Product Workspace

The application centers on a **three-panel document workspace** designed for focused enterprise work.

```mermaid
flowchart LR
    EX["Document Explorer<br/><small>Folders · Recent · Upload</small>"]
    ED["Editor / Viewer<br/><small>DOCX · TXT · PDF · PPTX · XLSX</small>"]
    IN["Inspector<br/><small>Properties · Comments · Versions · Activity</small>"]

    EX --> ED --> IN

    style EX fill:#f8fafc,stroke:#cbd5e1,color:#0f172a
    style ED fill:#ffffff,stroke:#6366f1,color:#0f172a
    style IN fill:#f8fafc,stroke:#cbd5e1,color:#0f172a
```

| Panel | Purpose |
| --- | --- |
| **Document Explorer** | Browse folder tree, open recent documents, upload files, and manage templates |
| **Editor / Viewer** | Rich Tiptap editing for DOCX/TXT; dedicated viewers for PDF, PPTX, and XLSX |
| **Inspector** | Document properties, threaded comments, version history, and activity timeline |

A floating **AI Assistant** panel is available globally — scoped to the active document or the full organization repository.

---

## Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend · React + TypeScript + Vite"]
        UI[React Components]
        RQ[TanStack React Query]
        ZS[Zustand Auth Store]
        TE[Tiptap Editor]
        AI_UI[AI Chat Interface]
    end

    subgraph API["API Layer · FastAPI"]
        AUTH[JWT Authentication]
        RBAC[RBAC Guards]
        ROUTES[REST Endpoints]
        BG[Background Tasks]
    end

    subgraph Services["Backend Services"]
        DM[Document Management]
        SR[Search]
        PM[Permissions]
        AP[Approvals]
        NT[Notifications]
        AI_SVC[AI Services]
        EXT[Document Extraction]
        STR[File Storage]
    end

    subgraph Data["Data Layer"]
        DB[(SQLite / PostgreSQL)]
        VEC[Vector Embeddings]
        FS[Upload Storage]
    end

    subgraph RAG["RAG Pipeline"]
        EMB[Sentence Transformers<br/>all-MiniLM-L6-v2]
        RET[Vector Retrieval]
        GEM[Gemini LLM]
    end

    UI --> RQ --> ROUTES
    ZS --> AUTH
    TE --> ROUTES
    AI_UI --> ROUTES
    ROUTES --> AUTH --> RBAC
    ROUTES --> DM & SR & PM & AP & NT & AI_SVC
    BG --> EXT --> STR --> FS
    BG --> EMB --> VEC
    AI_SVC --> RET --> GEM
    RET --> VEC
    ROUTES --> DB

    style Frontend fill:#0f172a,stroke:#334155,color:#e2e8f0
    style API fill:#1e3a5f,stroke:#0284c7,color:#e0f2fe
    style Services fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style Data fill:#064e3b,stroke:#10b981,color:#d1fae5
    style RAG fill:#4c1d95,stroke:#8b5cf6,color:#ede9fe
```

---

## AI-Powered Knowledge Layer

The platform uses **Retrieval-Augmented Generation (RAG)** to ground every AI response in your organization's actual document content — not generic model knowledge.

```mermaid
flowchart TD
    Q[User Query] --> QE[Query Embedding<br/>all-MiniLM-L6-v2]
    QE --> SS[Semantic Similarity Search]
    SS --> TC[Top Relevant Document Chunks]
    TC --> CC[Context Compilation]
    CC --> GM[Gemini LLM]
    GM --> AN[Contextual Answer]
    AN --> UI[Editor / AI Chat]

    style Q fill:#6366f1,stroke:#4f46e5,color:#fff
    style GM fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style AN fill:#0ea5e9,stroke:#0284c7,color:#fff
```

**Capabilities**

| Mode | What it does |
| --- | --- |
| Organization-wide Q&A | Search and answer across all accessible documents |
| Document-scoped Q&A | Restrict retrieval to a single open document |
| Summarization | Condense documents or selected passages |
| Explanation | Clarify complex terms and passages |
| Writing improvement | Enhance clarity, grammar, and structure |
| Rewrite / Shorten / Expand | Transform text while preserving intent |
| Tone transformation | Adjust to professional enterprise tone |
| Content generation | Create new content from instructions |

Gemini credentials are handled **exclusively on the backend** — the frontend never accesses API keys.

---

## Document Processing

Every upload triggers an automated background pipeline:

```mermaid
flowchart LR
    U[Upload] --> V[Validation]
    V --> FS[File Storage]
    FS --> TE[Text Extraction]
    TE --> CH[Chunking]
    CH --> EM[Embeddings]
    EM --> SU[AI Summary]
    SU --> SI[Semantic Index]
    SI --> SR[Search / AI Assistant]

    style U fill:#0ea5e9,stroke:#0284c7,color:#fff
    style SI fill:#6366f1,stroke:#4f46e5,color:#fff
```

| Format | Extraction Library |
| --- | --- |
| PDF | PyMuPDF |
| DOCX | Mammoth + python-docx |
| PPTX | python-pptx |
| XLSX | openpyxl |
| Images | Pytesseract OCR |

Original uploaded files are always preserved. Extraction and indexing happen separately.

---

## Document Support

| Format | Capability |
| --- | --- |
| **TXT** | Rich text editing + extraction |
| **DOCX** | Rich Tiptap editing + extraction |
| **PDF** | In-browser viewing + extraction |
| **PPTX** | In-browser viewing + extraction |
| **XLSX** | In-browser viewing + extraction |
| **PNG / JPG** | Image viewing + OCR extraction support |

---

## Rich Document Editor

Built on **Tiptap / ProseMirror** with a print-style paginated canvas — one continuous document model presented as fixed page sheets.

<table>
<tr>
<td width="33%" valign="top">

**Layout**
- Fixed 920×1056 page sheets
- Automatic pagination
- Manual page breaks (`⌘↵` / `Ctrl↵`)
- Zoom & print preview

**Typography**
- Headings H1–H4
- Font family & size controls
- Bold · Italic · Underline · Strikethrough
- Text color & highlight

</td>
<td width="33%" valign="top">

**Structure**
- Bullet & numbered lists
- Nested lists & indent
- Alignment & justification
- Blockquotes & horizontal rules
- Line & paragraph spacing

**Media**
- Resizable images
- Hyperlinks
- Tables with row/column control

</td>
<td width="33%" valign="top">

**Workflow**
- Undo / Redo
- Autosave (debounced)
- Save checkpoint (version)
- Find & replace
- Word count

</td>
</tr>
</table>

---

## Security

| Layer | Implementation |
| --- | --- |
| Authentication | JWT access tokens with HTTP-only refresh cookies |
| Session management | Token refresh, blacklist on logout |
| Authorization | Role-based access control on every protected route |
| Passwords | bcrypt hashing via passlib |
| Document access | Owner, role, department, and explicit permission checks |
| AI credentials | Gemini API key stored in backend environment only |
| Configuration | Secrets loaded from `.env` — never committed to source control |

---

## Tech Stack

<table>
<tr>
<th>Frontend</th>
<th>Backend</th>
<th>AI & Search</th>
</tr>
<tr>
<td valign="top">

![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)
![React Query](https://img.shields.io/badge/React_Query-5.50-FF4154?style=flat-square)
![Zustand](https://img.shields.io/badge/Zustand-4.5-443B2E?style=flat-square)
![Tiptap](https://img.shields.io/badge/Tiptap-3.29-000?style=flat-square)

</td>
<td valign="top">

![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?style=flat-square)
![Alembic](https://img.shields.io/badge/Alembic-1.13-007ACC?style=flat-square)
![Uvicorn](https://img.shields.io/badge/Uvicorn-0.30-000?style=flat-square)

</td>
<td valign="top">

![Gemini](https://img.shields.io/badge/Gemini-Flash-8E75B2?style=flat-square&logo=googlegemini)
![Sentence Transformers](https://img.shields.io/badge/SentenceTransformers-3.0-FF6F00?style=flat-square)
![RAG](https://img.shields.io/badge/RAG-Pipeline-6366F1?style=flat-square)
![pgvector](https://img.shields.io/badge/pgvector-0.2.5-4169E1?style=flat-square&logo=postgresql)

</td>
</tr>
<tr>
<th>Database</th>
<th>Document Processing</th>
<th>Tooling</th>
</tr>
<tr>
<td valign="top">

SQLite (development) · PostgreSQL + pgvector (production)

</td>
<td valign="top">

PyMuPDF · Mammoth · python-docx · python-pptx · openpyxl · Pytesseract · Pillow

</td>
<td valign="top">

pytest · GitHub Actions CI · Swagger OpenAPI docs

</td>
</tr>
</table>

---

## Project Structure

```
enterprise-kms/
├── frontend/          # React + TypeScript + Vite application
├── backend/           # FastAPI API, services, models, migrations
│   ├── app/
│   │   ├── api/       # REST route handlers
│   │   ├── services/  # RAG, extraction, storage, embeddings
│   │   └── models/    # SQLAlchemy ORM models
│   └── tests/         # Backend test suite
├── docs/              # Supplementary documentation
├── .github/           # CI workflow
└── README.md
```

---

## Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+
- **npm** 9+
- **Tesseract OCR** *(optional — for image text extraction)*

### Clone

```bash
git clone https://github.com/Riwitika/AI-Powered-Enterprise-Knowledge-Document-Management-System-DMS-.git
cd AI-Powered-Enterprise-Knowledge-Document-Management-System-DMS-
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Set GEMINI_API_KEY and SECRET_KEY
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Application: [http://localhost:5173](http://localhost:5173)

### Environment Variables

**Backend** (`backend/.env`)

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | `sqlite:///./kms.db` for local dev |
| `SECRET_KEY` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Default: `gemini-1.5-flash` |
| `EMBEDDING_MODEL` | Default: `all-MiniLM-L6-v2` |

**Frontend** (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `VITE_BACKEND_URL` | Default: `http://localhost:8000/api/v1` |

### Run Tests

```bash
# Backend
cd backend && source venv/bin/activate && python -m pytest

# Frontend build check
cd frontend && npm run build
```

---

## Demo Accounts

Seeded automatically on first backend startup:

| Name | Email | Password | Role |
| --- | --- | --- | --- |
| Arun Goyal | `superadmin@efasttrade.com` | `SuperAdmin@123` | Super Admin |
| Arnim Goyal | `admin@efasttrade.com` | `Admin@123` | Admin |
| Riwitika Gupta | `manager@efasttrade.com` | `Manager@123` | Department Manager |
| Paras Jain | `employee@efasttrade.com` | `Employee@123` | Employee |
| Yukti Gupta | `yukti@efasttrade.com` | `Employee@123` | Employee |
| Uttam Gupta | `uttam@efasttrade.com` | `Employee@123` | Employee |

New users can register with a `@efasttrade.com` email and invite code: **`FASTTRADE-SECURE-2026`**

---

## Contributors

<table>
<tr>
<td align="center" width="50%">
<br/>
<strong>Riwitika Gupta</strong><br/>
<sub>Developer</sub>
<br/><br/>
</td>
<td align="center" width="50%">
<br/>
<strong>Arnim Goyal</strong><br/>
<sub>Mentor</sub>
<br/><br/>
</td>
</tr>
</table>

---

## Project Status

> Core document management, AI assistance, RAG retrieval, authentication, document processing, rich editing, persistence, permissions, and workflow capabilities are implemented as part of this project.

---

## License

MIT License *(intended)* — a formal `LICENSE` file will be added to the repository.

---

<div align="center">

<br/>

**Fast Trade Technologies · Enterprise Knowledge Management**

<br/>

</div>
