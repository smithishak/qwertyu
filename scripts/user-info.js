document.addEventListener('DOMContentLoaded', () => {
    const userInfoContainer = document.querySelector('.user-info');
    const userNameElement = userInfoContainer.querySelector('.user-name');
    const userRoleElement = userInfoContainer.querySelector('.user-role');

    // Получаем данные пользователя из localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (userInfo) {
        // Формируем ФИО
        const fullName = [
            userInfo.lastName,
            userInfo.firstName,
            userInfo.middleName
        ].filter(Boolean).join(' ');

        // Устанавливаем ФИО
        userNameElement.textContent = fullName;

        // Устанавливаем роль
        userRoleElement.textContent = userInfo.isAdmin ? 'Администратор' : 'Пользователь';
    } else {
        userNameElement.textContent = 'Гость';
        userRoleElement.textContent = '';
    }
});
