document.addEventListener('DOMContentLoaded', () => {
    const fileUploadForm = document.getElementById('fileUploadForm');
    const videoUploadForm = document.getElementById('videoUploadForm');
    const materialsList = document.getElementById('materialsList');

    // Обработчик загрузки файлов
    fileUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('fileTitle').value);
        formData.append('description', document.getElementById('fileDescription').value);
        formData.append('file', document.getElementById('fileUpload').files[0]);

        try {
            const response = await fetch('/api/materials/documents', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert('Файл успешно загружен');
                fileUploadForm.reset();
                loadMaterials(); // Обновляем список материалов
            } else {
                throw new Error('Ошибка при загрузке файла');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при загрузке файла');
        }
    });

    // Обработчик загрузки видео
    videoUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', document.getElementById('videoTitle').value);
        formData.append('description', document.getElementById('videoDescription').value);
        formData.append('video', document.getElementById('videoUpload').files[0]);

        try {
            const response = await fetch('/api/materials/videos', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert('Видео успешно загружено');
                videoUploadForm.reset();
                loadMaterials(); // Обновляем список материалов
            } else {
                throw new Error('Ошибка при загрузке видео');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при загрузке видео');
        }
    });

    const textContentForm = document.getElementById('textContentForm');
    const textEditor = document.getElementById('textEditor');

    // Обработчики кнопок форматирования
    const toolbarButtons = document.querySelectorAll('.editor-toolbar button');
    toolbarButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const format = button.getAttribute('data-format');
            
            switch(format) {
                case 'bold':
                    document.execCommand('bold', false, null);
                    break;
                case 'italic':
                    document.execCommand('italic', false, null);
                    break;
                case 'underline':
                    document.execCommand('underline', false, null);
                    break;
                case 'h2':
                    document.execCommand('formatBlock', false, '<h2>');
                    break;
                case 'ul':
                    document.execCommand('insertUnorderedList', false, null);
                    break;
                case 'ol':
                    document.execCommand('insertOrderedList', false, null);
                    break;
            }
        });
    });

    // Обработчик отправки текстового материала
    textContentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            title: document.getElementById('textTitle').value,
            content: textEditor.innerHTML,
            type: 'text'
        };

        try {
            const response = await fetch('/api/materials/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Текстовый материал успешно сохранен');
                textContentForm.reset();
                textEditor.innerHTML = '';
                loadMaterials(); // Обновляем список материалов
            } else {
                throw new Error('Ошибка при сохранении материала');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при сохранении материала');
        }
    });

    // Функция загрузки списка материалов
    async function loadMaterials() {
        try {
            const response = await fetch('/api/materials');
            if (response.ok) {
                const materials = await response.json();
                displayMaterials(materials);
            } else {
                throw new Error('Ошибка при получении списка материалов');
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }

    // Функция отображения материалов
    function displayMaterials(materials) {
        const materialsList = document.getElementById('materialsList');
        materialsList.innerHTML = '';

        materials.forEach(material => {
            const card = document.createElement('div');
            card.className = 'material-card';
            card.setAttribute('data-material-id', material._id); // Изменено с material.id на material._id

            // Определяем иконку в зависимости от типа материала
            let typeIcon = 'fas fa-file-alt';
            if (material.type === 'video') {
                typeIcon = 'fas fa-film';
            } else if (material.type === 'document') {
                typeIcon = 'fas fa-file-pdf';
            }

            card.innerHTML = `
                <div class="material-header">
                    <i class="${typeIcon}"></i>
                    <h3 class="material-title">${material.title}</h3>
                </div>
                <p class="material-description">${material.description || ''}</p>
                <div class="material-info">
                    <span class="material-type">
                        <i class="fas fa-tag"></i>
                        ${material.type}
                    </span>
                </div>
                <button class="expand-btn">Показать больше</button>
                <div class="material-actions">
                    <button class="download-btn" onclick="window.location.href='/api/materials/download/${material._id}'">
                        <i class="fas fa-download"></i>
                        <span>Скачать</span>
                    </button>
                    <button class="delete-btn" onclick="deleteMaterial('${material._id}')">
                        <i class="fas fa-trash-alt"></i>
                        <span>Удалить</span>
                    </button>
                </div>
            `;

            // Добавляем обработчик для кнопки "Показать больше"
            const expandBtn = card.querySelector('.expand-btn');
            expandBtn.addEventListener('click', () => {
                card.classList.toggle('expanded');
                expandBtn.textContent = card.classList.contains('expanded') ? 'Свернуть' : 'Показать больше';
            });

            // Показываем кнопку "Показать больше" только если контент обрезается
            const description = card.querySelector('.material-description');
            if (description.scrollHeight <= description.clientHeight) {
                expandBtn.style.display = 'none';
            }

            materialsList.appendChild(card);
        });
    }

    // Функция удаления материала
    window.deleteMaterial = async function(materialId) {
        if (!materialId || !confirm('Вы уверены, что хотите удалить этот материал?')) {
            return;
        }

        try {
            const response = await fetch(`/api/materials/${materialId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении материала');
            }

            const result = await response.json();
            
            if (result.success) {
                const materialCard = document.querySelector(`[data-material-id="${materialId}"]`);
                if (materialCard) {
                    materialCard.remove();
                }
                alert('Материал успешно удален');
            } else {
                throw new Error(result.message || 'Не удалось удалить материал');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message || 'Произошла ошибка при удалении материала');
        }
    }

    // Загружаем материалы при загрузке страницы
    loadMaterials();
});
