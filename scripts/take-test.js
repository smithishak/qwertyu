document.addEventListener('DOMContentLoaded', async function() {
    // Добавляем функцию для безопасного отображения HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    
    if (!testId) {
        window.location.href = '/index.html';
        return;
    }

    async function loadTest() {
        try {
            const response = await fetch(`/api/tests/${testId}`);
            const test = await response.json();
            
            // Устанавливаем заголовок теста
            document.getElementById('testTitle').textContent = test.title;
            document.getElementById('testDescription').textContent = test.description;

            // Загружаем вопросы
            const questionsHtml = test.questions.map((question, index) => `
                <div class="question-card">
                    <div class="question-text">
                        <span class="question-number">${index + 1}.</span> 
                        ${escapeHtml(question.questionText)}
                    </div>
                    <div class="answers-list">
                        ${question.answers.map((answer, answerIndex) => `
                            <label class="answer-option">
                                <input type="radio" name="question_${question._id}" value="${answerIndex}">
                                ${escapeHtml(answer)}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            document.getElementById('questionsList').innerHTML = questionsHtml;
        } catch (error) {
            console.error('Ошибка при загрузке теста:', error);
        }
    }

    // Обработчик отправки теста
    document.getElementById('submitTest').addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите завершить тест?')) {
            try {
                const answers = {};
                document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                    const questionId = radio.name.replace('question_', '');
                    answers[questionId] = parseInt(radio.value);
                });

                const response = await fetch('/api/test-results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        testId,
                        answers
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка при отправке результатов');
                }

                const result = await response.json();
                alert(`Тест завершен!\nПравильных ответов: ${result.correctAnswers} из ${result.totalQuestions}\nВаш результат: ${result.percentage}%`);
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Ошибка при отправке результатов:', error);
                alert('Произошла ошибка при отправке результатов: ' + error.message);
            }
        }
    });

    loadTest();
});
