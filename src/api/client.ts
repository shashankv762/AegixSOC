import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Add a request interceptor to include the JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('soc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API returned 401 Unauthorized. Token may be expired.');
      // We no longer aggressively log out here because Firebase handles token refresh.
      // If the user is truly unauthorized, Firebase's onIdTokenChanged will fire with null.
    }
    return Promise.reject(error);
  }
);

export const api = {
  login: (username, password) => client.post('/auth/login', { username, password }),
  getLogs: (params = {}) => client.get('/logs', { params }),
  getStats: () => client.get('/logs/stats'),
  getAlerts: (params = {}) => client.get('/alerts', { params }),
  getAlert: (id) => client.get(`/alerts/${id}`),
  acknowledgeAlert: (id, acknowledged) => client.patch(`/alerts/${id}/acknowledge`, { acknowledged }),
  getSettings: () => client.get('/alerts/settings'),
  updateSettings: (settings) => client.post('/alerts/settings', settings),
  sendChatMessage: (message, context_alert_id = null) => client.post('/chat', { message, context_alert_id }),
  getChatHistory: () => client.get('/chat/history'),
  searchChatHistory: (query) => client.get('/chat/search', { params: { q: query } }),
  getChatContext: (alertId) => client.get(`/chat/context/${alertId}`),
  saveChatHistory: (role, content) => client.post('/chat/history', { role, content }),
  getProcesses: () => client.get('/system/processes'),
  getNetwork: () => client.get('/system/network'),
  getHealth: () => client.get('/health'),
  getUsers: () => client.get('/users'),
  createUser: (userData) => client.post('/users', userData),
  updateUser: (id, userData) => client.put(`/users/${id}`, userData),
  deleteUser: (id) => client.delete(`/users/${id}`),
  
  // IPS Endpoints
  getBlockedIps: () => client.get('/ips/blocked'),
  blockIp: (ip, reason) => client.post('/ips/block', { ip, reason }),
  unblockIp: (ip) => client.delete(`/ips/unblock/${ip}`),

  // Phase 1 Endpoints
  getPhase1Threats: () => client.get('/phase1/threats'),
  getPhase1Layers: () => client.get('/phase1/layers'),
  getPhase1Memory: () => client.get('/phase1/memory'),

  // Sentinel AI Brain
  getSentinelHistory: () => client.get('/sentinel/history')
};
