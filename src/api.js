// (这是 src/api.js 的"Cloudinary 签名"升级版)

import axios from 'axios';
import { useAuthStore } from '@/stores/authStore.js';

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

// 添加请求拦截器，在请求头中携带 token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    const tokenName = localStorage.getItem('tokenName') || 'satoken';
    if (token) {
      config.headers[tokenName] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器 - 处理 token 过期、无效等错误
apiClient.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;

    // 处理 401 未授权、403 禁止访问等认证错误
    if (response) {
      const status = response.status;
      const errorMsg = response.data?.error || '';

      // token 过期、无效、被踢下线等情况
      if (status === 401 || status === 403 || errorMsg.includes('登录') || errorMsg.includes('token') || errorMsg.includes('Token')) {
        // 尝试获取 authStore 并处理登出
        try {
          const authStore = useAuthStore();
          if (authStore.isAuthenticated) {
            console.warn('检测到登录状态异常，自动登出:', errorMsg);
            authStore.handleTokenInvalid();
          }
        } catch (e) {
          // 如果无法获取 store，直接清除 localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('tokenName');
        }
      }
    }

    return Promise.reject(error);
  }
);

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


// --- 仪表盘 API ---
export const fetchDashboardSummary = () => {
  return apiClient.get('/api/dashboard/summary');
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

export const updateWeightLog = (id, payload) => {
  return apiClient.put(`/api/weight-logs/${id}`, payload);
};

export const deleteWeightLog = (id) => {
  return apiClient.delete(`/api/weight-logs/${id}`);
};

export const createHealthEvent = (payload) => {
  return apiClient.post('/api/health-events', payload);
};

export const updateHealthEvent = (id, payload) => {
  return apiClient.put(`/api/health-events/${id}`, payload);
};

export const deleteHealthEvent = (id) => {
  return apiClient.delete(`/api/health-events/${id}`);
};

export const completeHealthEvent = (id) => {
  return apiClient.patch(`/api/health-events/${id}/complete`);
};

export const uncompleteHealthEvent = (id) => {
  return apiClient.patch(`/api/health-events/${id}/uncomplete`);
};

export const fetchHealthEventsPage = (params = { pageNum: 1, pageSize: 20 }) => {
  return apiClient.get('/api/health-events/page', { params });
};

export const fetchHealthEventsStats = (params = {}) => {
  return apiClient.get('/api/health-events/stats', { params });
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

export const updateDictItem = (id, payload) => {
  return apiClient.put(`/api/dictItems/${id}`, payload);
};

export const deleteDictItem = (id) => {
  return apiClient.delete(`/api/dictItems/${id}`);
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

// --- 喂养记录 API ---
export const fetchFeedingRecordsPage = (params = { pageNum: 1, pageSize: 20 }) => {
  return apiClient.get('/api/feeding-records/page', { params });
};

export const fetchFeedingStats = (params = { days: 30 }) => {
  return apiClient.get('/api/feeding-records/stats', { params });
};

export const createFeedingRecord = (payload) => {
  return apiClient.post('/api/feeding-records', payload);
};

export const updateFeedingRecord = (id, payload) => {
  return apiClient.put(`/api/feeding-records/${id}`, payload);
};

export const deleteFeedingRecord = (id) => {
  return apiClient.delete(`/api/feeding-records/${id}`);
};

// --- Auth API ---
export const login = (payload) => {
  return apiClient.post('/api/auth/login', payload);
};

export const register = (payload) => {
  return apiClient.post('/api/auth/register', payload);
};

export const getUserInfo = () => {
  return apiClient.get('/api/auth/info');
};

export const logout = () => {
  return apiClient.post('/api/auth/logout');
};
