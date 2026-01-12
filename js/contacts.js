// js/contacts.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Логика формы обратной связи
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('contact-name').value.trim();
            showNotification(`Спасибо, ${name}! Сова уже летит с вашим письмом.`, 'success');
            form.reset();
        });
    }

    // 2. Инициализация карты
    ymaps.ready(initMap);
});

let myMap;
let placemarks = []; // Массив для хранения всех меток

// Данные о ресурсах (Фейковые данные для выполнения задания)
const resourcesData = [
    {
        coords: [55.782, 37.712], // Политех (примерно)
        category: 'school',
        name: 'MagicLangs (Главный кампус)',
        desc: 'Наш основной офис и классы магии.',
        iconColor: '#dc3545' // Красный
    },
    {
        coords: [55.751, 37.611], // Библиотека им. Ленина
        category: 'library',
        name: 'Российская государственная библиотека',
        desc: 'Огромный выбор книг на иностранных языках.',
        iconColor: '#198754' // Зеленый
    },
    {
        coords: [55.741, 37.620], // Третьяковская
        category: 'cafe',
        name: 'Cafe Polyglot',
        desc: 'Разговорный клуб каждую пятницу в 19:00.',
        iconColor: '#ffc107' // Желтый
    },
    {
        coords: [55.760, 37.595], // Патриаршие
        category: 'cafe',
        name: 'English Breakfast Club',
        desc: 'Вкусный кофе и практика английского с носителями.',
        iconColor: '#ffc107'
    },
    {
        coords: [55.770, 37.630],
        category: 'library',
        name: 'Библиотека иностранной литературы',
        desc: 'Специализированная литература и учебные материалы.',
        iconColor: '#198754'
    },
    {
        coords: [55.755, 37.655],
        category: 'school',
        name: 'Филиал MagicLangs "Курская"',
        desc: 'Интенсивные курсы для продвинутых магов.',
        iconColor: '#dc3545'
    }
];

function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Создаем карту
    myMap = new ymaps.Map("map", {
        center: [55.753215, 37.622504], // Центр Москвы
        zoom: 11,
        controls: ['zoomControl', 'fullscreenControl']
    });

    // Создаем метки
    resourcesData.forEach(data => {
        const placemark = new ymaps.Placemark(data.coords, {
            hintContent: data.name,
            balloonContentHeader: data.name,
            balloonContentBody: data.desc,
            balloonContentFooter: mapCategoryName(data.category)
        }, {
            preset: 'islands#icon',
            iconColor: data.iconColor
        });

        // Сохраняем категорию в самом объекте метки, чтобы потом фильтровать
        placemark.category = data.category;
        
        myMap.geoObjects.add(placemark);
        placemarks.push(placemark);
    });

    // Логика фильтрации
    setupFilters();
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 1. Обновляем активный класс кнопок
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // 2. Получаем выбранную категорию
            const category = e.target.getAttribute('data-category');

            // 3. Фильтруем метки
            placemarks.forEach(placemark => {
                if (category === 'all' || placemark.category === category) {
                    // Показываем метку (добавляем на карту, если её нет)
                    // Но проще использовать visible (через options)
                    placemark.options.set('visible', true);
                } else {
                    // Скрываем метку
                    placemark.options.set('visible', false);
                }
            });
            
            // Закрываем открытые балуны при смене фильтра
            myMap.balloon.close();
        });
    });
}

function mapCategoryName(cat) {
    switch(cat) {
        case 'library': return 'Библиотека';
        case 'cafe': return 'Языковое кафе';
        case 'school': return 'Учебный центр';
        default: return 'Место';
    }
}

function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    area.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}