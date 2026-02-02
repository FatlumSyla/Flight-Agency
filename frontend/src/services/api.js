import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
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

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const flightService = {
    getAll: () => api.get('/flights'),
    search: (params) => api.get('/flights/search', { params }),
    create: (flightData) => api.post('/flights', flightData),
    update: (id, flightData) => api.put(`/flights/${id}`, flightData),
    delete: (id) => api.delete(`/flights/${id}`),
};

export const bookingService = {
    getAll: (params) => api.get('/bookings', { params }),
    create: (bookingData) => api.post('/bookings', bookingData),
    cancel: (id) => api.post(`/bookings/${id}/cancel`),
};

export default api;
