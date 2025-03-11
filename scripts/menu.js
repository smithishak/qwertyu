document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.querySelector('.menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Закрываем меню при клике вне его
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('active') && 
                !e.target.closest('.sidebar') && 
                !e.target.closest('.menu-btn')) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Добавляем обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Очистка локального хранилища
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Перенаправление на страницу входа
            window.location.href = '/pages/login.html';
        });
    }
});