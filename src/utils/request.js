import axios from 'axios';

// Public Axios instance
export const publicRequest = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://research-collab-backend-agep.onrender.com',
});

// Private Axios instance
export const privateRequest = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://research-collab-backend-agep.onrender.com',
});

// Public interceptor (for logging, etc.)
publicRequest.interceptors.request.use(
  (config) => {
    // You can add custom logic here
    return config;
  },
  (error) => Promise.reject(error)
);

// Private interceptor (for auth, etc.)
privateRequest.interceptors.request.use(
  (config) => {
    // Example: Attach token if available
    const userStr = localStorage.getItem('user');
    let token;
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        token = userObj.token;
      } catch (e) {
        token = undefined;
      }
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
