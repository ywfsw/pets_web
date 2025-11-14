// (这是 src/api.js 的“宠物功能”升级版)

import axios from 'axios';

// (环境配置... 保持不变)
const hostname = window.location.hostname;
const isLocal = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '');
let API_BASE_URL;
if (isLocal) {
  API_BASE_URL = 'http://localhost:8080';
} else {
  API_BASE_URL = 'https://pets-why3.onrender.com';
}
console.log(`[API Config] 当前环境: ${isLocal ? '本地' : '生产'}, API URL: ${API_BASE_URL}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});


// --- (❗ 新增) 宠物 API ---
export const fetchPetPage = (params = { pageNum: 1, pageSize: 10 }) => {
  return apiClient.get('/pets/page', { params });
};

export const fetchPetDetail = (petId) => {
  return apiClient.get(`/pets/detail/${petId}`);
};

export const createPet = (payload) => {
  return apiClient.post('/pets', payload);
};

export const updatePet = (petId, payload) => {
  return apiClient.put(`/pets/${petId}`, payload);
};

export const deletePet = (petId) => {
  return apiClient.delete(`/pets/${petId}`);
};

// --- (❗ 新增) 体重 & 健康事件 API ---
export const fetchUpcomingEvents = () => {
  return apiClient.get('/health-events/upcoming');
};

export const createWeightLog = (payload) => {
  return apiClient.post('/weight-logs', payload);
};

export const createHealthEvent = (payload) => {
  return apiClient.post('/health-events', payload);
};


// --- 字典 API (保持不变) ---
export const fetchDictTypeList = () => {
  return apiClient.get('/dictTypes');
};

export const fetchDictItemList = (dictCode) => {
  return apiClient.get(`/dictItems/code/${dictCode}`);
};

export const fetchDictParentOptions = (dictCode) => {
  if (!dictCode) {
    return Promise.resolve({ data: [] });
  }
  return apiClient.get('/dictItems/lookup', {
    params: { dictCode }
  });
};

export const createDictItem = (payload) => {
  return apiClient.post('/dictItems', payload);
};

export const fetchDictItemsByCode = (dictCode) => {
  return apiClient.get(`/dictItems/code/${dictCode}`);
};
