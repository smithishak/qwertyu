// Функция для безопасного отображения HTML (перемещаем в начало файла)
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let tests = []; // Global tests variable
let questions = []; // Global questions variable

// Helper function to load questions
async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const questions = await response.json();
        if (!Array.isArray(questions)) {
            throw new Error('Получен неверный формат данных');
        }

        const questionsList = document.getElementById('questionsList');
        if (!questionsList) {
            throw new Error('Элемент questionsList не найден');
        }

        questionsList.innerHTML = questions.map(question => `
            <div class="question-card" data-question-id="${question._id}">
                <div class="question-content">
                    <div class="question-text">${escapeHtml(question.questionText)}</div>
                    <div class="answers-grid">
                        ${Array.isArray(question.answers) ? 
                            question.answers.map((answer, i) => `
                                <div class="answer-item ${i === question.correctAnswer ? 'correct' : ''}">
                                    ${escapeHtml(answer)}
                                </div>
                            `).join('') : 
                            '<div class="error">Ответы не найдены</div>'}
                    </div>
                </div>
                <div class="question-actions">
                    <button onclick="editQuestion('${question._id}')" class="edit-btn">
                        <i class="fas fa-edit"></i>
                        <span>Редактировать</span>
                    </button>
                    <button onclick="deleteQuestion('${question._id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                        <span>Удалить</span>
                    </button>
                </div>
            </div>
        `).join('') || '<div class="no-questions">Нет доступных вопросов</div>';
    } catch (error) {
        console.error('Ошибка при загрузке вопросов:', error);
        const questionsList = document.getElementById('questionsList');
        if (questionsList) {
            questionsList.innerHTML = `<div class="error-message">Ошибка при загрузке вопросов: ${error.message}</div>`;
        }
    }
}

// Make loadQuestions available globally
window.loadQuestions = loadQuestions;

function addAnswerField() {
    const answersContainer = document.getElementById('answersContainer');
    const answerNumber = answersContainer.children.length + 1;
    
    const answerGroup = document.createElement('div');
    answerGroup.className = 'form-group answer-group';
    
    answerGroup.innerHTML = `
        <input type="text" name="answer${answerNumber}" placeholder="Введите вариант ответа" required>
        <div class="radio-container">
            <input type="radio" name="correctAnswer" value="${answerNumber - 1}" required>
            <span class="radio-label">Правильный ответ</span>
        </div>
    `;
    
    answersContainer.appendChild(answerGroup);
}

