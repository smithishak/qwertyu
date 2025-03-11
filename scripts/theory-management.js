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
        materialsList.innerHTML = materials.map(material => {
            let actionButtons = `
                <button onclick="deleteMaterial('${material._id}')" class="delete-btn">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            `;

            if (material.type === 'document' || material.type === 'video') {
                actionButtons = `
                    <a href="/api/materials/${material._id}/download" class="download-btn">
                        <i class="fas fa-download"></i> Скачать
                    </a>
                    ${actionButtons}
                `;
            }

            return `
                <div class="material-card">
                    <h4>${material.title}</h4>
                    ${material.type === 'text' ? 
                        `<div class="text-preview">${material.content.substring(0, 200)}...</div>` :
                        `<p>${material.description || ''}</p>`
                    }
                    <div class="material-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Функция удаления материала
    window.deleteMaterial = async (materialId) => {
        if (confirm('Вы уверены, что хотите удалить этот материал?')) {
            try {
                const response = await fetch(`/api/materials/${materialId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    loadMaterials(); // Обновляем список после удаления
                } else {
                    throw new Error('Ошибка при удалении материала');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при удалении материала');
            }
        }
    };

    // Загружаем материалы при загрузке страницы
    loadMaterials();
});
