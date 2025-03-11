document.addEventListener('DOMContentLoaded', function() {
    const addTestForm = document.getElementById('addTestForm');
    const testsList = document.getElementById('testsList');

    // Обновляем функцию загрузки тестов с обработкой ошибок
    async function loadTests() {
        try {
            console.log('Загружаем список тестов...');
            const response = await fetch('/api/tests');
            console.log('Статус ответа получения тестов:', response.status);
            
            const tests = await response.json();
            console.log('Получены тесты:', tests);

            if (!Array.isArray(tests)) {
                console.log('Получен неверный формат данных');
                testsList.innerHTML = '<div class="no-tests">Нет доступных тестов</div>';
                return;
            }
            
            testsList.innerHTML = tests.map(test => `
                <div class="test-card" data-test-id="${test._id}">
                    <div class="test-header">
                        <h3 class="test-title">${escapeHtml(test.title)}</h3>
                        <div class="test-actions">
                            <button class="edit-test-btn" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-test-btn" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="test-description">${escapeHtml(test.description || '')}</div>
                    <div class="test-questions">
                        <h4>Вопросы (${test.questions ? test.questions.length : 0}):</h4>
                        ${test.questions ? test.questions.map(q => `
                            <div class="question-item">
                                ${escapeHtml(q.questionText || '')}
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `).join('');

            // Добавляем обработчики для кнопок удаления и редактирования
            addTestButtonHandlers();
        } catch (error) {
            console.error('Ошибка при загрузке тестов:', error);
            testsList.innerHTML = '<div class="error-message">Ошибка при загрузке тестов</div>';
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
            const url = editId ? 
                `/api/tests/${editId}` : 
                '/api/tests';
            
            const response = await fetch(url, {
                method: editId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                alert(editId ? 'Тест успешно обновлен' : 'Тест успешно создан');
                addTestForm.reset();
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Создать тест';
                delete submitBtn.dataset.editId;
                loadTests();
            } else {
                throw new Error('Ошибка при сохранении теста');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при сохранении теста');
        }
    });

    function addTestButtonHandlers() {
        // Обработчик удаления теста
        document.querySelectorAll('.delete-test-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const testCard = e.target.closest('.test-card');
                const testId = testCard.dataset.testId;
                
                if (confirm('Вы уверены, что хотите удалить этот тест?')) {
                    try {
                        const response = await fetch(`/api/tests/${testId}`, {
                            method: 'DELETE'
                        });
                        
                        if (response.ok) {
                            testCard.remove();
                        } else {
                            throw new Error('Ошибка при удалении теста');
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        alert('Ошибка при удалении теста');
                    }
                }
            });
        });

        // Обработчик редактирования теста
        document.querySelectorAll('.edit-test-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const testCard = e.target.closest('.test-card');
                const testId = testCard.dataset.testId;
                editTest(testId);
            });
        });
    }

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

    // Инициализация при загрузке страницы
    loadTests();
});
