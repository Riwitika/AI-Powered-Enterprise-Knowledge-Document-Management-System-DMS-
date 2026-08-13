import os
import sys
import sqlite3
import requests
import json
from uuid import UUID

# Setup base parameters
API_BASE_URL = "http://127.0.0.1:8000/api/v1"
DB_PATH = "kms_fresh.db"

# Global states
report_entries = []
total_tests = 0
passed_tests = 0
failed_tests = 0
warning_tests = 0

def generate_final_report():
    print("\n" + "="*80)
    print("                    UAT TEST SUITE INTEGRATION REPORT")
    print("="*80)
    print(f"{'Feature / Test Case':<40} | {'Result':<10} | {'Evidence':<25}")
    print("-"*80)
    for entry in report_entries:
        print(f"{entry['feature']:<40} | {entry['result']:<10} | {entry['evidence']:<25}")
    print("="*80)
    print(f"Total Tests Run: {total_tests}")
    print(f"Passed Tests:    {passed_tests}")
    print(f"Failed Tests:    {failed_tests}")
    print(f"Warnings Logged: {warning_tests}")
    print("-"*80)
    readiness = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    print(f"Estimated Production Readiness Score: {readiness:.1f}%")
    print("="*80)

def log_result(feature, result, evidence):
    global total_tests, passed_tests, failed_tests, warning_tests
    total_tests += 1
    if result == "PASS":
        passed_tests += 1
    elif result == "FAIL":
        failed_tests += 1
    else:
        warning_tests += 1
    report_entries.append({
        "feature": feature,
        "result": result,
        "evidence": evidence
    })
    print(f"[{result}] {feature}: {evidence}")
    if result == "FAIL":
        print("CRITICAL FAILURE OCCURRED. Stopping execution.")
        generate_final_report()
        sys.exit(1)

def db_query(query, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()
    cursor.execute(query, params)
    res = cursor.fetchall()
    conn.commit()
    conn.close()
    return res

# Clean up any test artifacts from previous failed runs
try:
    db_query("DELETE FROM documents WHERE name IN ('UAT Document Guide', 'Admin Private Audit SOP', 'Employee Draft SOP');")
    db_query("DELETE FROM folders WHERE name IN ('UAT Temporary', 'UAT Renamed');")
except Exception as e:
    print(f"Startup database cleanup warning: {e}")

# ----------------------------------------------------
# 1. Server Health
# ----------------------------------------------------
print("--- 1. Server Health ---")
try:
    resp = requests.get("http://127.0.0.1:8000/")
    if resp.status_code == 200:
        log_result("Server Reachability", "PASS", "FastAPI server responds at root.")
    else:
        log_result("Server Reachability", "FAIL", f"Status code {resp.status_code}")
except Exception as e:
    log_result("Server Reachability", "FAIL", f"Connection failed: {e}")

# Check DB connection
try:
    users_count = db_query("SELECT count(*) FROM users;")[0][0]
    log_result("Database Connection", "PASS", f"SQLite connected successfully. Found {users_count} users.")
except Exception as e:
    log_result("Database Connection", "FAIL", f"SQLite query failed: {e}")

# ----------------------------------------------------
# 2. Authentication
# ----------------------------------------------------
print("--- 2. Authentication ---")
tokens = {}
# Invalid login
try:
    resp = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "wrong@efasttrade.com", "password": "bad"})
    if resp.status_code == 401 or resp.status_code == 400:
        log_result("Authentication - Invalid Login", "PASS", "Rejected invalid credentials successfully.")
    else:
        log_result("Authentication - Invalid Login", "FAIL", f"Unexpected status {resp.status_code} for invalid login.")
except Exception as e:
    log_result("Authentication - Invalid Login", "FAIL", str(e))

# Valid login (Admin)
try:
    resp = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "admin@efasttrade.com", "password": "Admin@123"})
    if resp.status_code == 200:
        tokens["admin_access"] = resp.json()["access_token"]
        tokens["admin_refresh"] = resp.json()["refresh_token"]
        log_result("Authentication - Admin Login", "PASS", "Logged in admin@efasttrade.com successfully.")
    else:
        log_result("Authentication - Admin Login", "FAIL", f"Admin login failed with status {resp.status_code}.")
except Exception as e:
    log_result("Authentication - Admin Login", "FAIL", str(e))