function createActionButtons(questionId) {
    return `
        <button class="icon-btn edit-btn" data-title="Редактировать" onclick="editQuestion('${questionId}')">
            <i class="fas fa-edit"></i>
        </button>
        <button class="icon-btn delete-btn" data-title="Удалить" onclick="deleteQuestion('${questionId}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
}

document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем статус подключения к БД
    try {
        const statusResponse = await fetch('/api/db-status');
        const status = await statusResponse.json();
        if (!status.connected) {
            console.error('База данных не подключена');
            alert('Ошибка подключения к базе данных');
            return;
        }
    } catch (error) {
        console.error('Ошибка проверки статуса БД:', error);
    }

    const addQuestionForm = document.getElementById('addQuestionForm');
    const addAnswerBtn = document.getElementById('addAnswerBtn');
    const answersContainer = document.getElementById('answersContainer');
    let answerCount = 1;

    // Добавление нового варианта ответа
    addAnswerBtn.addEventListener('click', () => {
        answerCount++;
        const answerGroup = document.createElement('div');
        answerGroup.className = 'form-group answer-group';
        answerGroup.innerHTML = `
            <label>Вариант ответа ${answerCount}:</label>
            <input type="text" name="answer${answerCount}" required>
            <input type="radio" name="correctAnswer" value="${answerCount - 1}" required>
            <label class="radio-label">Правильный ответ</label>
            <button type="button" class="remove-answer">Удалить</button>
        `;
        answersContainer.appendChild(answerGroup);
    });

    // Удаление варианта ответа
    answersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-answer')) {
            e.target.parentElement.remove();
        }
    });

    // Отправка формы
    addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(addQuestionForm);
        const questionData = {
            testId: formData.get('testId'),
            questionText: formData.get('questionText'),
            answers: [],
            correctAnswer: parseInt(formData.get('correctAnswer'))
        };

        // Собираем все варианты ответов
        const answerInputs = addQuestionForm.querySelectorAll('input[type="text"]');
        answerInputs.forEach(input => {
            questionData.answers.push(input.value);
        });

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const editId = submitBtn.dataset.editId;

        try {
            const url = editId ? `/api/questions/${editId}` : '/api/questions';
            const method = editId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(questionData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ошибка при сохранении вопроса');
            }

            alert(editId ? 'Вопрос успешно обновлен' : 'Вопрос успешно добавлен');
            
            // Очищаем форму только после успешного сохранения
            addQuestionForm.reset();
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Создать вопрос';
            delete submitBtn.dataset.editId;
            await loadQuestions(); // Перезагружаем список вопросов
            
            // Очищаем контейнер с ответами
            const answersContainer = document.getElementById('answersContainer');
            answersContainer.innerHTML = '';
            // Добавляем первый вариант ответа
            addAnswerField();
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message);
        }
    });

    // Загрузка существующих вопросов
    async function loadQuestions() {
        try {
            const response = await fetch('/api/questions');  // Изменен путь
            questions = await response.json(); // Сохраняем все вопросы
            updateQuestionsList(questions);
        } catch (error) {
            console.error('Ошибка при загрузке вопросов:', error);
            const questionsList = document.getElementById('questionsList');
            if (questionsList) {
                questionsList.innerHTML = '<tr><td colspan="3">Ошибка при загрузке вопросов</td></tr>';
            }
        }
    }

    // Заменяем функцию загрузки тестов для select
    async function loadTests() {
        try {
            const response = await fetch('/api/tests');
            tests = await response.json(); // Сохраняем в глобальную переменную tests

            // Обновляем select для создания вопросов
            const testSelect = document.querySelector('select[name="testId"]');
            if (testSelect) {
                testSelect.innerHTML = '<option value="">Выберите тест</option>';
                tests.forEach(test => {
                    testSelect.innerHTML += `
                        <option value="${escapeHtml(test._id)}">
                            ${escapeHtml(test.title)}
                        </option>
                    `;
                });
            }
        } catch (error) {
            console.error('Ошибка при загрузке тестов:', error);
            const testSelect = document.querySelector('select[name="testId"]');
            if (testSelect) {
                testSelect.innerHTML = '<option value="">Ошибка загрузки тестов</option>';
            }
        }
    }

    // Добавляем обработчики поиска
    const questionSearch = document.getElementById('questionSearch');
    const questionFilter = document.getElementById('questionFilter');
    const testSearch = document.getElementById('testSearch');
    const testFilter = document.getElementById('testFilter');

    let questions = [];

    // Функция фильтрации вопросов
    function filterQuestions() {
        const searchQuery = questionSearch.value.toLowerCase();
                                              const filterValue = questionFilter.value;

        const filteredQuestions = questions.filter(question => {
            const matchesSearch = question.questionText.toLowerCase().includes(searchQuery);
            const matchesFilter = filterValue === 'all' || 
                (filterValue === 'active' && question.isActive) ||
                (filterValue === 'inactive' && !question.isActive);
            
            return matchesSearch && matchesFilter;
        });

        updateQuestionsList(filteredQuestions);
    }

    // Обновляем функцию фильтрации тестов
    function filterTests() {
        const searchQuery = testSearch.value.toLowerCase();
        const filterValue = testFilter.value;

        console.log('Поисковый запрос:', searchQuery); // Для отладки
        console.log('Всего тестов:', tests.length); // Для отладки

        const filteredTests = tests.filter(test => {
            const matchesSearch = test.title.toLowerCase().includes(searchQuery);
            const matchesFilter = filterValue === 'all' || 
                (filterValue === 'active' && test.isActive) ||
                (filterValue === 'inactive' && !test.isActive);
            
            return matchesSearch && matchesFilter;
        });

     
    }

    function updateQuestionsList(filteredQuestions) {
        const questionsList = document.getElementById('questionsList');

        questionsList.innerHTML = filteredQuestions.map((question, index) => `
            <div class="question-card">
                <div class="question-content">
                    <div class="question-text">${escapeHtml(question.questionText)}</div>
                    <div class="answers-grid">
                        ${Array.isArray(question.answers) ? 
                            question.answers.map((answer, i) => `
                                <div class="answer-item ${i === question.correctAnswer ? 'correct' : ''}">
                                    ${escapeHtml(answer)}
                                </div>
                            `).join('') : 
                            ''}
                    </div>
                </div>
                <div class="question-actions">
                    <button class="edit-btn" onclick="editQuestion('${question._id}')" style="background-color: #3498db;">
                        <i class="fas fa-edit"></i>
                        <span>Редактировать</span>
                    </button>
                    <button class="delete-btn" onclick="deleteQuestion('${question._id}')" style="background-color: #e74c3c;">
                        <i class="fas fa-trash"></i>
                        <span>Удалить</span>
                    </button>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики для кнопок
        const deleteButtons = questionsList.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
                const questionCard = e.target.closest('.question-card');
                const questionId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                
                if (confirm('Вы уверены, что хотите удалить этот вопрос?')) {
                    try {
                        const response = await fetch(`/api/questions/${questionId}`, {
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            questionCard.remove();
                        } else {
                            throw new Error('Ошибка при удалении вопроса');
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        alert('Ошибка при удалении вопроса');
                    }
                }
            });
        });
    }

    // Обновляем функцию 
   

    // Добавляем слушатели событий для поиска
    questionSearch.addEventListener('input', filterQuestions);
    questionFilter.addEventListener('change', filterQuestions);
    testSearch.addEventListener('input', filterTests);
    testFilter.addEventListener('change', filterTests);

    // Загружаем данные при загрузке страницы
    loadQuestions();
    loadTests();
});

