import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (email, password) => {
  const res = await api.post("/login", { email, password });
  return res.data;
};

export const registerUser = async (payload) => {
  const res = await api.post("/register", payload);
  return res.data;
};

export const uploadResume = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(`/upload_resume`, formData, {
    params: { user_id: userId },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getSystemStatus = async () => {
  const res = await api.get("/system_status");
  return res.data;
};

export const getOpportunities = async () => {
  const res = await api.get("/opportunities");
  return res.data;
};

export const getOpportunity = async (opportunityId) => {
  const res = await api.get(`/opportunities/${opportunityId}`);
  return res.data;
};

export const getEligibleOpportunities = async (userId) => {
  const res = await api.get(`/eligible_opportunities/${userId}`);
  return res.data;
};

export const getDeadlines = async () => {
  const res = await api.get("/deadline_soon");
  return res.data;
};

export const getUserMatches = async (userId) => {
  const res = await api.get(`/user_matches/${userId}`);
  return res.data;
};

export const patchUser = async (userId, payload) => {
  const res = await api.patch(`/user/${userId}`, payload);
  return res.data;
};

/** Fetch current user from backend (use after refresh or on new device so skills/eligibility are up to date). */
export const getMe = async () => {
  const res = await api.get("/me");
  return res.data;
};

export default api;

