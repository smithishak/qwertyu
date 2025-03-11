// Ожидаем загрузку DOM
document.addEventListener('DOMContentLoaded', () => {
    // Получаем форму входа
    const loginForm = document.getElementById('loginForm');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    // Функция валидации
    const validateForm = (login, password) => {
        if (!login.trim()) return 'Введите логин';
        if (!password.trim()) return 'Введите пароль';
        if (password.length < 6) return 'Пароль должен быть не менее 6 символов';
        return null;
    };

    // Обработчик отправки формы
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Предотвращаем стандартную отправку формы
        
        // Получаем данные из формы
        const login = loginForm.querySelector('input[name="username"]').value;
        const password = loginForm.querySelector('input[name="password"]').value;

        // Добавим отладочный вывод
        console.log('Попытка входа:', { login, password });

        // Проверяем валидацию
        const error = validateForm(login, password);
        if (error) {
            alert(error);
            return;
        }

        // Блокируем кнопку и показываем загрузку
        submitButton.disabled = true;
        submitButton.textContent = 'Выполняется вход...';

        try {
            // Отправляем запрос на сервер
            const response = await fetch('/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ login, password })
            });

            const data = await response.json();
            
            // Расширенное логирование
            console.group('Детальная отладка авторизации');
            console.log('Исходные данные входа:', { login, password });
            console.log('Статус ответа:', response.status);
            console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()));
            console.log('Тело ответа:', data);
            console.log('isAdmin:', data.isAdmin);
            console.log('Тип isAdmin:', typeof data.isAdmin);
            console.groupEnd();
            
            // Обрабатываем ответ
            if (data.success) {
                // Сохраняем информацию о пользователе
                localStorage.setItem('isAdmin', data.isAdmin);
                
                if (data.isAdmin === true) {
                    console.log('Пользователь админ, редирект на админ-панель');
                    window.location.href = '/admin-panel.html';
                } else {
                    console.log('Обычный пользователь, редирект на главную');
                    window.location.href = '/index.html';
                }
            } else {
                // При ошибке показываем сообщение
                alert('Неверный логин или пароль');
            }
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            alert('Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
        } finally {
            // Возвращаем кнопку в исходное состояние
            submitButton.disabled = false;
            submitButton.textContent = 'Войти';
        }
    });
});
