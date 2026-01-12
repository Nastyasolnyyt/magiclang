// js/about.js

document.addEventListener('DOMContentLoaded', () => {
    const tutorsData = [
        {
            name: "Irina Petrovna",
            level: "Advanced",
            languages: "Russian, English",
            experience: 5,
            price: 500,
            photo: "images/irina_petrovna.png"
        },
        {
            name: "Viktor Sergeevich",
            level: "Advanced",
            languages: "Russian, German",
            experience: 8,
            price: 600,
            photo: "images/Viktor_Sergeevich.png"
        },
        {
            name: "Luisa Martinez",
            level: "Intermediate",
            languages: "Spanish, English",
            experience: 4,
            price: 400,
            photo: "images/Luisa_Martinez.png"
        },
        {
            name: "Pierre Dupont",
            level: "Intermediate",
            languages: "French, English",
            experience: 6,
            price: 550,
            photo: "images/Pierre_Dupont.png"
        },
        {
            name: "Akiko Tanaka",
            level: "Advanced",
            languages: "Japanese, English",
            experience: 3,
            price: 700,
            photo: "images/akiko2.png"
        },
        {
            name: "Marco Rossi",
            level: "Advanced",
            languages: "Italian",
            experience: 7,
            price: 620,
            photo: "images/Marco_Rossi.jpg"
        }
    ];

        const container = document.getElementById('tutors-cards');

    // Рендер карточек
    tutorsData.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex align-items-center mb-3">
                        <img src="${tutor.photo}" alt="${tutor.name}" class="rounded-circle me-3" width="180"> <!-- ← увеличено до 120 -->
                        <div>
                            <h5 class="card-title mb-0">${tutor.name}</h5>
                            <p class="text-muted mb-1">${tutor.level} уровень</p>
                        </div>
                    </div>
                    <p><strong>Языки:</strong> ${tutor.languages}</p>
                    <p><strong>Опыт:</strong> ${tutor.experience} лет</p>
                    <p><strong>Ставка:</strong> ${tutor.price} ₽/час</p>
                   
                </div>
            </div>
        `;
        container.appendChild(card);

      
    });

    // Функция показа уведомлений
    function showNotification(message, type = 'success') {
        const area = document.getElementById('notification-area');
        if (!area) return;
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        area.appendChild(alert);
        setTimeout(() => alert.remove(), 5000);
    }
});