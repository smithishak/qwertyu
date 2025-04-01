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

    // Функция для отображения ошибки
    const showError = (message) => {
        alert(message);
    };

    // Функция авторизации
    async function login(login, password) {
        try {
            console.log('Sending login request for:', login);

            // Добавляем таймаут для запроса
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

            const response = await fetch('/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login, password }),
                credentials: 'same-origin',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            console.log('Server response:', { 
                status: response.status, 
                success: data.success 
            });

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка авторизации');
            }

            if (data.success) {
                localStorage.setItem('userInfo', JSON.stringify({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    middleName: data.middleName || '',
                    isAdmin: data.isAdmin || false,
                    username: data.username
                }));

                window.location.href = data.isAdmin ? '/admin-panel.html' : '/index.html';
            } else {
                throw new Error(data.message || 'Ошибка авторизации');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.name === 'AbortError') {
                throw new Error('Сервер не отвечает. Проверьте подключение.');
            } else if (error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу. Убедитесь, что сервер запущен.');
            }
            throw error;
        }
    }

    // Обработчик отправки формы
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Предотвращаем стандартную отправку формы
        
        // Получаем данные из формы
        const loginValue = loginForm.querySelector('input[name="username"]').value;
        const passwordValue = loginForm.querySelector('input[name="password"]').value;

        // Добавим отладочный вывод
        console.log('Попытка входа:', { login: loginValue, password: passwordValue });

        // Проверяем валидацию
        const error = validateForm(loginValue, passwordValue);
        if (error) {
            alert(error);
            return;
        }

        // Блокируем кнопку и показываем загрузку
        submitButton.disabled = true;
        submitButton.textContent = 'Выполняется вход...';

        try {
            await login(loginValue, passwordValue);
        } catch (error) {
            showError(error.message);
        } finally {
            // Возвращаем кнопку в исходное состояние
            submitButton.disabled = false;
            submitButton.textContent = 'Войти';
        }
    });
});