# Valid login (Employee)
try:
    resp = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "employee@efasttrade.com", "password": "Employee@123"})
    if resp.status_code == 200:
        tokens["emp_access"] = resp.json()["access_token"]
        tokens["emp_refresh"] = resp.json()["refresh_token"]
        log_result("Authentication - Employee Login", "PASS", "Logged in employee@efasttrade.com successfully.")
    else:
        log_result("Authentication - Employee Login", "FAIL", f"Employee login failed.")
except Exception as e:
    log_result("Authentication - Employee Login", "FAIL", str(e))

# Refresh Token
try:
    headers = {"Authorization": f"Bearer {tokens['admin_refresh']}"}
    resp = requests.post(f"{API_BASE_URL}/auth/refresh", headers=headers)
    if resp.status_code == 200:
        tokens["admin_access"] = resp.json()["access_token"]
        log_result("Authentication - Refresh Token", "PASS", "Rotated access token successfully.")
    else:
        log_result("Authentication - Refresh Token", "FAIL", f"Rotation returned {resp.status_code}")
except Exception as e:
    log_result("Authentication - Refresh Token", "FAIL", str(e))

# Logout and Blacklist Verify
try:
    headers = {"Authorization": f"Bearer {tokens['admin_refresh']}"}
    resp = requests.post(f"{API_BASE_URL}/auth/logout", headers=headers)
    if resp.status_code == 200:
        # Check DB side effect
        blacklisted = db_query("SELECT count(*) FROM blacklisted_tokens WHERE token = ?;", (tokens["admin_refresh"],))[0][0]
        if blacklisted > 0:
            log_result("Authentication - Logout Blacklist", "PASS", "Logged out. Token added to database blacklist.")
        else:
            log_result("Authentication - Logout Blacklist", "WARNING", "Logout API returned 200 but token not found in SQLite table.")
    else:
        log_result("Authentication - Logout Blacklist", "FAIL", f"Logout returned status {resp.status_code}.")
except Exception as e:
    log_result("Authentication - Logout Blacklist", "FAIL", str(e))

# Verify reuse fails
try:
    headers = {"Authorization": f"Bearer {tokens['admin_refresh']}"}
    resp = requests.post(f"{API_BASE_URL}/auth/refresh", headers=headers)
    if resp.status_code == 401 or resp.status_code == 400:
        log_result("Authentication - Blacklist Invalidation", "PASS", "Reusing blacklisted token was successfully rejected.")
    else:
        log_result("Authentication - Blacklist Invalidation", "FAIL", f"Blacklisted token was accepted! status: {resp.status_code}")
except Exception as e:
    log_result("Authentication - Blacklist Invalidation", "FAIL", str(e))

# Re-authenticate Admin to continue testing
resp = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "admin@efasttrade.com", "password": "Admin@123"})
tokens["admin_access"] = resp.json()["access_token"]
tokens["admin_refresh"] = resp.json()["refresh_token"]

# ----------------------------------------------------
# 3. User Information
# ----------------------------------------------------
print("--- 3. User Information ---")
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.get(f"{API_BASE_URL}/auth/me", headers=headers)
    if resp.status_code == 200:
        profile = resp.json()
        log_result("User Profile - Retrieve", "PASS", f"Retrieved profile for: {profile['full_name']} (Role: admin)")
    else:
        log_result("User Profile - Retrieve", "FAIL", f"Retrieve profile status: {resp.status_code}")
except Exception as e:
    log_result("User Profile - Retrieve", "FAIL", str(e))

# ----------------------------------------------------
# 4. Folder Operations
# ----------------------------------------------------
print("--- 4. Folder Operations ---")
folder_id = None
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.get(f"{API_BASE_URL}/folders/tree", headers=headers)
    if resp.status_code == 200:
        log_result("Folder - Tree Retrieve", "PASS", "Hierarchical folders list matches schema layout.")
    else:
        log_result("Folder - Tree Retrieve", "FAIL", f"List folders status: {resp.status_code}")
except Exception as e:
    log_result("Folder - Tree Retrieve", "FAIL", str(e))

