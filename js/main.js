// js/main.js

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initFigmaHeader();
    
    // Подсвечиваем активную страницу
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
document.addEventListener('DOMContentLoaded', async function () {
    // Инициализация переменных
    let allCourses = [];
    let allTutors = [];
    let filteredCourses = [];
    let filteredTutors = [];
    let currentPageCourses = 1;
    let currentPageTutors = 1;
    const COURSES_PER_PAGE = 5;
    const TUTORS_PER_PAGE = 5;
    let currentModalData = null;
    let currentModalType = null;

    // --- Утилиты ---

    function showNotification(message, type = 'success') {
        const area = document.getElementById('notification-area');
        if (!area) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        area.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    function calculateTotalPrice(data, type, date, time, persons) {
        if (type === 'course') {
            const courseFeePerHour = data.course_fee_per_hour || 0;
            const totalHours = (data.total_length || 0) * (data.week_length || 0);
            
            let isWeekend = false;
            if (date) {
                try {
                    const dateObj = new Date(date);
                    const dayOfWeek = dateObj.getDay();
                    isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                } catch (e) {}
            }

            let morningSurcharge = 0;
            let eveningSurcharge = 0;
            
            if (time) {
                try {
                    const hour = parseInt(time.split(':')[0]);
                    if (hour >= 9 && hour < 12) morningSurcharge = 400;
                    if (hour >= 18 && hour < 20) eveningSurcharge = 1000;
                } catch (e) {}
            }

            const weekendMultiplier = isWeekend ? 1.5 : 1;
            let totalPrice = (courseFeePerHour * totalHours * weekendMultiplier + morningSurcharge + eveningSurcharge) * persons;

            // Применяем опции
            const earlyReg = document.getElementById('early-reg');
            const groupEnroll = document.getElementById('group-enroll');
            const intensive = document.getElementById('intensive');
            const supplementary = document.getElementById('supplementary');
            const personalized = document.getElementById('personalized');
            const excursions = document.getElementById('excursions');
            const assessment = document.getElementById('assessment');
            const interactive = document.getElementById('interactive');

            if (earlyReg && earlyReg.checked) totalPrice *= 0.9;
            if (groupEnroll && groupEnroll.checked && persons >= 5) totalPrice *= 0.85;
            if (intensive && intensive.checked && data.week_length >= 5) totalPrice *= 1.2;
            if (supplementary && supplementary.checked) totalPrice += 2000 * persons;
            if (personalized && personalized.checked) totalPrice += 1500 * (data.total_length || 0);
            if (excursions && excursions.checked) totalPrice *= 1.25;
            if (assessment && assessment.checked) totalPrice += 300 * persons;
            if (interactive && interactive.checked) totalPrice *= 1.5;

            return Math.round(totalPrice);
            
        } else if (type === 'tutor') {
            // Для репетитора: базовая ставка × количество часов × количество студентов
            const hourlyRate = data.price_per_hour || 1000;
            const hours = 10; // Стандартный пакет: 10 часов занятий
            let totalPrice = hourlyRate * hours * persons;

            // Для репетитора доступны не все опции
            const supplementary = document.getElementById('supplementary');
            const assessment = document.getElementById('assessment');

            if (supplementary && supplementary.checked) totalPrice += 2000 * persons;
            if (assessment && assessment.checked) totalPrice += 300 * persons;

            return Math.round(totalPrice);
        }
        
        return 0;
    }

    // --- Загрузка данных ---

    async function loadCourses() {
        try {
            allCourses = await API.fetchCourses();
            console.log('Курсы загружены:', allCourses.length);
            filterAndRenderCourses();
            showNotification('Курсы успешно загружены!', 'info');
        } catch (error) {
            console.error('Ошибка загрузки курсов:', error);
            showNotification('Не удалось загрузить курсы.', 'warning');
        }
    }

    async function loadTutors() {
        try {
            allTutors = await API.fetchTutors();
            console.log('Репетиторы загружены:', allTutors.length);
            filterAndRenderTutors();
        } catch (error) {
            console.error('Ошибка загрузки репетиторов:', error);
            // Продолжаем работу даже без репетиторов
        }
    }

    // --- Фильтрация и рендер ---

    function filterAndRenderCourses() {
        const nameFilter = document.getElementById('course-name')?.value.trim().toLowerCase() || '';
        const levelFilter = document.getElementById('course-level')?.value || '';

        filteredCourses = allCourses.filter(course => {
            const matchesName = !nameFilter || (course.name && course.name.toLowerCase().includes(nameFilter));
            const matchesLevel = !levelFilter || course.level === levelFilter;
            return matchesName && matchesLevel;
        });

        renderCoursesPage(currentPageCourses);
        renderCoursePagination();
    }

    function filterAndRenderTutors() {
        if (!allTutors || !Array.isArray(allTutors)) return;

        const languageFilter = document.getElementById('tutor-language')?.value || '';
        const qualificationFilter = document.getElementById('tutor-qualification')?.value || '';
        const experienceFilter = parseInt(document.getElementById('tutor-experience')?.value) || 0;

        filteredTutors = allTutors.filter(tutor => {
            const matchesLanguage = !languageFilter || 
                (tutor.languages_offered && tutor.languages_offered.includes(languageFilter));
            const matchesQualification = !qualificationFilter || tutor.language_level === qualificationFilter;
            const matchesExperience = tutor.work_experience >= experienceFilter;
            return matchesLanguage && matchesQualification && matchesExperience;
        });

        renderTutorsPage(currentPageTutors);
        renderTutorPagination();
    }

    function renderCoursesPage(pageNum) {
        currentPageCourses = pageNum;
        const start = (pageNum - 1) * COURSES_PER_PAGE;
        const slice = filteredCourses.slice(start, start + COURSES_PER_PAGE);

        const container = document.getElementById('courses-list');
        if (!container) return;

        container.innerHTML = '';

        if (slice.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-center text-muted">Курсы не найдены.</p></div>';
            return;
        }

        slice.forEach(course => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';
            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${course.name || 'Без названия'}</h5>
                        <p class="card-text"><strong>Уровень:</strong> ${mapLevel(course.level)}</p>
                        <p class="card-text"><strong>Преподаватель:</strong> ${course.teacher || 'Не указан'}</p>
                        <p class="card-text"><strong>Длительность:</strong> ${course.total_length || 0} недель (${course.week_length || 0} ч/нед)</p>
                        <p class="card-text"><strong>Стоимость:</strong> ${course.course_fee_per_hour || 0} ₽/час</p>
                        <div class="mt-auto">
                            <button class="btn btn-primary w-100 apply-course-btn" 
                                    data-course='${JSON.stringify(course).replace(/'/g, "\\'")}'>
                                ✨ Подать заявку
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Добавляем обработчики событий после рендеринга
        document.querySelectorAll('.apply-course-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const courseJson = this.getAttribute('data-course');
                try {
                    const course = JSON.parse(courseJson);
                    openOrderModalForCourse(course);
                } catch (e) {
                    console.error('Ошибка парсинга данных курса:', e);
                    showNotification('Ошибка при открытии формы заявки', 'danger');
                }
            });
        });
    }

    function renderTutorsPage(pageNum) {
        if (!filteredTutors || !Array.isArray(filteredTutors)) return;

        currentPageTutors = pageNum;
        const start = (pageNum - 1) * TUTORS_PER_PAGE;
        const slice = filteredTutors.slice(start, start + TUTORS_PER_PAGE);

        const tbody = document.getElementById('tutors-list');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (slice.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Репетиторы не найдены.</td></tr>';
            return;
        }

        slice.forEach(tutor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tutor.name || 'Не указано'}</td>
                <td>${tutor.language_level || 'Не указан'}</td>
                <td>${Array.isArray(tutor.languages_offered) ? tutor.languages_offered.join(', ') : 'Не указаны'}</td>
                <td>${tutor.work_experience || 0} лет</td>
                <td>${tutor.price_per_hour || 0} ₽/час</td>
                <td>
                    <img src="https://via.placeholder.com/50" 
                         alt="${tutor.name || 'Репетитор'}" 
                         class="rounded-circle" 
                         style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td>
                    <button class="btn btn-sm btn-success select-tutor-btn" 
                            data-tutor='${JSON.stringify(tutor).replace(/'/g, "\\'")}'>
                        Выбрать
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Добавляем обработчики событий после рендеринга
        document.querySelectorAll('.select-tutor-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tutorJson = this.getAttribute('data-tutor');
                try {
                    const tutor = JSON.parse(tutorJson);
                    openOrderModalForTutor(tutor);
                } catch (e) {
                    console.error('Ошибка парсинга данных репетитора:', e);
                    showNotification('Ошибка при открытии формы заявки', 'danger');
                }
            });
        });
    }

    function renderCoursePagination() {
        const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
        const ul = document.getElementById('courses-pagination');
        if (!ul) return;

        ul.innerHTML = '';

        if (totalPages <= 1) {
            ul.innerHTML = '<li class="page-item disabled"><span class="page-link">1</span></li>';
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPageCourses ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                renderCoursesPage(i);
            });
            ul.appendChild(li);
        }
    }

    function renderTutorPagination() {
        if (!filteredTutors) return;
        
        const totalPages = Math.ceil(filteredTutors.length / TUTORS_PER_PAGE);
        const ul = document.getElementById('tutors-pagination');
        if (!ul) return;

        ul.innerHTML = '';

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPageTutors ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            li.querySelector('a').addEventListener('click', function(e) {
                e.preventDefault();
                renderTutorsPage(i);
            });
            ul.appendChild(li);
        }
    }

    function mapLevel(level) {
        const map = {
            'Beginner': 'Начальный',
            'Intermediate': 'Средний',
            'Advanced': 'Продвинутый'
        };
        return map[level] || level;
    }

    // --- Открытие модального окна ---

    function openOrderModalForCourse(course) {
        console.log('Открываем заявку для курса:', course);
        currentModalData = course;
        currentModalType = 'course';
        fillOrderModal(course, 'course');
    }

    function openOrderModalForTutor(tutor) {
        console.log('Открываем заявку для репетитора:', tutor);
        currentModalData = tutor;
        currentModalType = 'tutor';
        fillOrderModal(tutor, 'tutor');
    }

    function fillOrderModal(data, type) {
        const modalElement = document.getElementById('order-modal');
        if (!modalElement) {
            console.error('Модальное окно не найдено');
            return;
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        const form = document.getElementById('order-form');
        
        if (!form) {
            console.error('Форма не найдена');
            return;
        }

        // Сбрасываем форму
        form.reset();
        
        // Устанавливаем значения
        if (type === 'course') {
            document.getElementById('orderModalLabel').textContent = 'Оформление заявки на курс';
            document.getElementById('selected-course').value = data.name || 'Курс не указан';
            document.getElementById('selected-teacher').value = data.teacher || 'Преподаватель не указан';
            document.getElementById('course-duration').value = `${data.total_length || 0} недель`;
            
            // Заполняем даты начала
            const startDateSelect = document.getElementById('course-start-date');
            startDateSelect.innerHTML = '<option value="" disabled selected>Выберите дату</option>';
            startDateSelect.disabled = false;
            
            if (data.start_dates && Array.isArray(data.start_dates) && data.start_dates.length > 0) {
                // Собираем уникальные даты
                const uniqueDates = [...new Set(data.start_dates.map(dateStr => {
                    try {
                        return dateStr.split('T')[0];
                    } catch (e) {
                        return '';
                    }
                }))].filter(date => date);
                
                uniqueDates.forEach(date => {
                    const option = document.createElement('option');
                    option.value = date;
                    try {
                        const dateObj = new Date(date);
                        option.textContent = dateObj.toLocaleDateString('ru-RU');
                    } catch (e) {
                        option.textContent = date;
                    }
                    startDateSelect.appendChild(option);
                });
            } else {
                startDateSelect.innerHTML = '<option value="" disabled selected>Нет доступных дат</option>';
                startDateSelect.disabled = true;
            }
            
            // Сбрасываем поле времени
            const timeSelect = document.getElementById('course-time');
            timeSelect.innerHTML = '<option value="" disabled selected>Сначала выберите дату</option>';
            timeSelect.disabled = true;
            
        } else if (type === 'tutor') {
            document.getElementById('orderModalLabel').textContent = 'Оформление заявки на занятия с репетитором';
            document.getElementById('selected-course').value = 'Индивидуальные занятия';
            document.getElementById('selected-teacher').value = data.name || 'Репетитор не указан';
            document.getElementById('course-duration').value = 'По согласованию';
            
            // Для репетитора фиксированные даты и время
            const startDateSelect = document.getElementById('course-start-date');
            const today = new Date();
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            startDateSelect.innerHTML = `
                <option value="" disabled selected>Выберите дату</option>
                <option value="${today.toISOString().split('T')[0]}">Сегодня (${formatDate(today.toISOString())})</option>
                <option value="${nextWeek.toISOString().split('T')[0]}">Через неделю (${formatDate(nextWeek.toISOString())})</option>
            `;
            startDateSelect.disabled = false;
            
            const timeSelect = document.getElementById('course-time');
            timeSelect.innerHTML = `
                <option value="" disabled selected>Выберите время</option>
                <option value="09:00">09:00</option>
                <option value="14:00">14:00</option>
                <option value="18:00">18:00</option>
            `;
            timeSelect.disabled = false;
        }

        // Сбрасываем дополнительные опции
        document.getElementById('course-students').value = 1;
        document.querySelectorAll('#order-form input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Сбрасываем стоимость
        document.getElementById('total-price').textContent = '0';

        // Обновляем обработчики событий для пересчета стоимости
        updatePriceCalculationHandlers(data, type);

        // Обновляем обработчик отправки формы
        form.onsubmit = async function(e) {
            e.preventDefault();
            await submitOrderForm(data, type);
        };

        // Показываем модальное окно
        modal.show();
    }

    function updatePriceCalculationHandlers(data, type) {
        const recalculatePrice = () => {
            const date = document.getElementById('course-start-date').value;
            const time = document.getElementById('course-time').value;
            const persons = parseInt(document.getElementById('course-students').value) || 1;
            const totalPrice = calculateTotalPrice(data, type, date, time, persons);
            document.getElementById('total-price').textContent = totalPrice;
        };

        // Удаляем старые обработчики
        const form = document.getElementById('order-form');
        const oldHandler = form._recalculateHandler;
        if (oldHandler) {
            form.removeEventListener('input', oldHandler);
            form.removeEventListener('change', oldHandler);
        }

        // Добавляем новый обработчик
        form._recalculateHandler = recalculatePrice;
        
        // Слушаем изменения во всех полях формы
        form.addEventListener('input', recalculatePrice);
        form.addEventListener('change', recalculatePrice);

        // Особый обработчик для выбора даты (для курсов)
        const dateSelect = document.getElementById('course-start-date');
        if (dateSelect) {
            dateSelect.addEventListener('change', function() {
                if (type === 'course' && data && data.start_dates) {
                    const selectedDate = this.value;
                    const timeSelect = document.getElementById('course-time');
                    timeSelect.innerHTML = '<option value="" disabled selected>Выберите время</option>';
                    timeSelect.disabled = !selectedDate;
                    
                    if (selectedDate) {
                        // Фильтруем времена для выбранной даты
                        const timesForDate = data.start_dates
                            .filter(dateStr => dateStr.startsWith(selectedDate))
                            .map(dateStr => {
                                const timePart = dateStr.split('T')[1] || '';
                                return timePart.substring(0, 5);
                            })
                            .filter(time => time);
                        
                        if (timesForDate.length > 0) {
                            timesForDate.forEach(time => {
                                const option = document.createElement('option');
                                option.value = time;
                                option.textContent = time;
                                timeSelect.appendChild(option);
                            });
                        } else {
                            const option = document.createElement('option');
                            option.value = '';
                            option.textContent = 'Нет доступного времени';
                            option.disabled = true;
                            timeSelect.appendChild(option);
                        }
                    }
                }
                recalculatePrice();
            });
        }

        // Вызываем пересчет при первом открытии
        setTimeout(recalculatePrice, 100);
    }

    async function submitOrderForm(data, type) {
        try {
            // Собираем данные формы
            const date = document.getElementById('course-start-date').value;
            const time = document.getElementById('course-time').value;
            const persons = parseInt(document.getElementById('course-students').value) || 1;
            
            const formData = {
                date_start: date,
                time_start: time,
                persons: persons,
                early_registration: document.getElementById('early-reg').checked,
                group_enrollment: document.getElementById('group-enroll').checked,
                intensive_course: document.getElementById('intensive').checked,
                supplementary: document.getElementById('supplementary').checked,
                personalized: document.getElementById('personalized').checked,
                excursions: document.getElementById('excursions').checked,
                assessment: document.getElementById('assessment').checked,
                interactive: document.getElementById('interactive').checked
            };

            // Добавляем ID курса или репетитора
            if (type === 'course') {
                formData.course_id = data.id;
                formData.tutor_id = 0;
                // Длительность в часах (общее количество часов курса)
                formData.duration = (data.total_length || 0) * (data.week_length || 0);
            } else if (type === 'tutor') {
                formData.tutor_id = data.id;
                formData.course_id = 0;
                // Для репетитора предполагаем 10 часов занятий
                formData.duration = 10;
            }

            // Рассчитываем и добавляем стоимость
            formData.price = calculateTotalPrice(data, type, date, time, persons);

            console.log('Отправляемые данные заявки:', formData);

            // Проверяем обязательные поля
            if (!formData.date_start || !formData.time_start) {
                throw new Error('Пожалуйста, выберите дату и время');
            }

            if (!formData.price || formData.price <= 0) {
                throw new Error('Некорректная стоимость. Проверьте введенные данные');
            }

            // Отправляем запрос
            const response = await API.createOrder(formData);
            console.log('Заявка успешно создана:', response);

            // Закрываем модальное окно
            const modalElement = document.getElementById('order-modal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            // Показываем уведомление об успехе
            showNotification('Заявка успешно отправлена!', 'success');

        } catch (error) {
            console.error('Ошибка при отправке заявки:', error);
            showNotification(`Ошибка: ${error.message}`, 'danger');
        }
    }

    // --- Инициализация ---

    // Загружаем данные при старте
    loadCourses();
    loadTutors();

    // Назначаем обработчики событий для фильтров
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterAndRenderCourses();
        });
    }

    const tutorSearchForm = document.getElementById('tutor-search-form');
    if (tutorSearchForm) {
        tutorSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            filterAndRenderTutors();
        });
    }

    // Реактивный поиск
    const courseNameInput = document.getElementById('course-name');
    if (courseNameInput) {
        courseNameInput.addEventListener('input', filterAndRenderCourses);
    }

    const courseLevelSelect = document.getElementById('course-level');
    if (courseLevelSelect) {
        courseLevelSelect.addEventListener('change', filterAndRenderCourses);
    }

    console.log('Main.js инициализирован');
});