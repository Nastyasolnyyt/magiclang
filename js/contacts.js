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

// Данные о ресурсах с ТОЧНЫМИ АДРЕСАМИ
const resourcesData = [
    {
        coords: [55.782, 37.712], 
        category: 'school',
        name: 'MagicLangs (Главный кампус)',
        address: 'г. Москва, ул. Большая Семёновская, д. 38',
        desc: 'Наш основной офис и классы магии.',
        iconColor: '#dc3545' // Красный
    },
    {
        coords: [55.751, 37.611], 
        category: 'library',
        name: 'Российская государственная библиотека',
        address: 'г. Москва, ул. Воздвиженка, д. 3/5',
        desc: 'Огромный выбор книг на иностранных языках.',
        iconColor: '#198754' // Зеленый
    },
    {
        coords: [55.741, 37.620], 
        category: 'cafe',
        name: 'Cafe Polyglot',
        address: 'г. Москва, ул. Пятницкая, д. 25',
        desc: 'Разговорный клуб каждую пятницу в 19:00.',
        iconColor: '#ffc107' // Желтый
    },
    {
        coords: [55.760, 37.595], 
        category: 'cafe',
        name: 'English Breakfast Club',
        address: 'г. Москва, Спиридоньевский пер., д. 10А',
        desc: 'Вкусный кофе и практика английского с носителями.',
        iconColor: '#ffc107'
    },
    {
        coords: [55.770, 37.630],
        category: 'library',
        name: 'Библиотека иностранной литературы',
        address: 'г. Москва, Николоямская ул., д. 1',
        desc: 'Специализированная литература и учебные материалы.',
        iconColor: '#198754'
    },
    {
        coords: [55.755, 37.655],
        category: 'school',
        name: 'Филиал MagicLangs "Курская"',
        address: 'г. Москва, Земляной Вал, д. 33',
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
            hintContent: data.name, // При наведении
            balloonContentHeader: data.name, // Заголовок
            // В тело балуна добавляем описание И АДРЕС
            balloonContentBody: `
                <div style="font-size: 14px;">
                    ${data.desc}
                    <br><br>
                    <strong>Адрес:</strong> ${data.address}
                </div>
            `,
            balloonContentFooter: mapCategoryName(data.category) // Подвал
        }, {
            preset: 'islands#icon',
            iconColor: data.iconColor
        });

        // Сохраняем категорию для фильтрации
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
                    placemark.options.set('visible', true);
                } else {
                    placemark.options.set('visible', false);
                }
            });
            
            // Закрываем открытые балуны при смене фильтра
            myMap.balloon.close();
        });
    });
}

// Перевод категорий для футера балуна
function mapCategoryName(cat) {
    switch(cat) {
        case 'library': return 'Категория: Библиотека';
        case 'cafe': return 'Категория: Языковое кафе';
        case 'school': return 'Категория: Учебный центр';
        default: return 'Место';
    }
}

// Функция уведомлений (та же, что и была)
function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    area.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}