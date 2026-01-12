// js/shared.js

/**
 * Показ уведомления
 * @param {string} message — текст сообщения
 * @param {string} type — тип уведомления ('success', 'danger', 'info', 'warning')
 */
function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    if (!area) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    area.appendChild(alert);

    // Автоматическое исчезновение через 5 секунд
    setTimeout(() => alert.remove(), 5000);
}

/**
 * Форматирование даты
 * @param {string} dateStr — строка даты в формате ISO
 * @returns {string} — отформатированная дата
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Расчёт общей стоимости (только для отображения, не влияет на отправку)
 * @param {Object} course — данные курса
 * @param {boolean} isWeekend — выходные ли это
 */
function calculateTotalPrice(course, isWeekend) {
    const students = parseInt(document.getElementById('course-students').value) || 1;
    const feePerHour = course.course_fee_per_hour;
    const totalHours = course.total_length * course.week_length; // общее количество часов
    const weekendMultiplier = isWeekend ? 1.5 : 1;

    let morningSurcharge = 0;
    let eveningSurcharge = 0;

    const selectedTime = document.getElementById('course-time').value;
    if (selectedTime) {
        const hour = parseInt(selectedTime.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400;
        } else if (hour >= 18 && hour < 20) {
            eveningSurcharge = 1000;
        }
    }

    let totalPrice = ((feePerHour * totalHours * weekendMultiplier) + morningSurcharge + eveningSurcharge) * students;

    // Применяем опции
    if (document.getElementById('early-reg').checked) {
        totalPrice *= 0.9; // -10%
    }
    if (document.getElementById('group-enroll').checked && students >= 5) {
        totalPrice *= 0.85; // -15%
    }
    if (document.getElementById('intensive').checked && course.week_length >= 5) {
        totalPrice *= 1.2; // +20%
    }
    if (document.getElementById('supplementary').checked) {
        totalPrice += 2000 * students;
    }
    if (document.getElementById('personalized').checked) {
        totalPrice += 1500 * course.total_length; // +1500 за неделю
    }
    if (document.getElementById('excursions').checked) {
        totalPrice *= 1.25; // +25%
    }
    if (document.getElementById('assessment').checked) {
        totalPrice += 300;
    }
    if (document.getElementById('interactive').checked) {
        totalPrice *= 1.5; // +50%
    }

    document.getElementById('total-price').textContent = Math.round(totalPrice);
}