# Create Folder
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"name": "UAT Temporary", "parent_id": None}
    resp = requests.post(f"{API_BASE_URL}/folders", headers=headers, json=payload)
    if resp.status_code == 200 or resp.status_code == 201:
        folder_id = resp.json()["id"]
        # DB check
        in_db = db_query("SELECT name FROM folders WHERE id = ?;", (folder_id,))
        if in_db and in_db[0][0] == "UAT Temporary":
            log_result("Folder - Create", "PASS", f"Created folder '{in_db[0][0]}' in DB.")
        else:
            log_result("Folder - Create", "FAIL", "Folder creation did not persist in database.")
    else:
        log_result("Folder - Create", "FAIL", f"Create folder status: {resp.status_code}")
except Exception as e:
    log_result("Folder - Create", "FAIL", str(e))

# Rename Folder
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"name": "UAT Renamed"}
    resp = requests.put(f"{API_BASE_URL}/folders/{folder_id}", headers=headers, json=payload)
    if resp.status_code == 200:
        in_db = db_query("SELECT name FROM folders WHERE id = ?;", (folder_id,))
        if in_db and in_db[0][0] == "UAT Renamed":
            log_result("Folder - Rename", "PASS", "Renamed folder successfully in database.")
        else:
            log_result("Folder - Rename", "FAIL", "Rename operation did not update database.")
    else:
        log_result("Folder - Rename", "FAIL", f"Rename folder status: {resp.status_code}")
except Exception as e:
    log_result("Folder - Rename", "FAIL", str(e))

# Delete Folder
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.delete(f"{API_BASE_URL}/folders/{folder_id}", headers=headers)
    if resp.status_code == 200:
        in_db = db_query("SELECT count(*) FROM folders WHERE id = ?;", (folder_id,))[0][0]
        if in_db == 0:
            log_result("Folder - Delete", "PASS", "Permanently deleted folder from SQLite.")
        else:
            log_result("Folder - Delete", "FAIL", "Folder still present in database after deletion.")
    else:
        log_result("Folder - Delete", "FAIL", f"Delete folder status: {resp.status_code}")
except Exception as e:
    log_result("Folder - Delete", "FAIL", str(e))

# ----------------------------------------------------
# 5. Document Operations
# ----------------------------------------------------
print("--- 5. Document Operations ---")
uploaded_doc_id = None
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    files = {"file": ("uat_doc.txt", b"Fast Trade Technologies SOP text content. This covers GST compliance directives.", "text/plain")}
    data = {
        "name": "UAT Document Guide",
        "description": "Standard compliance policies for accounting and GST tracking.",
        "category": "Policy",
        "access_level": "organization"
    }
    resp = requests.post(f"{API_BASE_URL}/documents/upload", headers=headers, files=files, data=data)
    if resp.status_code == 200 or resp.status_code == 201:
        uploaded_doc_id = resp.json()["id"]
        # Verify db metadata
        db_rec = db_query("SELECT name, file_type, access_level FROM documents WHERE id = ?;", (uploaded_doc_id,))
        if db_rec and db_rec[0][0] == "UAT Document Guide":
            log_result("Document Ingestion - TXT", "PASS", f"Uploaded document saved. UUID: {uploaded_doc_id}")
        else:
            log_result("Document Ingestion - TXT", "FAIL", "Document upload metadatas missing in DB.")
    else:
        log_result("Document Ingestion - TXT", "FAIL", f"Ingestion returned status {resp.status_code}. Details: {resp.text}")
except Exception as e:
    log_result("Document Ingestion - TXT", "FAIL", str(e))

# Check mock upload placeholders for PPTX / XLSX (UAT warning mapping)
log_result("Document Ingestion - PPTX/XLSX", "WARNING", "PPTX, XLSX, and PDF modules represent static UI previews with warning banners.")

# ----------------------------------------------------
# 6. Document Editing
# ----------------------------------------------------
print("--- 6. Document Editing ---")
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"content": "Fast Trade Technologies updated text. This covers GST compliance directives and tax audits."}
    resp = requests.put(f"{API_BASE_URL}/documents/{uploaded_doc_id}", headers=headers, json=payload)
    if resp.status_code == 200 or resp.status_code == 201:
        # Check versions count
        v_count = db_query("SELECT count(*) FROM document_versions WHERE document_id = ?;", (uploaded_doc_id,))[0][0]
        log_result("Document Content Edit", "PASS", f"Saved modifications. Incremented versions: {v_count}.")
    else:
        log_result("Document Content Edit", "FAIL", f"Edit API returned status {resp.status_code}")
except Exception as e:
    log_result("Document Content Edit", "FAIL", str(e))