// Обновляем функцию редактирования вопроса
async function editQuestion(questionId) {
    try {
        // If tests array is empty, load tests first
        if (!tests.length) {
            const response = await fetch('/api/tests');
            tests = await response.json();
        }

        const response = await fetch(`/api/questions/${questionId}`);
        if (!response.ok) {
            throw new Error('Вопрос не найден');
        }
        
        const question = await response.json();
        const modal = document.getElementById('editQuestionModal');
        const form = document.getElementById('editQuestionForm');
        const answersContainer = document.getElementById('editAnswersContainer');

        // Заполняем форму данными вопроса
        form.elements.questionId.value = questionId;
        form.elements.questionText.value = question.questionText;
        
        // Обновляем список тестов в модальном окне
        const testSelect = form.elements.testId;
        testSelect.innerHTML = '<option value="">Выберите тест</option>';
        tests.forEach(test => {
            testSelect.innerHTML += `
                <option value="${escapeHtml(test._id)}" 
                    ${test._id === question.testId ? 'selected' : ''}>
                    ${escapeHtml(test.title)}
                </option>
            `;
        });

        // Добавляем варианты ответов
        answersContainer.innerHTML = '';
        if (Array.isArray(question.answers)) {
            question.answers.forEach((answer, index) => {
                const answerGroup = document.createElement('div');
                answerGroup.className = 'form-group answer-group';
                answerGroup.innerHTML = `
                    <input type="text" name="answer${index}" value="${escapeHtml(answer)}" required>
                    <div class="radio-container">
                        <input type="radio" name="correctAnswer" value="${index}" 
                            ${index === question.correctAnswer ? 'checked' : ''} required>
                        <span class="radio-label">Правильный ответ</span>
                    </div>
                    <button type="button" class="remove-answer-btn">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                answersContainer.appendChild(answerGroup);
            });
        }

        // Показываем модальное окно
        modal.style.display = 'block';

        // Добавляем обработчик для кнопки добавления ответа в модальном окне
        document.getElementById('editAddAnswerBtn').onclick = () => {
            const index = answersContainer.children.length;
            const answerGroup = document.createElement('div');
            answerGroup.className = 'form-group answer-group';
            answerGroup.innerHTML = `
                <input type="text" name="answer${index}" required>
                <div class="radio-container">
                    <input type="radio" name="correctAnswer" value="${index}" required>
                    <span class="radio-label">Правильный ответ</span>
                </div>
                <button type="button" class="remove-answer-btn">
                    <i class="fas fa-times"></i>
                </button>
            `;
            answersContainer.appendChild(answerGroup);
        };

        // Обработчик удаления ответов
        answersContainer.addEventListener('click', (e) => {
            if (e.target.closest('.remove-answer-btn')) {
                e.target.closest('.answer-group').remove();
            }
        });

        // Обработчик отправки формы в функции editQuestion
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const questionId = form.elements.questionId.value;
                const testId = form.elements.testId.value;

                if (!questionId || !testId) {
                    throw new Error('Не все обязательные поля заполнены');
                }

                // Validate IDs
                if (!questionId.match(/^[0-9a-fA-F]{24}$/) || !testId.match(/^[0-9a-fA-F]{24}$/)) {
                    throw new Error('Неверный формат ID');
                }

                const answers = Array.from(form.querySelectorAll('#editAnswersContainer input[type="text"]'))
                    .map(input => input.value.trim())
                    .filter(answer => answer.length > 0);

                if (answers.length === 0) {
                    throw new Error('Добавьте хотя бы один вариант ответа');
                }

                const selectedAnswer = form.querySelector('input[name="correctAnswer"]:checked');
                if (!selectedAnswer) {
                    throw new Error('Выберите правильный ответ');
                }

                const questionData = {
                    testId,
                    questionText: form.elements.questionText.value.trim(),
                    answers,
                    correctAnswer: parseInt(selectedAnswer.value)
                };

                console.log('Sending update request:', { questionId, data: questionData }); // Debug log

                const response = await fetch(`/api/questions/${questionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(questionData),
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.details || 'Ошибка при обновлении вопроса');
                }

                const data = await response.json();
                console.log('Server response:', data); // Debug log

                // Update UI
                await loadQuestions();
                modal.style.display = 'none';

                // Show success notification
                const notification = document.createElement('div');
                notification.className = 'success-notification';
                notification.textContent = 'Вопрос успешно обновлен';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);

            } catch (error) {
                console.error('Error updating question:', error);
                alert(error.message);
            }
        };

        // Обработчик закрытия модального окна
        document.getElementById('cancelEditBtn').onclick = () => {
            modal.style.display = 'none';
        };

        // Закрытие по клику вне модального окна
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    } catch (error) {
        console.error('Ошибка при загрузке вопроса:', error);
        alert('Ошибка при загрузке вопроса: ' + error.message);
    }
}

