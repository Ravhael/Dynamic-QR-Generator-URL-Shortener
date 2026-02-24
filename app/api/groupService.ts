import apiClient from './apiClient';

const API_URL = "/groups"; // Remove /api because apiClient already has baseURL with /api

export interface GroupPayload extends Record<string, unknown> {
  name: string;
  description?: string;
}

const groupService = {
  getGroups: () => apiClient.get(API_URL),
  createGroup: (_data: GroupPayload) => apiClient.post(API_URL, _data),
  updateGroup: (id: number, _data: GroupPayload) => apiClient.put(`${API_URL}/${id}`, _data),
  deleteGroup: (id: number) => apiClient.delete(`${API_URL}/${id}`),
};

export default groupService;
