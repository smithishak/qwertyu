document.addEventListener('DOMContentLoaded', function() {
    const addTestForm = document.getElementById('addTestForm');
    const testsList = document.getElementById('testsList');

    if (!addTestForm || !testsList) {
        console.error('Не найдены необходимые элементы формы');
        return;
    }

    // Fix the escapeHtml function by removing the extra forward slash
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")  // Fixed: removed extra forward slash
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Обновляем функцию загрузки тестов
    async function loadTests() {
        try {
            const response = await fetch('/api/tests');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tests = await response.json();
            
            if (!Array.isArray(tests)) {
                throw new Error('Получен неверный формат данных');
            }

            const testsHtml = tests.map(test => `
                <div class="test-card" data-test-id="${test._id}">
                    <div class="test-content">
                        <h3 class="test-title">${escapeHtml(test.title)}</h3>
                        <p class="test-description">${escapeHtml(test.description || 'Описание отсутствует')}</p>
                        <div class="test-info">
                            <span>
                                <i class="fas fa-question-circle"></i>
                                ${test.questions ? test.questions.length : 0} вопросов
                            </span>
                            <span>
                                <i class="fas fa-clock"></i>
                                ${new Date(test.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                        </div>
                        <div class="test-actions">
                            <button onclick="editTest('${test._id}')" class="edit-btn">
                                <i class="fas fa-edit"></i>
                                Редактировать
                            </button>
                            <button onclick="deleteTest('${test._id}')" class="delete-btn">
                                <i class="fas fa-trash"></i>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            testsList.innerHTML = testsHtml || '<div class="no-tests">Нет доступных тестов</div>';
        } catch (error) {
            console.error('Ошибка при загрузке тестов:', error);
            testsList.innerHTML = `<div class="error-message">Ошибка при загрузке тестов: ${error.message}</div>`;
        }
    }

    // Обновляем обработчик создания теста
    addTestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addTestForm);
        const testData = {
            title: formData.get('testTitle'),
            description: formData.get('testDescription')
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const editId = submitBtn.dataset.editId;

        try {
            const url = editId ? `/api/tests/${editId}` : '/api/tests';
            
            const response = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка при сохранении теста');
            }

            alert(editId ? 'Тест успешно обновлен' : 'Тест успешно создан');
            addTestForm.reset();
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Создать тест';
            delete submitBtn.dataset.editId;
            await loadTests();
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при сохранении теста: ' + error.message);
        }
    });

    // Функция редактирования теста
    async function editTest(testId) {
        try {
            const response = await fetch(`/api/tests/${testId}`);
            const test = await response.json();

            // Заполняем форму данными теста
            document.getElementById('testTitle').value = test.title;
            document.getElementById('testDescription').value = test.description || '';

            // Меняем кнопку отправки формы
            const submitBtn = document.querySelector('#addTestForm button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
            submitBtn.dataset.editId = testId;

            // Прокручиваем к форме
            document.querySelector('.add-test-block').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Ошибка при загрузке теста:', error);
            alert('Ошибка при загрузке теста');
        }
    }

    // Делаем функции глобально доступными
    window.editTest = async function(testId) {
        try {
            const response = await fetch(`/api/tests/${testId}`);
            const test = await response.json();

            const modal = document.getElementById('editTestModal');
            const form = document.getElementById('editTestForm');

            if (!modal || !form) {
                throw new Error('Не найдены элементы модального окна');
            }

            // Заполняем форму данными теста
            form.elements.testId.value = testId;
            form.elements.testTitle.value = test.title || '';
            form.elements.testDescription.value = test.description || '';

            // Показываем модальное окно
            modal.style.display = 'block';

            // Обработчик отправки формы
            form.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const testData = {
                        title: form.elements.testTitle.value.trim(),
                        description: form.elements.testDescription.value.trim()
                    };

                    if (!testData.title) {
                        throw new Error('Название теста обязательно');
                    }

                    console.log('Updating test:', testId, testData); // Debug log

                    const response = await fetch(`/api/tests/${testId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(testData)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Ошибка при обновлении теста');
                    }

                    const result = await response.json();
                    console.log('Update successful:', result); // Debug log

                    modal.style.display = 'none';
                    await loadTests();
                    alert('Тест успешно обновлен');

                } catch (error) {
                    console.error('Ошибка при обновлении теста:', error);
                    alert(error.message);
                }
            };

            // Обработчик закрытия модального окна
            document.getElementById('cancelEditTestBtn').onclick = () => {
                modal.style.display = 'none';
            };

            // Закрытие по клику вне модального окна
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };

        } catch (error) {
            console.error('Ошибка при загрузке теста:', error);
            alert('Ошибка при загрузке теста. Пожалуйста, попробуйте позже.');
        }
    };

    window.deleteTest = async function(testId) {
        if (!testId || !confirm('Вы уверены, что хотите удалить этот тест?')) {
            return;
        }

        try {
            const response = await fetch(`/api/tests/${testId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Ошибка при удалении теста');
            }

            // Удаляем элемент из DOM только после успешного удаления
            const testElement = document.querySelector(`[data-test-id="${testId}"]`);
            if (testElement) {
                testElement.remove();
            }
            
            // Перезагружаем список тестов
            loadTests();
        } catch (error) {
            console.error('Ошибка при удалении теста:', error);
            alert('Ошибка при удалении теста: ' + error.message);
        }
    };

    // Инициализация при загрузке страницы
    loadTests();
});