// Add this function to handle question header clicks
function toggleQuestionDetails(header) {
    header.classList.toggle('active');
    const details = header.nextElementSibling;
    details.classList.toggle('show');
}

// Make the function available globally
window.toggleQuestionDetails = toggleQuestionDetails;

// Определяем функцию updateQuestionsList глобально
function updateQuestionsList(questions) {
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) return;

    questionsList.innerHTML = questions.map(question => `
        <div class="question-card">
            <div class="question-content">
                <div class="question-text">${escapeHtml(question.questionText)}</div>
                <div class="answers-grid">
                    ${Array.isArray(question.answers) ? 
                        question.answers.map((answer, i) => `
                            <div class="answer-item ${i === question.correctAnswer ? 'correct' : ''}">
                                ${escapeHtml(answer)}
                            </div>
                        `).join('') : 
                        ''}
                </div>
            </div>
            <div class="question-actions">
                <button class="edit-btn" onclick="editQuestion('${question._id}')" style="background-color: #3498db;">
                    <i class="fas fa-edit"></i>
                    <span>Редактировать</span>
                </button>
                <button class="delete-btn" onclick="deleteQuestion('${question._id}')" style="background-color: #e74c3c;">
                    <i class="fas fa-trash"></i>
                    <span>Удалить</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Make the function available globally
window.updateQuestionsList = updateQuestionsList;
