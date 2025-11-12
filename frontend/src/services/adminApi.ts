import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/api/admin`,
  timeout: 15000
});

let unauthorizedHandler: (() => void) | null = null;

export const setAdminAuthToken = (token: string | null) => {
  if (token) {
    adminApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete adminApi.defaults.headers.common.Authorization;
  }
};

export const setAdminSession = (sessionId: string | null, csrfToken: string | null) => {
  if (sessionId) {
    adminApi.defaults.headers.common['X-Admin-Session'] = sessionId;
  } else {
    delete adminApi.defaults.headers.common['X-Admin-Session'];
  }

  if (csrfToken) {
    adminApi.defaults.headers.common['X-Admin-Csrf'] = csrfToken;
  } else {
    delete adminApi.defaults.headers.common['X-Admin-Csrf'];
  }
};

export const clearAdminSession = () => {
  setAdminSession(null, null);
};

export const onAdminUnauthorized = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

adminApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

export default adminApi;
