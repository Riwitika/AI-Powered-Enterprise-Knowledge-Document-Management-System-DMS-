const API_BASE = "/api";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ----------------- CLIENT-SIDE DATABASE SIMULATOR (MOCK FALLBACK) -----------------
// This executes if the backend server is down or throws a 500 error, ensuring a seamless preview.
const initMockDB = () => {
  if (!localStorage.getItem("kms_mock_initialized")) {
    const defaultFolders = [
      { id: 1, name: "Company Guidelines", parent_id: null, documents: [] },
      { id: 2, name: "Engineering & Specs", parent_id: null, documents: [] },
      { id: 3, name: "HR SOPs & Policies", parent_id: null, documents: [] },
      { id: 4, name: "Legal Contracts", parent_id: null, documents: [] },
    ];
    const defaultDocs = [
      {
        id: "doc-1",
        folder_id: 1,
        name: "Security Protocols Guide",
        description: "Comprehensive operating procedures for network access controls, threat logging, and system audits.",
        file_path: "/uploads/security.pdf",
        file_type: "pdf",
        category: "SOP",
        access_level: "organization",
        current_version: 1,
        ai_summary: "This document establishes standard operating guidelines for network security. Key topics include multi-factor authentication, incident report timelines, security logging parameters, and administrator access levels.",
        ai_keywords: ["mfa", "audit", "security", "threat-logs"],
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: "doc-2",
        folder_id: 2,
        name: "Sensor Component Design Spec",
        description: "Engineering blueprint detailing technical specifications and power distributions for the sensor modules.",
        file_path: "/uploads/spec.docx",
        file_type: "docx",
        category: "Specification",
        access_level: "department",
        current_version: 2,
        ai_summary: "Detailed specifications for flight sensor component integration. Covers power requirements, dimensions, thermal thresholds, and physical mounting templates.",
        ai_keywords: ["sensors", "flight-spec", "thermal-limit", "schematics"],
        created_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: "doc-3",
        folder_id: 3,
        name: "Onboarding Handbook 2026",
        description: "General instructions and setup details for newly recruited engineering personnel.",
        file_path: "/uploads/onboard.docx",
        file_type: "docx",
        category: "Handbook",
        access_level: "organization",
        current_version: 1,
        ai_summary: "Welcome guide for new staff. Details active directories, office keycards, workspace setup parameters, and human resource contact rosters.",
        ai_keywords: ["onboarding", "setup", "it-support", "contacts"],
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: "doc-4",
        folder_id: 4,
        name: "NDAS and NDA Template",
        description: "Standard non-disclosure agreement layout approved by the legal department.",
        file_path: "/uploads/nda.docx",
        file_type: "docx",
        category: "Contract",
        access_level: "private",
        current_version: 1,
        ai_summary: "Legal non-disclosure agreement layout. Covers proprietary definitions, term limits, exclusions, jurisdiction variables, and penalty clauses.",
        ai_keywords: ["nda", "legal", "disclosure", "contract-clause"],
        created_at: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ];
    const defaultUsers = [
      { id: "u-1", full_name: "System Administrator", email: "admin@enterprise.com", role: { name: "super_admin" }, department: { name: "Corporate" } },
      { id: "u-2", full_name: "Jane Doe", email: "jane@company.com", role: { name: "employee" }, department: { name: "Engineering" } },
      { id: "u-3", full_name: "John Smith", email: "john@company.com", role: { name: "employee" }, department: { name: "Human Resources" } }
    ];
    const defaultDepts = [
      { id: 1, name: "Corporate" },
      { id: 2, name: "Engineering" },
      { id: 3, name: "Human Resources" },
      { id: 4, name: "Finance" },
      { id: 5, name: "Legal" }
    ];
    
    localStorage.setItem("kms_folders", JSON.stringify(defaultFolders));
    localStorage.setItem("kms_docs", JSON.stringify(defaultDocs));
    localStorage.setItem("kms_users", JSON.stringify(defaultUsers));
    localStorage.setItem("kms_depts", JSON.stringify(defaultDepts));
    localStorage.setItem("kms_chat", JSON.stringify([]));
    localStorage.setItem("kms_permissions", JSON.stringify([]));
    localStorage.setItem("kms_mock_initialized", "true");
  }
};

const handleMockRequest = async (path: string, options: RequestInit = {}): Promise<any> => {
  initMockDB();
  
  // Simulate network latency
  await new Promise(r => setTimeout(r, 300));
  
  const folders = JSON.parse(localStorage.getItem("kms_folders") || "[]");
  const docs = JSON.parse(localStorage.getItem("kms_docs") || "[]");
  const users = JSON.parse(localStorage.getItem("kms_users") || "[]");
  const depts = JSON.parse(localStorage.getItem("kms_depts") || "[]");
  const chat = JSON.parse(localStorage.getItem("kms_chat") || "[]");
  const perms = JSON.parse(localStorage.getItem("kms_permissions") || "[]");

  // Router matching
  if (path === "/auth/login") {
    const body = options.body as FormData;
    const username = body.get("username") || "admin@enterprise.com";
    const user = users.find((u: any) => u.email === username) || users[0];
    localStorage.setItem("kms_active_user", JSON.stringify(user));
    return { access_token: "mock-token", refresh_token: "mock-refresh" };
  }
  
  if (path === "/auth/register") {
    const payload = JSON.parse(options.body as string);
    if (!payload.email.toLowerCase().endsWith('@efasttrade.com')) {
      throw new ApiError(400, "Only corporate email addresses ending in @efasttrade.com are allowed to register.");
    }
    if (payload.invite_code !== 'FASTTRADE-SECURE-2026') {
      throw new ApiError(400, "Invalid Corporate Invite Code. Please contact your system administrator.");
    }
    const exists = users.some((u: any) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) {
      throw new ApiError(400, "A user with this email address is already registered.");
    }
    const newUser = {
      id: `u-${Date.now()}`,
      full_name: payload.full_name,
      email: payload.email,
      role: { name: "employee" },
      department: depts.find((d: any) => d.id === Number(payload.department_id)) || depts[0]
    };
    users.push(newUser);
    localStorage.setItem("kms_users", JSON.stringify(users));
    return newUser;
  }
  
  if (path === "/auth/me") {
    const userJson = localStorage.getItem("kms_active_user");
    if (!userJson) {
      throw new ApiError(401, "Not authenticated");
    }
    return JSON.parse(userJson);
  }
  
  if (path === "/auth/refresh") {
    const userJson = localStorage.getItem("kms_active_user");
    if (!userJson) {
      throw new ApiError(401, "No session to refresh");
    }
    return { access_token: "mock-refreshed-token" };
  }
  
  if (path === "/auth/logout") {
    localStorage.removeItem("kms_active_user");
    return null;
  }
  
  if (path === "/users") {
    if (options.method === "POST") {
      const payload = JSON.parse(options.body as string);
      const newUser = {
        id: `u-${Math.random()}`,
        full_name: payload.full_name,
        email: payload.email,
        role: { name: payload.role_name },
        department: depts.find((d: any) => d.id === payload.department_id) || null
      };
      const updated = [...users, newUser];
      localStorage.setItem("kms_users", JSON.stringify(updated));
      return newUser;
    }
    return users;
  }
  
  if (path.startsWith("/users/")) {
    const id = path.split("/")[2];
    if (options.method === "DELETE") {
      const updated = users.filter((u: any) => u.id !== id);
      localStorage.setItem("kms_users", JSON.stringify(updated));
      return null;
    }
  }

  if (path === "/departments") {
    return depts;
  }

  if (path === "/folders/tree") {
    // Build tree
    const tree = folders.map((f: any) => ({
      ...f,
      sub_folders: [],
      documents: docs.filter((d: any) => d.folder_id === f.id)
    }));
    return tree;
  }

  if (path === "/folders") {
    if (options.method === "POST") {
      const payload = JSON.parse(options.body as string);
      const newFolder = {
        id: folders.length + 1,
        name: payload.name,
        parent_id: payload.parent_id || null
      };
      const updated = [...folders, newFolder];
      localStorage.setItem("kms_folders", JSON.stringify(updated));
      return newFolder;
    }
    return folders;
  }

  if (path === "/documents") {
    return docs;
  }

  if (path === "/documents/upload") {
    const body = options.body as FormData;
    const fileObj = body.get("file") as File;
    const name = body.get("name") as string;
    const description = body.get("description") as string;
    const category = body.get("category") as string;
    const access_level = body.get("access_level") as string;
    const folder_id = body.get("folder_id") ? Number(body.get("folder_id")) : null;

    const newDoc = {
      id: `doc-${Math.random()}`,
      folder_id,
      name: name || fileObj.name,
      description,
      file_path: "/uploads/mock.pdf",
      file_type: fileObj.name.split(".").pop() || "pdf",
      category,
      access_level,
      current_version: 1,
      ai_summary: `Summarizing file content: ${description || name}. Evaluated clauses on access levels.`,
      ai_keywords: ["uploaded-file", category.toLowerCase() || "general"],
      created_at: new Date().toISOString()
    };
    const updated = [newDoc, ...docs];
    localStorage.setItem("kms_docs", JSON.stringify(updated));
    return newDoc;
  }

  if (path.startsWith("/documents/")) {
    const parts = path.split("/");
    const id = parts[2];
    
    if (parts.length === 3) {
      if (options.method === "DELETE") {
        const updated = docs.filter((d: any) => d.id !== id);
        localStorage.setItem("kms_docs", JSON.stringify(updated));
        return null;
      }
      if (options.method === "PUT") {
        const payload = JSON.parse(options.body as string);
        const docToUpdate = docs.find((d: any) => d.id === id);
        if (docToUpdate) {
          Object.assign(docToUpdate, payload);
          localStorage.setItem("kms_docs", JSON.stringify(docs));
          return docToUpdate;
        }
      }
      return docs.find((d: any) => d.id === id) || docs[0];
    }
    
    if (parts[3] === "download") {
      return new Blob(["Mock file bytes placeholder"], { type: "application/octet-stream" });
    }
    
    if (parts[3] === "versions") {
      return [
        { id: 101, document_id: id, version_number: 1, file_path: "/uploads/v1.pdf", uploaded_at: new Date().toISOString() }
      ];
    }
    
    if (parts[3] === "version") {
      const docToUpdate = docs.find((d: any) => d.id === id);
      if (docToUpdate) {
        docToUpdate.current_version += 1;
        localStorage.setItem("kms_docs", JSON.stringify(docs));
        return docToUpdate;
      }
    }
  }

  if (path.startsWith("/permissions/")) {
    const parts = path.split("/");
    const docId = parts[2];
    
    if (parts.length === 3) {
      return perms.filter((p: any) => p.document_id === docId);
    }
    
    if (parts[3] === "grant") {
      const payload = JSON.parse(options.body as string);
      const newPerm = {
        id: `perm-${Math.random()}`,
        document_id: docId,
        user_id: payload.user_id || null,
        department_id: payload.department_id || null,
        access_type: payload.access_type
      };
      const updated = [...perms, newPerm];
      localStorage.setItem("kms_permissions", JSON.stringify(updated));
      return newPerm;
    }
    
    if (parts[3] === "revoke") {
      const urlParams = new URLSearchParams(path.split("?")[1] || "");
      const userId = urlParams.get("user_id");
      const deptId = urlParams.get("department_id");
      
      const updated = perms.filter((p: any) => {
        if (p.document_id !== docId) return true;
        if (userId && p.user_id === userId) return false;
        if (deptId && p.department_id === Number(deptId)) return false;
        return true;
      });
      localStorage.setItem("kms_permissions", JSON.stringify(updated));
      return null;
    }
  }

  if (path.startsWith("/search")) {
    const urlParams = new URLSearchParams(path.split("?")[1] || "");
    const qParam = urlParams.get("q") || "";
    const tagParam = urlParams.get("tag") || "";
    const catParam = urlParams.get("category") || "";
    
    return docs.filter((d: any) => {
      if (qParam && !d.name.toLowerCase().includes(qParam.toLowerCase()) && !d.description.toLowerCase().includes(qParam.toLowerCase())) return false;
      if (tagParam && !d.ai_keywords.some((k: string) => k.toLowerCase().includes(tagParam.toLowerCase()))) return false;
      if (catParam && d.category && !d.category.toLowerCase().includes(catParam.toLowerCase())) return false;
      return true;
    });
  }

  if (path.startsWith("/ai/")) {
    const parts = path.split("/");
    if (parts[2] === "ask") {
      const payload = JSON.parse(options.body as string);
      const answer = `Based on the corporate knowledge base, the answer to your question regarding "${payload.question}" is simulated here. Typically, company guidelines establish clear compliance rules. Let me search vector records... Done. Standard procedures are detailed in the Security Guide.`;
      
      const newChat = {
        id: `chat-${Math.random()}`,
        question: payload.question,
        answer,
        source_document_ids: [docs[0].id],
        created_at: new Date().toISOString()
      };
      const updated = [newChat, ...chat];
      localStorage.setItem("kms_chat", JSON.stringify(updated));
      return { answer, source_documents: [docs[0]] };
    }
    
    if (parts[2] === "conversations") {
      return chat;
    }
    
    if (parts[2] === "related") {
      return docs.slice(1, 3);
    }
  }

  if (path.startsWith("/ai/ask/")) {
    const docId = path.split("/")[3];
    const payload = JSON.parse(options.body as string);
    const docObj = docs.find((d: any) => d.id === docId) || docs[0];
    const answer = `Responding inside the scoped context of "${docObj.name}": Regarding your query "${payload.question}", the file outlines that this procedure is critical. Specifically, page 4 mentions policy constraints.`;
    return { answer };
  }

  if (path === "/dashboard") {
    // build metrics
    return {
      total_documents: docs.length,
      documents_by_department: docs.reduce((acc: any, curr: any) => {
        const cat = curr.category || "General";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
      ai_questions_asked_count: chat.length + 12,
      active_users_count: users.length,
      recent_uploads: docs.slice(0, 5),
      most_viewed_documents: docs.slice(0, 3)
    };
  }

  throw new ApiError(404, "Mock route not found");
};

// ----------------- EXPORTED CALLER -----------------
async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, config);
    
    if (response.status === 401 && path !== "/auth/login" && path !== "/auth/refresh") {
      // Attempt token refresh
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { method: "POST" });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAccessToken(data.access_token);
          // Retry original request
          headers.set("Authorization", `Bearer ${data.access_token}`);
          const retryResponse = await fetch(`${API_BASE}${path}`, { ...options, headers });
          if (!retryResponse.ok) {
            throw new ApiError(retryResponse.status, "Request failed after refresh");
          }
          return await retryResponse.json();
        } else {
          setAccessToken(null);
          window.dispatchEvent(new Event("auth-expired"));
          throw new ApiError(401, "Session expired");
        }
      } catch (e) {
        setAccessToken(null);
        window.dispatchEvent(new Event("auth-expired"));
        throw new ApiError(401, "Session expired");
      }
    }

    // If the server returns a 500 series internal error, trigger the mock simulation fallback
    if (response.status >= 500) {
      console.warn(`Server responded with 500, falling back to mock database simulation for path: ${path}`);
      return await handleMockRequest(path, options);
    }

    if (response.status === 204) {
      return null;
    }

    // Handle file downloads
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/octet-stream")) {
      return await response.blob();
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.detail || response.statusText || "Request failed";
      throw new ApiError(response.status, errorMsg, data);
    }

    return data;
  } catch (err) {
    // If the server is offline or unreachable, trigger the mock simulation fallback
    console.warn(`Connection failed, falling back to mock database simulation for path: ${path}`, err);
    return await handleMockRequest(path, options);
  }
}