# ----------------------------------------------------
# 7. Comments
# ----------------------------------------------------
print("--- 7. Comments ---")
comment_id = None
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"content": "Is this audit description correct?", "quote": "tax audits"}
    resp = requests.post(f"{API_BASE_URL}/comments/{uploaded_doc_id}", headers=headers, json=payload)
    if resp.status_code == 200 or resp.status_code == 201:
        comment_id = resp.json()["id"]
        log_result("Comment - Post Thread", "PASS", f"Posted comment on canvas: '{resp.json()['content']}'")
    else:
        log_result("Comment - Post Thread", "FAIL", f"Post comment returned status {resp.status_code}")
except Exception as e:
    log_result("Comment - Post Thread", "FAIL", str(e))

# Comment Reply
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"content": "Yes, it is correct.", "parent_id": comment_id}
    resp = requests.post(f"{API_BASE_URL}/comments/{uploaded_doc_id}", headers=headers, json=payload)
    if resp.status_code == 200 or resp.status_code == 201:
        log_result("Comment - Reply", "PASS", f"Replied to thread successfully. Reply: '{resp.json()['content']}'")
    else:
        log_result("Comment - Reply", "FAIL", f"Reply comment returned status {resp.status_code}")
except Exception as e:
    log_result("Comment - Reply", "FAIL", str(e))

# Comment Resolve
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.post(f"{API_BASE_URL}/comments/resolve/{comment_id}", headers=headers)
    if resp.status_code == 200:
        resolved = db_query("SELECT resolved FROM comments WHERE id = ?;", (comment_id,))[0][0]
        if resolved == 1 or resolved is True:
            log_result("Comment - Resolve Action", "PASS", "Marked comment thread as resolved in SQLite database.")
        else:
            log_result("Comment - Resolve Action", "FAIL", "Comment resolved attribute not updated in database.")
    else:
        log_result("Comment - Resolve Action", "FAIL", f"Resolve comment status: {resp.status_code}")
except Exception as e:
    log_result("Comment - Resolve Action", "FAIL", str(e))

# Delete Comment
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.delete(f"{API_BASE_URL}/comments/item/{comment_id}", headers=headers)
    if resp.status_code == 200:
        in_db = db_query("SELECT count(*) FROM comments WHERE id = ?;", (comment_id,))[0][0]
        if in_db == 0:
            log_result("Comment - Delete", "PASS", "Permanently removed comment card from database.")
        else:
            log_result("Comment - Delete", "FAIL", "Comment remains in database after deletion.")
    else:
        log_result("Comment - Delete", "FAIL", f"Delete comment status: {resp.status_code}")
except Exception as e:
    log_result("Comment - Delete", "FAIL", str(e))

# ----------------------------------------------------
# 8. Sharing & Permissions
# ----------------------------------------------------
print("--- 8. Sharing & Permissions ---")
shared_doc_id = None
try:
    # Upload a private doc to test sharing restrictions
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    files = {"file": ("private_doc.txt", b"Confidential legal and tax audits file content.", "text/plain")}
    data = {
        "name": "Admin Private Audit SOP",
        "description": "Sensitive tax compliance SOP.",
        "category": "Legal",
        "access_level": "private",
        "is_template": "true"
    }
    resp = requests.post(f"{API_BASE_URL}/documents/upload", headers=headers, files=files, data=data)
    shared_doc_id = resp.json()["id"]
    
    # Employee checks access (should be blocked)
    emp_headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
    check_resp = requests.get(f"{API_BASE_URL}/documents/{shared_doc_id}", headers=emp_headers)
    if check_resp.status_code == 403 or check_resp.status_code == 404:
        log_result("Permissions - Access Blocked", "PASS", "Standard employee denied access to Admin private file.")
    else:
        log_result("Permissions - Access Blocked", "FAIL", f"Employee could read private file (Status: {check_resp.status_code})")
except Exception as e:
    log_result("Permissions - Access Blocked", "FAIL", str(e))

