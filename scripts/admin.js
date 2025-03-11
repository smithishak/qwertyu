document.addEventListener('DOMContentLoaded', async function() {
    // Функция для обновления статистики
    async function updateStatistics() {
        try {
            // Получаем статистику пользователей
            const usersResponse = await fetch('/api/admin/statistics/users');
            const usersData = await usersResponse.json();
            
            // Получаем статистику тестов
            const testsResponse = await fetch('/api/admin/statistics/tests');
            const testsData = await testsResponse.json();

            // Обновляем данные на странице
            document.getElementById('totalUsers').textContent = usersData.totalUsers || 0;
            document.getElementById('activeUsers').textContent = usersData.activeUsers || 0;
            document.getElementById('totalQuestions').textContent = testsData.totalQuestions || 0;
            document.getElementById('completedTests').textContent = testsData.completedTests || 0;

        } catch (error) {
            console.error('Ошибка при получении статистики:', error);
            showNotification('Ошибка при загрузке статистики', 'error');
        }
    }

    // Функция для отображения уведомлений
    function showNotification(message, type = 'info') {
        alert(message);
    }

    // Обработчик для кнопки резервного копирования
    const backupBtn = document.querySelector('.backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/admin/backup', {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    showNotification('Резервная копия создана успешно: ' + data.filename);
                } else {
                    throw new Error(data.error || 'Ошибка при создании резервной копии');
                }
            } catch (error) {
                console.error('Ошибка при создании резервной копии:', error);
                showNotification('Ошибка при создании резервной копии', 'error');
            }
        });
    }

    // Запускаем обновление статистики при загрузке страницы
    updateStatistics();

    // Обновляем статистику каждые 5 минут
    setInterval(updateStatistics, 300000);
});
