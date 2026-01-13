// js/api.js

const API_BASE = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = '0f1bfb84-07d0-434b-afd5-ee82fb5c1752'; 

/**
 * Универсальная функция для GET-запросов
 * @param {string} endpoint -
 * @returns {Promise<Object[]>}
 */
async function fetchAPI(endpoint) {
    const url = `${API_BASE}${endpoint}?api_key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при запросе к API:', error);
        throw error;
    }
}

/**
 * Универсальная функция для POST/PUT/DELETE-запросов
 * @param {string} endpoint - путь API
 * @param {Object} data - данные для отправки
 * @param {string} method - 'POST', 'PUT', 'DELETE'
 * @returns {Promise<Object>}
 */
async function sendAPI(endpoint, data, method = 'POST') {
    const url = `${API_BASE}${endpoint}?api_key=${API_KEY}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при отправке данных в API:', error);
        throw error;
    }
}

// Экспортируем функции для использования в других файлах
window.API = {
    fetchCourses: () => fetchAPI('/api/courses'),
    fetchTutors: () => fetchAPI('/api/tutors'),
    fetchOrders: () => fetchAPI('/api/orders'),
    createOrder: (orderData) => sendAPI('/api/orders', orderData, 'POST'),
    updateOrder: (orderId, orderData) => sendAPI(`/api/orders/${orderId}`, orderData, 'PUT'),
    deleteOrder: (orderId) => sendAPI(`/api/orders/${orderId}`, {}, 'DELETE'),
};