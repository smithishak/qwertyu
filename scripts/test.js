document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Получаем тесты
        const testsResponse = await fetch('/api/tests');
        const tests = await testsResponse.json();

        // Получаем результаты тестов пользователя
        const resultsResponse = await fetch('/api/user-test-results');
        const userResults = await resultsResponse.json();

        const testsList = document.getElementById('testsList');
        testsList.innerHTML = tests.map(test => {
            const result = userResults[test._id] || {};
            const resultHtml = result.completed 
                ? `<div class="test-result">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${result.score}%"></div>
                    </div>
                    <span class="score-text">Результат: ${result.score}%</span>
                    <span class="completion-date">Завершён: ${new Date(result.completedAt).toLocaleDateString()}</span>
                   </div>`
                : '';

            return `
                <div class="test-card">
                    <h3 class="test-title">${test.title}</h3>
                    <p class="test-description">${test.description || ''}</p>
                    <div class="test-meta">
                        <span><i class="fas fa-question-circle"></i>Вопросов: ${test.questions.length} </span>
                        <span class="test-date">
                            <i class="fas fa-calendar-alt"></i> 
                            Создан: ${new Date(test.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    ${resultHtml}
                    <button class="start-test-btn" data-test-id="${test._id}">
                        <i class="fas fa-play"></i>
                        ${result.completed ? 'Пройти заново' : 'Начать тест'}
                    </button>
                </div>
            `;
        }).join('');

        // Добавляем обработчики для кнопок
        const startButtons = document.querySelectorAll('.start-test-btn');
        startButtons.forEach(button => {
            button.addEventListener('click', () => {
                const testId = button.getAttribute('data-test-id');
                window.location.href = `/pages/take-test.html?id=${testId}`; // Исправляем путь к файлу
            });
        });
    } catch (error) {
        console.error('Ошибка при загрузке тестов:', error);
    }
});
