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
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(503, `Network connection failed: the server is offline or unreachable (${message})`);
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
    restore: async (id: string) => apiRequest(`/documents/${id}/restore`, { method: "POST" }),
    favorite: async (id: string) => apiRequest(`/documents/${id}/favorite`, { method: "POST" }),
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
    getPending: async () => apiRequest("/documents/pending"),
    getTemplates: async () => apiRequest("/documents/templates"),
    getPublic: async (id: string) => apiRequest(`/documents/public/${id}`),
    downloadPublic: async (id: string): Promise<Blob> => apiRequest(`/documents/public/${id}/download`),
    submitApproval: async (id: string) => apiRequest(`/documents/${id}/submit-approval`, { method: "POST" }),
    approve: async (id: string) => apiRequest(`/documents/${id}/approve`, { method: "POST" }),
    reject: async (id: string, remarks: string) => apiRequest(`/documents/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejection_remarks: remarks }),
    }),
    viewVersion: async (id: string, ver: number) => apiRequest(`/documents/${id}/versions/${ver}/view`),
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
  comments: {
    list: async (docId: string) => apiRequest(`/comments/${docId}`),
    create: async (docId: string, payload: { content: string; parent_id?: number }) => apiRequest(`/comments/${docId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    resolve: async (commentId: number) => apiRequest(`/comments/resolve/${commentId}`, { method: "POST" }),
    delete: async (commentId: number) => apiRequest(`/comments/item/${commentId}`, { method: "DELETE" }),
  },
  notifications: {
    list: async () => apiRequest("/notifications"),
    create: async (payload: { user_email: string; title: string; message: string; type?: string }) => apiRequest("/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    read: async (notifId: number) => apiRequest(`/notifications/read/${notifId}`, { method: "POST" }),
    readAll: async () => apiRequest("/notifications/read-all", { method: "POST" }),
    clearAll: async () => apiRequest("/notifications/clear-all", { method: "POST" }),
    delete: async (notifId: number) => apiRequest(`/notifications/${notifId}`, { method: "DELETE" }),
  },
};