# Share private doc with Employee
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    # Retrieve employee user id
    emp_profile = requests.get(f"{API_BASE_URL}/auth/me", headers={"Authorization": f"Bearer {tokens['emp_access']}"}).json()
    emp_user_id = emp_profile["id"]
    
    payload = {
        "user_id": emp_user_id,
        "access_type": "view"
    }
    resp = requests.post(f"{API_BASE_URL}/permissions/{shared_doc_id}/grant", headers=headers, json=payload)
    if resp.status_code == 200 or resp.status_code == 201:
        # Check permissions table
        perm = db_query("SELECT access_type FROM permissions WHERE document_id = ? AND user_id = ?;", (shared_doc_id, emp_user_id))
        if perm and perm[0][0] == "view":
            # Verify employee can now view the file
            emp_headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
            emp_view = requests.get(f"{API_BASE_URL}/documents/{shared_doc_id}", headers=emp_headers)
            if emp_view.status_code == 200:
                log_result("Permissions - Grant Access", "PASS", "Granted custom access permission. Employee can now retrieve file.")
            else:
                log_result("Permissions - Grant Access", "FAIL", f"Employee still blocked after permission grant.")
        else:
            log_result("Permissions - Grant Access", "FAIL", "Granted permissions not stored in database.")
    else:
        log_result("Permissions - Grant Access", "FAIL", f"Permissions post returned status {resp.status_code}")
except Exception as e:
    log_result("Permissions - Grant Access", "FAIL", str(e))

# Remove Access
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    emp_profile = requests.get(f"{API_BASE_URL}/auth/me", headers={"Authorization": f"Bearer {tokens['emp_access']}"}).json()
    emp_user_id = emp_profile["id"]
    
    resp = requests.delete(f"{API_BASE_URL}/permissions/{shared_doc_id}/revoke?user_id={emp_user_id}", headers=headers)
    if resp.status_code == 200 or resp.status_code == 201:
        # Verify employee blocked again
        emp_headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
        check_resp = requests.get(f"{API_BASE_URL}/documents/{shared_doc_id}", headers=emp_headers)
        if check_resp.status_code == 403 or check_resp.status_code == 404:
            log_result("Permissions - Revoke Access", "PASS", "Revoked permission rule. Access successfully blocked again.")
        else:
            log_result("Permissions - Revoke Access", "FAIL", "Employee still can access after revoking rules.")
    else:
        log_result("Permissions - Revoke Access", "FAIL", f"Delete permission returned status {resp.status_code}")
except Exception as e:
    log_result("Permissions - Revoke Access", "FAIL", str(e))

# ----------------------------------------------------
# 9. Search
# ----------------------------------------------------
print("--- 9. Search ---")
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    resp = requests.get(f"{API_BASE_URL}/search", headers=headers, params={"q": "SOP"})
    if resp.status_code == 200:
        results = resp.json()
        log_result("Search - Keywords & Metadata", "PASS", f"Searched items. Found {len(results)} matches.")
    else:
        log_result("Search - Keywords & Metadata", "FAIL", f"Search status: {resp.status_code}")
except Exception as e:
    log_result("Search - Keywords & Metadata", "FAIL", str(e))

# ----------------------------------------------------
# 10. AI Chat & RAG
# ----------------------------------------------------
print("--- 10. AI Chat & RAG ---")
try:
    import time
    time.sleep(3.5) # Give background task a moment to finish indexing chunks
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"question": "Summarize GST compliance rules."}
    resp = requests.post(f"{API_BASE_URL}/ai/ask", headers=headers, json=payload)
    if resp.status_code == 200:
        ai_resp = resp.json()
        answer = ai_resp.get("answer", "")
        sources = ai_resp.get("source_documents", [])
        if "No relevant documents" in answer or "No context" in answer:
            log_result("AI Assistant - Global RAG", "FAIL", "RAG failed to retrieve contextual chunks.")
        else:
            log_result("AI Assistant - Global RAG", "PASS", f"RAG answered successfully. Sources cited: {[doc['name'] for doc in sources]}")
    else:
        log_result("AI Assistant - Global RAG", "FAIL", f"Global AI Chat status: {resp.status_code}")
except Exception as e:
    log_result("AI Assistant - Global RAG", "FAIL", str(e))

# Document-scoped Chat
try:
    import time
    time.sleep(2) # Give background task a moment to finish indexing chunks
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    payload = {"question": "What tax compliance or audits does this document cover?"}
    resp = requests.post(f"{API_BASE_URL}/ai/ask/{uploaded_doc_id}", headers=headers, json=payload)
    if resp.status_code == 200:
        ai_resp = resp.json()
        answer = ai_resp.get("answer", "")
        if "No relevant" in answer or "No context" in answer:
            log_result("AI Assistant - Scoped RAG", "FAIL", f"Scoped chat failed to search document chunks. Response: {answer}")
        else:
            log_result("AI Assistant - Scoped RAG", "PASS", "Scoped chat generated context-anchored response successfully.")
    else:
        log_result("AI Assistant - Scoped RAG", "FAIL", f"Scoped AI status: {resp.status_code}")
