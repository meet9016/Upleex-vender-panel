import axios from 'axios'

const apiAdminInstance = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  baseURL: "https://upleex.2min.cloud/"
  // headers: {
  //   'Content-Type': 'multipart/form-data'
  // }
})

export const api = apiAdminInstance;

apiAdminInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('auth_token') || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NjkwNzU5OTQsImV4cCI6MTA0MDkwNzU5OTQsImRhdGEiOnsidmVuZG9yX2lkIjoiMSIsImVtYWlsIjoiY29udGFjdEBzaG9wbm8uaW4iLCJmdWxsX25hbWUiOiJCaGF2aWsgVmFsYSIsIm51bWJlciI6Ijk5MDk5MjkyOTMiLCJidXNpbmVzc19uYW1lIjoiU0hPUE5PIEVDT01NRVJDRSBQVlQgTFREIiwiaWF0IjoxNzY5MDc1OTk0LCJleHAiOjE3NjkxNjIzOTR9fQ.ztmgM2IiIwl-4I4tOuWQOjUvdfs3uuzPPoMnaVXncnw";
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
