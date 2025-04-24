import axios from 'axios';

// Use environment variable for API URL or the deployed URL as fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://yap-yap-rw97.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const generateToken = (userId) => api.post('/auth/token', { userId });
export const validateToken = (token) => api.get('/auth/validate', {
  headers: { Authorization: `Bearer ${token}` }
});

// Users API
export const getUsers = () => api.get('/users');
export const validatePhone = (phone) => api.get(`/users/validate/${phone}`);
export const createUser = (userData) => api.post('/users', userData);

// Chats API
export const getUserChats = (userId) => api.get(`/chats/${userId}`);
export const createChat = (chatData) => api.post('/chats', chatData);
export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`);

// Messages API
export const getChatMessages = (chatId, limit = 20, lastMessageId = null) => {
  let url = `/messages/${chatId}?limit=${limit}`;
  if (lastMessageId) {
    url += `&lastMessageId=${lastMessageId}`;
  }
  return api.get(url);
};
export const sendMessage = (messageData) => api.post('/messages', messageData);

export default api;