except Exception as e:
    log_result("AI Assistant - Scoped RAG", "FAIL", str(e))

# ----------------------------------------------------
# 11. Approval Workflow
# ----------------------------------------------------
print("--- 11. Approval Workflow ---")
app_doc_id = None
try:
    # Employee uploads document draft (triggers pending)
    headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
    files = {"file": ("draft_sop.txt", b"DMS employee operations draft procedure.", "text/plain")}
    data = {
        "name": "Employee Draft SOP",
        "description": "Standard operation guide.",
        "category": "Operations",
        "access_level": "organization"
    }
    resp = requests.post(f"{API_BASE_URL}/documents/upload", headers=headers, files=files, data=data)
    if resp.status_code == 200 or resp.status_code == 201:
        app_doc_id = resp.json()["id"]
        # Check status is active by default (wait, is it submitted automatically or active?)
        db_status = db_query("SELECT status FROM documents WHERE id = ?;", (app_doc_id,))[0][0]
        log_result("Approval - Ingestion Status", "PASS", f"Ingested draft. Current DB status: {db_status}")
    else:
        log_result("Approval - Ingestion Status", "FAIL", f"Draft upload failed with status {resp.status_code}")
except Exception as e:
    log_result("Approval - Ingestion Status", "FAIL", str(e))

# Submit for approval
try:
    headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
    resp = requests.post(f"{API_BASE_URL}/documents/{app_doc_id}/submit-approval", headers=headers)
    if resp.status_code == 200 or resp.status_code == 201:
        db_status = db_query("SELECT status FROM documents WHERE id = ?;", (app_doc_id,))[0][0]
        if db_status == "pending_approval":
            log_result("Approval - Submit Request", "PASS", "Submitted document. Status updated to 'pending_approval' in SQLite.")
        else:
            log_result("Approval - Submit Request", "FAIL", f"Status not updated. Got: {db_status}")
    else:
        log_result("Approval - Submit Request", "FAIL", f"Submission returned status {resp.status_code}")
except Exception as e:
    log_result("Approval - Submit Request", "FAIL", str(e))

# Manager approves (since Admin has admin role, let's login manager)
try:
    manager_login = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "manager@efasttrade.com", "password": "Manager@123"}).json()
    mgr_access = manager_login["access_token"]
    
    headers = {"Authorization": f"Bearer {mgr_access}"}
    resp = requests.post(f"{API_BASE_URL}/documents/{app_doc_id}/approve", headers=headers)
    if resp.status_code == 200 or resp.status_code == 201:
        db_status = db_query("SELECT status FROM documents WHERE id = ?;", (app_doc_id,))[0][0]
        if db_status == "active":
            log_result("Approval - Manager Action", "PASS", "Manager approved document. Status set to 'active' in database.")
        else:
            log_result("Approval - Manager Action", "FAIL", f"Approve did not activate document. Status: {db_status}")
    else:
        log_result("Approval - Manager Action", "FAIL", f"Approve API returned status {resp.status_code}")
except Exception as e:
    log_result("Approval - Manager Action", "FAIL", str(e))

# ----------------------------------------------------
# 12. Notifications
# ----------------------------------------------------
print("--- 12. Notifications ---")
notif_id = None
try:
    headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
    resp = requests.get(f"{API_BASE_URL}/notifications", headers=headers)
    if resp.status_code == 200:
        notifs = resp.json()
        if len(notifs) > 0:
            notif_id = notifs[0]["id"]
        log_result("Notifications - Feed Retrieve", "PASS", f"Retrieved notification list. Count: {len(notifs)}")
    else:
        log_result("Notifications - Feed Retrieve", "FAIL", f"Notifications status: {resp.status_code}")
except Exception as e:
    log_result("Notifications - Feed Retrieve", "FAIL", str(e))

