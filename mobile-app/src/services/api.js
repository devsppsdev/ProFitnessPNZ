// mobile-app/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔴 ЗАМЕНИ ЭТОТ IP НА ТВОЙ ТЕКУЩИЙ IP
const API_URL = 'http://192.168.1.105:8080'; // ← ЗАМЕНИ НА СВОЙ IP

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// Перехватчик для токена
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token && config.url.includes('/api/v1/')) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Token error:', error);
        }
        return config;
    }
);

// ✅ ПРАВИЛЬНО - ВСЕ POST запросы с телом

// 1. Филиалы
export const getBranches = () => {
    return api.post('/api/public/branch/list', {
        // Можно пустой объект или с параметрами
        limit: 50,
        page: 1
    });
};

// 2. Расписание
export const getSchedule = (date_from, branch_id) => {
    const payload = {
        date_from,
        limit: 100,
        page: 1
    };
    if (branch_id) payload.branch_id = branch_id; // добавляем только если есть
    return api.post('/api/public/schedule/list', payload);
};

// 3. Тренеры
export const getTeachers = () => {
    return api.post('/api/public/teacher/list', {
        limit: 100,
        page: 1,
        columns: {
            isActive: true
        }
    });
};

// 4. Залы
export const getHalls = () => {
    return api.post('/api/public/hall/list', {
        limit: 10,
        page: 1,
        columns: {
            isActive: true
        }
    });
};

// 5. Авторизация (остается v1)
export const authByPhone = (phone) => {
    return api.post('/api/v1/auth/by-phone', {
        phone: phone  // "+79991234567"
    });
};

// 6. Отправка SMS кода
export const sendSMSCode = (phone) => {
    return api.post('/api/v1/auth/phone', {
        phone: phone
    });
};

// 7. Проверка кода
export const verifyCode = (sessionId, code) => {
    return api.post('/api/v1/auth/verify', {
        session_id: sessionId,
        code: code
    });
};