import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fly2gether_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