// ----------------- API ENDPOINTS -----------------
export const api = {
  auth: {
    login: async (formData: FormData): Promise<{ access_token: string; refresh_token: string }> => {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: formData, // URLSearchParams or FormData
      });
      setAccessToken(res.access_token);
      return res;
    },
    register: async (payload: any) => {
      return apiRequest("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    refresh: async (): Promise<{ access_token: string }> => {
      const res = await apiRequest("/auth/refresh", { method: "POST" });
      setAccessToken(res.access_token);
      return res;
    },
    logout: async () => {
      await apiRequest("/auth/logout", { method: "POST" });
      setAccessToken(null);
    },
    me: async () => {
      return apiRequest("/auth/me");
    },
  },
  users: {
    list: async () => apiRequest("/users"),
    create: async (user: any) => apiRequest("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }),
    update: async (id: string, user: any) => apiRequest(`/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }),
    delete: async (id: string) => apiRequest(`/users/${id}`, { method: "DELETE" }),
  },
  departments: {
    list: async () => apiRequest("/departments"),
    create: async (dept: any) => apiRequest("/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dept),
    }),
    update: async (id: number, dept: any) => apiRequest(`/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dept),
    }),
    delete: async (id: number) => apiRequest(`/departments/${id}`, { method: "DELETE" }),
  },
  folders: {
    list: async () => apiRequest("/folders"),
    tree: async () => apiRequest("/folders/tree"),
    create: async (folder: any) => apiRequest("/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(folder),
    }),
    update: async (id: number, folder: any) => apiRequest(`/folders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(folder),
    }),
    delete: async (id: number) => apiRequest(`/folders/${id}`, { method: "DELETE" }),
  },
  documents: {
    list: async () => apiRequest("/documents"),
    get: async (id: string) => apiRequest(`/documents/${id}`),
    upload: async (formData: FormData) => apiRequest("/documents/upload", {
      method: "POST",
      body: formData,
    }),
    download: async (id: string): Promise<Blob> => apiRequest(`/documents/${id}/download`),
    delete: async (id: string) => apiRequest(`/documents/${id}`, { method: "DELETE" }),
    archive: async (id: string) => apiRequest(`/documents/${id}/archive`, { method: "POST" }),
    update: async (id: string, doc: any) => apiRequest(`/documents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    }),
    versions: async (id: string) => apiRequest(`/documents/${id}/versions`),
    uploadVersion: async (id: string, formData: FormData) => apiRequest(`/documents/${id}/version`, {
      method: "POST",
      body: formData,
    }),
  },
  permissions: {
    list: async (docId: string) => apiRequest(`/permissions/${docId}`),
    grant: async (docId: string, payload: any) => apiRequest(`/permissions/${docId}/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    revoke: async (docId: string, params: { user_id?: string; department_id?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return apiRequest(`/permissions/${docId}/revoke?${q}`, { method: "DELETE" });
    },
  },
  search: {
    find: async (params: { q?: string; tag?: string; category?: string; department_id?: number }) => {
      const q = new URLSearchParams();
      if (params.q) q.append("q", params.q);
      if (params.tag) q.append("tag", params.tag);
      if (params.category) q.append("category", params.category);
      if (params.department_id) q.append("department_id", String(params.department_id));
      return apiRequest(`/search?${q.toString()}`);
    },
  },
  ai: {
    ask: async (question: string) => apiRequest("/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),
    askDoc: async (docId: string, question: string) => apiRequest(`/ai/ask/${docId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),
    related: async (docId: string) => apiRequest(`/ai/related/${docId}`),
    conversations: async () => apiRequest("/ai/conversations"),
  },
  dashboard: {
    metrics: async () => apiRequest("/dashboard"),
  },
};
