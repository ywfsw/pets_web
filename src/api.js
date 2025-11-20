// (这是 src/api.js 的“Cloudinary 签名”升级版)

import axios from 'axios';

// (环境配置... 保持不变)
const hostname = window.location.hostname;
const isLocal = (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '');

let API_BASE_URL;

if (isLocal) {
  // 假设 Spring Boot 运行在 8080
  API_BASE_URL = 'http://localhost:8080';
} else {
  API_BASE_URL = 'https://pets-why3.onrender.com';
}

console.log(`[API Config] 当前环境: ${isLocal ? '本地' : '生产'}, API URL: ${API_BASE_URL}`);

// (baseURL 是干净的，所以下面的所有方法都需要手动加上 /api)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

/**
 * A robust timeout wrapper for promises.
 * @param {Promise} promise The promise to wrap.
 * @param {number} ms The timeout duration in milliseconds.
 * @returns {Promise} A new promise that rejects on timeout.
 */
const withTimeout = (promise, ms = 8000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`请求超时，超过 ${ms / 1000} 秒`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]);
};


// =================================================================
// --- 核心 API 方法 ---
// =================================================================

export const fetchUploadSignature = (params) => {
  return apiClient.post('/api/media/upload-signature', params);
};


// --- 宠物 API ---
export const fetchPetPage = (params = { pageNum: 1, pageSize: 10 }) => {
  // Apply the manual timeout wrapper here as a safeguard.
  return withTimeout(apiClient.get('/api/pets/page', { params }));
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
  return apiClient.post(`/api/pets/${petId}/like`);
};

export const getPetLikeCount = (petId) => {
  return apiClient.get(`/api/pets/${petId}/likes/count`);
};

// --- 体重 & 健康事件 API ---
export const fetchUpcomingEvents = () => {
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

// --- 宠物相册 API ---
export const getAllPetGallery = () => {
  return apiClient.get('/api/petGallery');
};

export const getPetGalleryDetail = (id) => {
  return apiClient.get(`/api/petGallery/${id}`);
};


export const getPetGalleryByPetId = (petId) => {
  return apiClient.get(`/api/petGallery/pet/${petId}`);
};

export const addPetGalleryImage = (payload) => {
  return apiClient.post('/api/petGallery', payload);
};

export const deletePetGalleryImage = (id) => {
  return apiClient.delete(`/api/petGallery/${id}`);
};

export const updatePetGalleryImage = (id, payload) => {
  return apiClient.put(`/api/petGallery/${id}`, payload);
};