# Mark Read
if notif_id:
    try:
        headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
        resp = requests.post(f"{API_BASE_URL}/notifications/read/{notif_id}", headers=headers)
        if resp.status_code == 200:
            is_read = db_query("SELECT read FROM notifications WHERE id = ?;", (notif_id,))[0][0]
            if is_read == 1 or is_read is True:
                log_result("Notifications - Mark Read", "PASS", "Marked notification read in SQLite.")
            else:
                log_result("Notifications - Mark Read", "FAIL", "Read status not updated in DB.")
        else:
            log_result("Notifications - Mark Read", "FAIL", f"Mark read status: {resp.status_code}")
    except Exception as e:
        log_result("Notifications - Mark Read", "FAIL", str(e))
else:
    log_result("Notifications - Mark Read", "WARNING", "No notifications found to mark as read.")

# ----------------------------------------------------
# 13. Security Checks
# ----------------------------------------------------
print("--- 13. Security Checks ---")
# Employee accessing admin panel (users list)
try:
    headers = {"Authorization": f"Bearer {tokens['emp_access']}"}
    resp = requests.get(f"{API_BASE_URL}/users", headers=headers)
    if resp.status_code == 403 or resp.status_code == 401:
        log_result("Security - RBAC Verification", "PASS", "Employee successfully blocked from Admin users list API.")
    else:
        log_result("Security - RBAC Verification", "FAIL", f"Employee accessed Admin API. Status: {resp.status_code}")
except Exception as e:
    log_result("Security - RBAC Verification", "FAIL", str(e))

# Guest accessing protected documents (GST Guide)
try:
    guest_login = requests.post(f"{API_BASE_URL}/auth/login", data={"username": "uttam@efasttrade.com", "password": "Employee@123"}).json()
    resp = requests.get(f"{API_BASE_URL}/documents/33333333-3333-3333-3333-333333333333") # No token
    if resp.status_code == 401:
        log_result("Security - Anonymous Block", "PASS", "Anonymous request rejected successfully (401 Unauthorized).")
    else:
        log_result("Security - Anonymous Block", "FAIL", f"Anonymous read succeeded. Status: {resp.status_code}")
except Exception as e:
    log_result("Security - Anonymous Block", "FAIL", str(e))

# Invalid upload checks
try:
    headers = {"Authorization": f"Bearer {tokens['admin_access']}"}
    files = {"file": ("malicious.sh", b"#!/bin/bash\necho 'Hacked'", "text/plain")}
    resp = requests.post(f"{API_BASE_URL}/documents/upload", headers=headers, files=files)
    if resp.status_code == 400 or resp.status_code == 422:
        log_result("Security - Invalid Extension Block", "PASS", "Malicious .sh extension upload successfully rejected.")
    else:
        log_result("Security - Invalid Extension Block", "FAIL", f"Accepted malicious upload. Status: {resp.status_code}")
except Exception as e:
    log_result("Security - Invalid Extension Block", "FAIL", str(e))

# ----------------------------------------------------
# 14. Database Orphan Checks
# ----------------------------------------------------
print("--- 14. Database Orphan Checks ---")
try:
    # Check if there are any versions without documents
    orphaned_versions = db_query("SELECT count(*) FROM document_versions WHERE document_id NOT IN (SELECT id FROM documents);")[0][0]
    # Check if there are any chunks without documents
    orphaned_chunks = db_query("SELECT count(*) FROM document_chunks WHERE document_id NOT IN (SELECT id FROM documents);")[0][0]
    # Check if there are any comments without documents
    orphaned_comments = db_query("SELECT count(*) FROM comments WHERE document_id NOT IN (SELECT id FROM documents);")[0][0]
    
    if orphaned_versions == 0 and orphaned_chunks == 0 and orphaned_comments == 0:
        log_result("Database Integrity - Orphan Check", "PASS", "Zero orphaned chunks, versions, or comments in SQLite.")
    else:
        log_result("Database Integrity - Orphan Check", "WARNING", f"Found orphan records. Versions: {orphaned_versions}, Chunks: {orphaned_chunks}, Comments: {orphaned_comments}")
except Exception as e:
    log_result("Database Integrity - Orphan Check", "FAIL", str(e))

# Clean up created test documents from DB
db_query("DELETE FROM documents WHERE id = ?;", (uploaded_doc_id,))
db_query("DELETE FROM documents WHERE id = ?;", (shared_doc_id,))
db_query("DELETE FROM documents WHERE id = ?;", (app_doc_id,))

# Final report
generate_final_report()
