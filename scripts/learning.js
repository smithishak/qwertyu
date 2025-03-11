document.addEventListener('DOMContentLoaded', () => {
    const documentsList = document.getElementById('documentsList');
    const videosList = document.getElementById('videosList');
    const textList = document.getElementById('textList');

    // Загрузка всех материалов
    async function loadMaterials() {
        try {
            const response = await fetch('/api/materials');
            if (response.ok) {
                const materials = await response.json();
                displayMaterials(materials);
            } else {
                throw new Error('Ошибка при получении материалов');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    // Отображение материалов по типам
    function displayMaterials(materials) {
        // Разделяем материалы по типам
        const documents = materials.filter(m => m.type === 'document');
        const videos = materials.filter(m => m.type === 'video');
        const texts = materials.filter(m => m.type === 'text');

        // Отображаем текстовые материалы
        if (textList) {
            textList.innerHTML = texts.map(text => `
                <div class="material-card">
                    <h4 class="material-title">${text.title}</h4>
                    <div class="text-preview">
                        ${text.content ? text.content.substring(0, 200) + '...' : 'Нет содержимого'}
                    </div>
                    <div class="material-actions">
                        <button onclick="showFullText('${text._id}')" class="view-btn">
                            <i class="fas fa-book-open"></i> Читать полностью
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Отображаем документы
        documentsList.innerHTML = documents.map(doc => `
            <div class="material-card">
                <h4 class="material-title">${doc.title}</h4>
                <p class="material-description">${doc.description}</p>
                <div class="material-actions">
                    <a href="/api/materials/${doc._id}/download" class="download-btn">
                        <i class="fas fa-download"></i> Скачать
                    </a>
                </div>
            </div>
        `).join('');

        // Отображаем видео
        videosList.innerHTML = videos.map(video => `
            <div class="material-card">
                <h4 class="material-title">${video.title}</h4>
                <p class="material-description">${video.description}</p>
                <video class="video-preview" controls>
                    <source src="/api/materials/${video._id}/download" type="${video.mimetype}">
                    Ваш браузер не поддерживает видео.
                </video>
            </div>
        `).join('');
    }

    // Функция для отображения полного текста
    window.showFullText = async (materialId) => {
        try {
            const response = await fetch(`/api/materials/${materialId}`);
            if (response.ok) {
                const material = await response.json();
                
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>${material.title}</h3>
                        <div class="text-content">${material.content || 'Содержимое отсутствует'}</div>
                        <button class="close-btn" onclick="this.closest('.modal').remove()">
                            Закрыть
                        </button>
                    </div>
                `;
                
                document.body.appendChild(modal);

                // Добавляем обработчик клика для закрытия по клику вне контента
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при загрузке материала');
        }
    };

    // Загружаем материалы при загрузке страницы
    loadMaterials();
});
