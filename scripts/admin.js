document.addEventListener('DOMContentLoaded', async function() {
    // Load user statistics
    async function loadUserStats() {
        try {
            const response = await fetch('/api/admin/statistics/users');
            if (!response.ok) throw new Error('Failed to load user statistics');
            const data = await response.json();
            document.getElementById('totalUsers').textContent = data.totalUsers || 0;
            document.getElementById('activeUsers').textContent = data.activeUsers || 0;
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    // Load test statistics
    async function loadTestStats() {
        try {
            const response = await fetch('/api/admin/statistics/tests');
            if (!response.ok) throw new Error('Failed to load test statistics');
            const data = await response.json();
            document.getElementById('totalQuestions').textContent = data.totalQuestions || 0;
            document.getElementById('completedTests').textContent = data.completedTests || 0;
        } catch (error) {
            console.error('Error loading test stats:', error);
        }
    }

    // Load test completion statistics
    async function loadTestCompletionStats() {
        try {
            const response = await fetch('/api/admin/statistics/test-completions');
            if (!response.ok) {
                throw new Error('Failed to load completion statistics');
            }
            
            const data = await response.json();
            console.log('Test completion stats:', data); // Debug log

            // Update the statistics display
            document.getElementById('averageScore').textContent = 
                `${data.averageScore || 0}%`;
            document.getElementById('bestScore').textContent = 
                `${data.bestScore || 0}%`;

        } catch (error) {
            console.error('Error loading completion stats:', error);
            // Set default values if there's an error
            document.getElementById('averageScore').textContent = '0%';
            document.getElementById('bestScore').textContent = '0%';
        }
    }

    // Update the loadStatistics function
    async function loadStatistics() {
        try {
            await Promise.all([
                loadUserStats(),
                loadTestStats(),
                loadTestCompletionStats()
            ]);
            console.log('All statistics loaded successfully');
        } catch (error) {
            console.error('Error loading statistics:', error);
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

    // Start loading statistics when page loads
    loadStatistics();

    // Refresh statistics every 5 minutes
    setInterval(loadStatistics, 300000);
    
    // Ensure statistics are loaded immediately and refreshed regularly
    loadStatistics();
    setInterval(loadStatistics, 60000); // Refresh every minute
});
