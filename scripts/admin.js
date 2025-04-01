document.addEventListener('DOMContentLoaded', async function() {
    // Add admin check function
    async function checkAdminStatus() {
        try {
            const response = await fetch('/api/check-admin', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Admin session expired or invalid');
                    window.location.href = '/login.html';
                    return false;
                }
                throw new Error('Admin check failed');
            }
            return true;
        } catch (error) {
            console.error('Admin check failed:', error);
            window.location.href = '/login.html';
            return false;
        }
    }

    // Add error handler for fetch requests
    async function fetchWithAuth(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                }
            });

            if (response.status === 401) {
                window.location.href = '/login.html';
                throw new Error('Session expired');
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            return response;
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            throw error;
        }
    }

    // Check admin status before loading stats
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) return;

    // Load user statistics
    async function loadUserStats() {
        try {
            const response = await fetchWithAuth('/api/admin/statistics/users');
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
            const response = await fetchWithAuth('/api/admin/statistics/tests');
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
            const response = await fetchWithAuth('/api/admin/statistics/test-completions');
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

    // Update the test results fetch path
    async function loadTestResults() {
        try {
            const response = await fetchWithAuth('/api/admin/test-results');
            const results = await response.json();
            console.log('Loaded test results:', results);
            
            const resultsList = document.getElementById('testResultsList');
            if (!resultsList) return;

            if (!Array.isArray(results) || results.length === 0) {
                resultsList.innerHTML = '<tr><td colspan="4">Нет результатов</td></tr>';
                return;
            }

            resultsList.innerHTML = results.map(result => {
                const userName = result.user ? 
                    `${result.user.lastName} ${result.user.firstName}` : 
                    'Пользователь удален';
                    
                const testName = result.test ? result.test.title : 'Тест удален';
                const score = Math.round(result.score || 0);
                const date = new Date(result.completedAt).toLocaleString();
                
                return `
                    <tr>
                        <td>${userName}</td>
                        <td>${testName}</td>
                        <td>${score}%</td>
                        <td>${date}</td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading test results:', error);
            const resultsList = document.getElementById('testResultsList');
            if (resultsList) {
                resultsList.innerHTML = '<tr><td colspan="4">Ошибка при загрузке результатов</td></tr>';
            }
        }
    }

    // Update the loadStatistics function
    async function loadStatistics() {
        try {
            await Promise.all([
                loadUserStats(),
                loadTestStats(),
                loadTestCompletionStats(),
                loadTestResults() // Добавляем загрузку результатов
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
                const response = await fetchWithAuth('/api/admin/backup', {
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

    // Add periodic session check
    setInterval(async () => {
        const isStillAdmin = await checkAdminStatus();
        if (!isStillAdmin) {
            window.location.href = '/login.html';
        }
    }, 60000); // Check every minute
});
