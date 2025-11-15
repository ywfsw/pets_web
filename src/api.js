// (这是 src/api.js 的“匹配 Controller 路由”版)

import axios from 'axios';

// (❗) 1. “环境配置”
const hostname = window.location.hostname;
const isLocal = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '');

let API_BASE_URL;

if (isLocal) {
  // (❗ 核心修复)
  // baseURL 必须是“干净”的, 不包含 /api
  API_BASE_URL = 'http://localhost:8080';
} else {
  // (❗ 核心修复)
  API_BASE_URL = 'https://pets-why3.onrender.com';
}

console.log(`[API Config] 当前环境: ${isLocal ? '本地' : '生产'}, API URL: ${API_BASE_URL}`);

// (❗) 2. “客户端实例”
// (baseURL 现在是干净的: http://localhost:8080)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});


// =================================================================
// (❗) 3. “API 方法”
// (现在, 我们在“每一个”调用里, 都必须“手动”加上 /api)
// (这现在 100% 匹配你的 API 文档)
// =================================================================


// --- 宠物 API ---
export const fetchPetPage = (params = { pageNum: 1, pageSize: 10 }) => {
  // (❗) 请求: GET /api/pets/page
  return apiClient.get('/api/pets/page', { params });
};

export const fetchPetDetail = (petId) => {
  return apiClient.get(`/api/pets/detail/${petId}`);
};

export const createPet = (payload) => {
  return apiClient.post('/api/pets', payload);
};

export const updatePet = (petId, payload) => {
  return apiClient.put(`/api/pets/${petId}`, payload);
};

export const deletePet = (petId) => {
  return apiClient.delete(`/api/pets/${petId}`);
};

// --- 点赞 API ---
export const likePet = (petId) => {
  // (❗) 请求: POST /api/pets/{petId}/like
  return apiClient.post(`/api/pets/${petId}/like`);
};

export const getPetLikeCount = (petId) => {
  // (❗) 请求: GET /api/pets/{petId}/likes/count
  return apiClient.get(`/api/pets/${petId}/likes/count`);
};

// --- 体重 & 健康事件 API ---
export const fetchUpcomingEvents = () => {
  // (❗) 请求: GET /api/health-events/upcoming
  return apiClient.get('/api/health-events/upcoming');
};

export const createWeightLog = (payload) => {
  return apiClient.post('/api/weight-logs', payload);
};

export const createHealthEvent = (payload) => {
  return apiClient.post('/api/health-events', payload);
};


// --- 字典 API ---
export const fetchDictTypeList = () => {
  return apiClient.get('/api/dictTypes');
};

export const fetchDictItemList = (dictCode) => {
  return apiClient.get(`/api/dictItems/code/${dictCode}`);
};

export const fetchDictParentOptions = (dictCode) => {
  if (!dictCode) {
    return Promise.resolve({ data: [] });
  }
  return apiClient.get('/api/dictItems/lookup', {
    params: { dictCode }
  });
};

export const createDictItem = (payload) => {
  return apiClient.post('/api/dictItems', payload);
};

export const fetchDictItemsByCode = (dictCode) => {
  return apiClient.get(`/api/dictItems/code/${dictCode}`);
};

export const fetchPetLeaderboard = (topN = 10) => {
  return apiClient.get('/api/pets/leaderboard', { params: { topN } });
};
