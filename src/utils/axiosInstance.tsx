import axios from 'axios'

const apiAdminInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // headers: {
  //   'Content-Type': 'multipart/form-data'
  // }
})

export const api = apiAdminInstance;

apiAdminInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('auth_token');
    // const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
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

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
