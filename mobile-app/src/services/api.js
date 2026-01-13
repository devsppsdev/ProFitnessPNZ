// mobile-app/src/services/api.js
import axios from 'axios';

// Укажи правильный IP если тестируешь на телефоне
// localhost работает только в браузере/эмуляторе
const API_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

// Отправка SMS кода
export const sendSMSCode = (phone) => {
    console.log('API: Sending code to', phone);
    return api.post('/auth/phone', { phone });
};

// Проверка кода
export const verifyCode = (phone, code) => {
    console.log('API: Verifying code', phone, code);
    return api.post('/auth/verify', { phone, code });
};

// Проверка здоровья сервера
export const checkHealth = () => {
    console.log('API: Checking health');
    return api.get('/health');
};

// Перехватчик ошибок для отладки
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.data);
        return response;
    },
    (error) => {
        console.log('API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        return Promise.reject(error);
    }
);

export default api;