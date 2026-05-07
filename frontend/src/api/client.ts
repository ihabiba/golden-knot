import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

function getToken(key: string) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function setToken(key: string, value: string) {
  if (localStorage.getItem('refresh_token')) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
}

api.interceptors.request.use((config) => {
  const token = getToken('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getToken('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh },
          );
          setToken('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
