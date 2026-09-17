import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('met_access');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — 401 → token yangilash
let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (isRefreshing) {
        return new Promise((res, rej) => queue.push({ res, rej }))
          .then(token => { orig.headers['Authorization'] = `Bearer ${token}`; return api(orig); });
      }
      isRefreshing = true;
      const refresh = await SecureStore.getItemAsync('met_refresh');
      if (!refresh) {
        isRefreshing = false;
        await SecureStore.deleteItemAsync('met_access');
        // Session expired event
        require('../store').default.dispatch({ type: 'auth/logout' });
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
        await SecureStore.setItemAsync('met_access', data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        queue.forEach(({ res }) => res(data.access));
        queue = []; isRefreshing = false;
        orig.headers['Authorization'] = `Bearer ${data.access}`;
        return api(orig);
      } catch (e) {
        queue.forEach(({ rej }) => rej(e));
        queue = []; isRefreshing = false;
        await SecureStore.deleteItemAsync('met_access');
        await SecureStore.deleteItemAsync('met_refresh');
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
