import apiClient from "./apiClient";

export interface UserActivityLog {
  id: number;
  userId: string;
  groupId?: number;
  action: string;
  targetType: string;
  targetId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string };
  group?: { name: string };
}

// Ambil semua log (dengan filter optional)
const getActivityLogs = async (params?: {
  userId?: string;
  groupId?: string;
  action?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.userId) query.append("userId", params.userId);
  if (params?.groupId) query.append("groupId", params.groupId);
  if (params?.action) query.append("action", params.action);

  const res = await apiClient.get(
    `/user-activity${query.toString() ? `?${query.toString()}` : ""}`
  );
  return res.data;
};

// Ambil detail log per ID
const getActivityLogById = async (id: number) => {
  const res = await apiClient.get(`/user-activity/${id}`);
  return res.data;
};

// Buat log manual (opsional)
const createActivityLog = async (_data: {
  userId: string;
  groupId?: number;
  action: string;
  targetType: string;
  targetId?: string;
  description?: string;
}) => {
  const res = await apiClient.post(
    "/user-activity",
    _data
  );
  return res.data;
};

// Hapus log tertentu (opsional)
const deleteActivityLog = async (id: number) => {
  const res = await apiClient.delete(`/user-activity/${id}`);
  return res.data;
};

export const userActivityService = {
  getActivityLogs,
  getActivityLogById,
  createActivityLog,
  deleteActivityLog,
};
