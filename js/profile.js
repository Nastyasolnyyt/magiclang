// js/profile.js

const ORDERS_PER_PAGE = 5;
let allOrders = [];
let currentPage = 1;
let isLoggedIn = false;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, авторизован ли пользователь
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        showAccountScreen();
        loadOrders();
    } else {
        showLoginScreen();
    }

    // Обработчики
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegister);
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        showNotification('Введите email и пароль', 'warning');
        return;
    }

    // Симуляция входа
    currentUser = { email, name: 'Пользователь' };
    isLoggedIn = true;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showAccountScreen();
    loadOrders();
}

function handleRegister() {
    showNotification('Регистрация временно недоступна. Используйте тестовый email: user@example.com', 'info');
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('d-none');
    document.getElementById('account-screen').classList.add('d-none');
}

function showAccountScreen() {
    document.getElementById('login-screen').classList.add('d-none');
    document.getElementById('account-screen').classList.remove('d-none');

    // Пример уведомления о сообщениях
    document.getElementById('messages-alert').classList.remove('d-none');
    setTimeout(() => {
        document.getElementById('messages-alert').classList.add('d-none');
    }, 5000);
}

async function loadOrders() {
    try {
        allOrders = await API.fetchOrders();
        renderOrdersPage(1);
        renderPagination();
        document.getElementById('no-orders-message').classList.toggle('d-none', allOrders.length > 0);
    } catch (e) {
        showNotification('Не удалось загрузить заявки. Проверьте подключение к API.', 'danger');
        console.error(e);
    }
}

function renderOrdersPage(page) {
    currentPage = page;
    const start = (page - 1) * ORDERS_PER_PAGE;
    const slice = allOrders.slice(start, start + ORDERS_PER_PAGE);
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    if (slice.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Нет данных</td></tr>';
        return;
    }

    slice.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${start + index + 1}</td>
            <td>${order.course_name || '—'}</td>
            <td>${formatDate(order.date_start + 'T' + (order.time_start || '00:00'))}</td>
            <td>${order.price} ₽</td>
            <td>
                <button class="btn btn-sm btn-info me-1 detail-btn" data-id="${order.id}">Подробнее</button>
                <button class="btn btn-sm btn-warning me-1 edit-btn" data-id="${order.id}">Изменить</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${order.id}">Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Назначаем обработчики
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openDetailModal(e.target.dataset.id));
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openDeleteModal(e.target.dataset.id));
    });
}

function renderPagination() {
    const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
    const nav = document.getElementById('orders-pagination');
    nav.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            renderOrdersPage(i);
            renderPagination();
        });
        nav.appendChild(li);
    }
}

// --- Модальные окна ---

async function openDetailModal(orderId) {
    const order = allOrders.find(o => o.id == orderId);
    if (!order) return;

    let details = `
        <p><strong>Курс:</strong> ${order.course_name || '—'}</p>
        <p><strong>Дата:</strong> ${formatDate(order.date_start + 'T' + (order.time_start || '00:00'))}</p>
        <p><strong>Студентов:</strong> ${order.persons}</p>
        <p><strong>Стоимость:</strong> ${order.price} ₽</p>
        <h5>Применённые опции:</h5>
        <ul class="list-unstyled">
    `;

    if (order.early_registration) details += '<li>✅ Скидка за раннюю регистрацию (-10%)</li>';
    if (order.group_enrollment) details += '<li>✅ Групповая скидка (-15%)</li>';
    if (order.intensive_course) details += '<li>✅ Интенсивный курс (+20%)</li>';
    if (order.supplementary) details += '<li>✅ Доп. материалы (+2000 ₽/студент)</li>';
    if (order.personalized) details += '<li>✅ Индивидуальные занятия (+1500 ₽/неделя)</li>';
    if (order.excursions) details += '<li>✅ Культурные экскурсии (+25%)</li>';
    if (order.assessment) details += '<li>✅ Оценка уровня (+300 ₽)</li>';
    if (order.interactive) details += '<li>✅ Интерактивная платформа (+50%)</li>';

    details += '</ul>';

    document.getElementById('detail-modal-content').innerHTML = details;
    const modal = new bootstrap.Modal(document.getElementById('detail-modal'));
    modal.show();
}

