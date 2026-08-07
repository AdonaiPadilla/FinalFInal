import axios from 'axios';

const API_URL = 'http://192.168.137.82:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

export default api;