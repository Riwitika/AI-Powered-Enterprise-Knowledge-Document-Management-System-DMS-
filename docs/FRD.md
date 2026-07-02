# Functional Requirements Document (FRD)
## AI-Powered Enterprise Knowledge & Document Management System (DMS)
### Client Organization: Fast Trade Technologies Pvt. Ltd.
### Project Duration: 45 Days

---

## 1. User Management & RBAC Module (Module 1)
* **FR 1.1 - Secure Login:** System must provide form validation for user email and password.
* **FR 1.2 - JWT Session Expiry:** System must enforce JWT session authentication. If the session token expires, the client must trigger a refresh token cycle or redirect to the login screen.
* **FR 1.3 - Role Assignment Matrix:** Administrators must be able to select and assign the following role scopes:
  1. *Super Admin*
  2. *Admin*
  3. *Department Manager*
  4. *Employee*
  5. *Guest*
* **FR 1.4 - User Directory:** Administrators must have access to a clean directory table to add new user profiles and delete accounts.

---

## 2. Document Repository & Version Control Module (Module 2)
* **FR 2.1 - File Ingestion:** Employees must be able to drag-and-drop or select files for ingestion. Supported file formats: `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.txt`, and image files (`.jpg`, `.png`).
* **FR 2.2 - File Downloader:** Authorized users must be able to download source binaries directly.
* **FR 2.3 - Archive & Delete:** Administrators must be able to permanently delete files or tag files as "Archived" to hide them from standard folder trees.
* **FR 2.4 - Revision History:** Users can upload a new revision of an existing document. The system must increment the document's version number (e.g. `v1 -> v2`) and log upload date metadata in a version list.

---

## 3. Hierarchical Catalog Tree Module (Module 3)
* **FR 3.1 - Folder Trees:** The repository files must render in a nested parent-child folder hierarchy.
* **FR 3.2 - Expand/Collapse Nodes:** Folder tree directories must support dynamic expansion and collapse toggles.
* **FR 3.3 - Real-Time Search Filter:** The system must provide a quick search bar on the tree side-bar, immediately filtering matching folders and document files as the user types (with zero page-reload).
* **FR 3.4 - Nested Folder Creation:** Users can create folders nested inside any parent folder, or create new root-level categories.

---

## 4. Access Policies & Permission Configuration (Module 4)
* **FR 4.1 - Access Preset Scopes:** Every uploaded document must enforce one of the following baseline policies:
  * **Private:** Visible exclusively to the document owner.
  * **View Only:** Read-only access organization-wide.
  * **Edit:** Full read/write access organization-wide.
  * **Department:** Visible solely to users belonging to the owner's department.
  * **Organization Wide:** Fully visible to all employees and guest profiles.
  * **Custom:** Access governed by explicit user/department sharing rules.
* **FR 4.2 - Fine-Grained Sharing Control:** If the document policy is set to "Custom", users must be able to grant or revoke read/write access to specific individual users or specific department divisions.

---

## 5. Grounded RAG AI Assistant Module (Advanced AI Features)
* **FR 5.1 - Organization-Wide Chatbot:** Users can query the global AI RAG assistant. The system must search the database for relevant document text blocks and synthesize a natural response.
* **FR 5.2 - Clickable Source Citations:** Global AI chatbot responses must list reference documents used to generate the answer. The reference badges must be clickable links leading to that specific document's metadata panel.
* **FR 5.3 - Document-Scoped Chatbot:** When viewing a specific file, the system must provide a side-chat module that restricts the AI's search context exclusively to that selected file.
* **FR 5.4 - Automatic Summary Extraction:** For every uploaded document, the RAG indexer must extract and store:
  1. *Executive Summary*
  2. *Core Topics Covered*
  3. *Primary Keywords / Tags*
* **FR 5.5 - Related Document Feed:** The system must recommend links to contextually related documents when a user opens a file (e.g., viewing an "Inventory Guide" suggests a "Warehouse SOP").