async function openEditModal(orderId) {
    const order = allOrders.find(o => o.id == orderId);
    if (!order) return;

    // Получаем данные курса для отображения имени
    try {
        const courseResponse = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/courses/${order.course_id}?api_key=0f1bfb84-07d0-434b-afd5-ee82fb5c1752`);
        if (!courseResponse.ok) throw new Error('Ошибка при загрузке курса');
        const course = await courseResponse.json();

        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-course-name').value = course.name;
        document.getElementById('edit-date-start').value = order.date_start;
        document.getElementById('edit-persons').value = order.persons;

        // Заполняем время
        const timeSelect = document.getElementById('edit-time-start');
        timeSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = order.time_start;
        option.textContent = order.time_start;
        timeSelect.appendChild(option);
        timeSelect.value = order.time_start;

        // Чекбоксы
        document.getElementById('edit-early-reg').checked = order.early_registration;
        document.getElementById('edit-group-enroll').checked = order.group_enrollment;
        document.getElementById('edit-intensive').checked = order.intensive_course;
        document.getElementById('edit-supplementary').checked = order.supplementary;
        document.getElementById('edit-personalized').checked = order.personalized;
        document.getElementById('edit-excursions').checked = order.excursions;
        document.getElementById('edit-assessment').checked = order.assessment;
        document.getElementById('edit-interactive').checked = order.interactive;

        // Пересчёт стоимости (можно вызвать при изменении полей)
        calculateEditPrice(order, course);

        const modal = new bootstrap.Modal(document.getElementById('edit-modal'));
        modal.show();

        // Обработчик формы
        document.getElementById('edit-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                date_start: document.getElementById('edit-date-start').value,
                time_start: document.getElementById('edit-time-start').value,
                persons: parseInt(document.getElementById('edit-persons').value),
                early_registration: document.getElementById('edit-early-reg').checked,
                group_enrollment: document.getElementById('edit-group-enroll').checked,
                intensive_course: document.getElementById('edit-intensive').checked,
                supplementary: document.getElementById('edit-supplementary').checked,
                personalized: document.getElementById('edit-personalized').checked,
                excursions: document.getElementById('edit-excursions').checked,
                assessment: document.getElementById('edit-assessment').checked,
                interactive: document.getElementById('edit-interactive').checked,
            };

            try {
                const response = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderId}?api_key=0f1bfb84-07d0-434b-afd5-ee82fb5c1752`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!response.ok) throw new Error('Ошибка при сохранении');
                await response.json();
                showNotification('Заявка успешно обновлена!', 'success');
                modal.hide();
                loadOrders(); // Обновляем список
            } catch (err) {
                showNotification('Не удалось обновить заявку.', 'danger');
            }
        };
    } catch (e) {
        showNotification('Не удалось загрузить данные курса для редактирования.', 'danger');
    }
}

let orderIdToDelete = null;
function openDeleteModal(orderId) {
    orderIdToDelete = orderId;
    const modal = new bootstrap.Modal(document.getElementById('delete-modal'));
    modal.show();

    document.getElementById('confirm-delete-btn').onclick = async () => {
        try {
            const response = await fetch(`http://exam-api-courses.std-900.ist.mospolytech.ru/api/orders/${orderIdToDelete}?api_key=0f1bfb84-07d0-434b-afd5-ee82fb5c1752`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Ошибка удаления');
            await response.json();
            showNotification('Заявка удалена.', 'success');
            modal.hide();
            loadOrders();
        } catch (err) {
            showNotification('Не удалось удалить заявку.', 'danger');
        }
    };
}

// Вспомогательные функции
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
}

function calculateEditPrice(order, course) {
    document.getElementById('edit-total-price').textContent = order.price;
}

function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    area.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}