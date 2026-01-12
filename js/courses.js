// js/courses.js
document.addEventListener('DOMContentLoaded', async () => {
    const COURSES_PER_PAGE = 5;
    let allCourses = [];
    let filteredCourses = [];
    let currentPage = 1;

    // Уведомления
    function notify(msg, type = 'success') {
        const area = document.getElementById('notification-area');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `${msg} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        area.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }

    // Загрузка
    try {
        allCourses = await API.fetchCourses();
        filterAndRender();
    } catch (e) {
        notify('Не удалось загрузить курсы', 'danger');
    }

    // Фильтрация
    function filterAndRender() {
        const name = document.getElementById('course-name').value.trim().toLowerCase();
        const level = document.getElementById('course-level').value;
        filteredCourses = allCourses.filter(c =>
            (!name || c.name.toLowerCase().includes(name)) &&
            (!level || c.level === level)
        );
        renderPage(1);
        renderPagination();
    }

    // Рендер страницы
    function renderPage(page) {
        currentPage = page;
        const start = (page - 1) * COURSES_PER_PAGE;
        const slice = filteredCourses.slice(start, start + COURSES_PER_PAGE);
        const list = document.getElementById('courses-list');
        list.innerHTML = '';

        if (slice.length === 0) {
            list.innerHTML = '<p class="col-12 text-center">Ничего не найдено.</p>';
            return;
        }

        slice.forEach(course => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4';
            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${course.name}</h5>
                        <p><strong>Уровень:</strong> ${mapLevel(course.level)}</p>
                        <p><strong>Преподаватель:</strong> ${course.teacher}</p>
                        <p><strong>Длительность:</strong> ${course.total_length} недель (${course.week_length} ч/нед)</p>
                        <p><strong>Цена:</strong> ${course.course_fee_per_hour} ₽/час</p>
                        <button class="btn btn-outline-primary" onclick='openOrderModal(${JSON.stringify(course).replace(/"/g, '&quot;')})'>
                            ✨ Подать заявку
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    // Пагинация
    function renderPagination() {
        const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
        const nav = document.getElementById('courses-pagination');
        nav.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.querySelector('a').addEventListener('click', e => {
                e.preventDefault();
                renderPage(i);
                renderPagination();
            });
            nav.appendChild(li);
        }
    }

    // Вспомогательные функции
    function mapLevel(l) {
        return { Beginner: 'Начальный (Novice)', Intermediate: 'Средний (Apprentice)', Advanced: 'Продвинутый (Master)' }[l] || l;
    }

    window.openOrderModal = function(course) {
        // ... (логика модального окна — см. предыдущий ответ)
        // Включает: заполнение полей, расчёт стоимости, отправку через API.createOrder()
        // Для краткости здесь не привожу, но она уже реализована ранее.
    };

    // События
    document.getElementById('course-name').addEventListener('input', filterAndRender);
    document.getElementById('course-level').addEventListener('change', filterAndRender);
});