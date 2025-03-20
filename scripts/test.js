document.addEventListener('DOMContentLoaded', async function() {
    const testsList = document.getElementById('testsList');

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async function loadTests() {
        try {
            const response = await fetch('/api/tests');
            const tests = await response.json();
            
            if (!Array.isArray(tests)) {
                testsList.innerHTML = '<div class="no-tests">Нет доступных тестов</div>';
                return;
            }

            testsList.innerHTML = tests.map(test => `
                <div class="test-card" data-test-id="${test._id}">
                    <h3 class="test-title">${escapeHtml(test.title)}</h3>
                    <p class="test-description">${escapeHtml(test.description || '')}</p>
                    <div class="test-meta">
                        <span><i class="fas fa-question-circle"></i> Вопросов: ${test.questions?.length || 0}</span>
                        <span class="test-date">
                            <i class="fas fa-calendar-alt"></i> 
                            Создан: ${new Date(test.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <button class="start-test-btn" onclick="startTest('${test._id}')">
                        <i class="fas fa-play"></i> Начать тест
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка при загрузке тестов:', error);
            testsList.innerHTML = '<div class="error-message">Ошибка при загрузке тестов</div>';
        }
    }

    // Функция для начала теста
    window.startTest = function(testId) {
        window.location.href = `/pages/take-test.html?id=${testId}`;
    }

    // Загружаем только тесты при загрузке главной страницы
    loadTests();
});
