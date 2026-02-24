import axios from 'axios'

const apiAdminInstance = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  baseURL: process.env.NEXT_PUBLIC_APP_URL
  // headers: {
  //   'Content-Type': 'multipart/form-data'
  // }
})

export const api = apiAdminInstance;

apiAdminInstance.interceptors.request.use(
  async config => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config;
  },
  error => Promise.reject(error)
);

apiAdminInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  error => {
    const { response } = error;

    if (response?.status === 401) {
      // optional: avoid infinite redirect
      if (window.location.pathname !== '/signin') {
        localStorage.removeItem('auth_token');
        window.location.replace('/signin');
      }
    }
    return Promise.reject(error);
  }
);
