document.addEventListener('DOMContentLoaded', () => {
	const usersList = document.getElementById('usersList');
	const addUserForm = document.getElementById('addUserForm');
	const usersListMobile = document.getElementById('usersListMobile');
	
	// Хранилище паролей (временное, в памяти)
	const userPasswords = new Map();
	
	// Генерация случайного пароля
	function generatePassword() {
		const length = 8;
		const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let password = "";
		for (let i = 0; i < length; i++) {
			password += charset.charAt(Math.floor(Math.random() * charset.length));
		}
		return password;
	}

	// Загрузка списка пользователей
	async function loadUsers() {
		try {
			const response = await fetch('/api/users');
			const users = await response.json();
			
			usersList.innerHTML = users.map(user => `
				<tr>
					<td>${user.username}</td>
					<td>${user.lastName} ${user.firstName} ${user.middleName || ''}</td>
					<td>
						${userPasswords.get(user._id) || 'Пароль скрыт'}
						${userPasswords.get(user._id) ? 
							`<button onclick="copyPassword('${user._id}')" class="copy-btn">
								<i class="fas fa-copy"></i>
							</button>` : ''}
					</td>
					<td>
							<button onclick="editUser('${user._id}')" class="edit-btn">
								<i class="fas fa-edit"></i>
							</button>
							<button onclick="deleteUser('${user._id}')" class="delete-btn">
								<i class="fas fa-trash"></i>
							</button>
							<button onclick="resetPassword('${user._id}')" class="reset-btn">
								<i class="fas fa-key"></i>
							</button>
					</td>
				</tr>
			`).join('');

			// Добавляем пользователей в мобильный список
			usersListMobile.innerHTML = '';
			users.forEach(user => addUserToMobileList(user));
		} catch (error) {
			console.error('Ошибка загрузки пользователей:', error);
		}
	}

	// Добавляем функцию копирования пароля
	window.copyPassword = (userId) => {
		const password = userPasswords.get(userId);
		if (password) {
			navigator.clipboard.writeText(password)
				.then(() => alert('Пароль скопирован в буфер обмена'))
				.catch(() => alert('Ошибка при копировании пароля'));
		}
	};

	// Добавляем функцию сброса пароля
	window.resetPassword = async (userId) => {
		if (confirm('Сбросить пароль пользователя?')) {
			const newPassword = generatePassword();
			try {
				const response = await fetch(`/api/users/${userId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ password: newPassword })
				});

				if (response.ok) {
					userPasswords.set(userId, newPassword);
					alert(`Новый пароль: ${newPassword}`);
					loadUsers();
				} else {
					alert('Ошибка при сбросе пароля');
				}
			} catch (error) {
				console.error('Ошибка:', error);
				alert('Ошибка при сбросе пароля');
			}
		}
	};

	// Модифицируем обработчик добавления пользователя
	addUserForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const password = generatePassword();
		
		const userData = {
			username: addUserForm.username.value,
			password: password,
			firstName: addUserForm.firstName.value,
			lastName: addUserForm.lastName.value,
			middleName: addUserForm.middleName.value,
			phoneNumber: addUserForm.phoneNumber.value,
			email: addUserForm.email.value,
			passportNumber: addUserForm.passportNumber.value,
			snilsNumber: addUserForm.snilsNumber.value,
			isAdmin: addUserForm.isAdmin.checked
		};

		try {
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(userData)
			});

			const result = await response.json();
			if (response.ok) {
				userPasswords.set(result.user._id, password);
				alert(`Пользователь создан успешно!\nЛогин: ${userData.username}\nПароль: ${password}`);
				addUserForm.reset();
				loadUsers();
			} else {
				alert('Ошибка при создании пользователя');
			}
		} catch (error) {
			console.error('Ошибка:', error);
			alert('Ошибка при создании пользователя');
		}
	});

	// Функция удаления пользователя
	window.deleteUser = async (userId) => {
		if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
			try {
				const response = await fetch(`/api/users/${userId}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					alert('Пользователь успешно удален');
					loadUsers(); // Перезагружаем список
				} else {
					alert('Ошибка при удалении пользователя');
				}
			} catch (error) {
				console.error('Ошибка:', error);
				alert('Ошибка при удалении пользователя');
			}
		}
	};

	// Функция редактирования пользователя
	window.editUser = async (userId) => {
		try {
			const response = await fetch(`/api/users/${userId}`);
			const user = await response.json();
			
			const newData = {
				firstName: prompt('Имя:', user.firstName),
				lastName: prompt('Фамилия:', user.lastName),
				middleName: prompt('Отчество:', user.middleName || ''),
				isAdmin: confirm('Сделать администратором?')
			};

			if (newData.firstName && newData.lastName) {
				const updateResponse = await fetch(`/api/users/${userId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(newData)
				});

				if (updateResponse.ok) {
					alert('Данные пользователя обновлены');
					loadUsers(); // Перезагружаем список
				} else {
					alert('Ошибка при обновлении пользователя');
				}
			}
		} catch (error) {
			console.error('Ошибка:', error);
			alert('Ошибка при редактировании пользователя');
		}
	};

	// Обновляем функцию добавления пользователя в мобильный список
	function addUserToMobileList(user) {
		const userRow = document.createElement('div');
		userRow.classList.add('user-row');
		userRow.dataset.userId = user._id; // Добавляем data-атрибут с ID пользователя
	
		const userHeader = document.createElement('div');
		userHeader.classList.add('user-header');
		userHeader.innerHTML = `
			<div class="user-summary">
				<span class="user-preview">${user.lastName} ${user.firstName} ${user.middleName || ''}</span>
				<i class="fas fa-chevron-down"></i>
			</div>
			`;
	
		const userDetails = document.createElement('div');
		userDetails.classList.add('user-details');
		userDetails.innerHTML = `
			<div class="full-name">${user.lastName} ${user.firstName} ${user.middleName || ''}</div>
			<div class="user-role">${user.isAdmin ? 'Администратор' : 'Пользователь'}</div>
			<div class="action-buttons">
				<button class="edit-btn" data-user-id="${user._id}">
					<i class="fas fa-edit"></i> Редактировать
				</button>
				<button class="delete-btn" onclick="deleteUser('${user._id}')">
					<i class="fas fa-trash"></i> Удалить
				</button>
			</div>
		`;
	
		userRow.appendChild(userHeader);
		userRow.appendChild(userDetails);
		usersListMobile.appendChild(userRow);
	
		userHeader.addEventListener('click', () => {
			userRow.classList.toggle('expanded');
		});
	}

	// Функции для работы с модальным окном
	function openEditModal(userId) {
		const modal = document.getElementById('editUserModal');
		const form = document.getElementById('editUserForm');
		
		if (!modal || !form) {
			console.error('Модальное окно или форма не найдены');
			return;
		}
	
		// Получаем данные пользователя
		fetch(`/api/users/${userId}`)
			.then(response => {
				if (!response.ok) {
					throw new Error('Пользователь не найден');
				}
				return response.json();
			})
			.then(user => {
				// Заполняем форму данными пользователя
				form.elements.userId.value = user._id;
				form.elements.username.value = user.username || '';
				form.elements.firstName.value = user.firstName || '';
				form.elements.lastName.value = user.lastName || '';
				form.elements.middleName.value = user.middleName || '';
				form.elements.isAdmin.checked = !!user.isAdmin;
				
				modal.style.display = 'block';
			})
			.catch(error => {
				console.error('Ошибка:', error);
				alert('Ошибка при загрузке данных пользователя');
			});
	}

	function closeEditModal() {
		const modal = document.getElementById('editUserModal');
		modal.style.display = 'none';
	}

	// Обработчик отправки формы редактирования
	document.getElementById('editUserForm').addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = e.target;
		const userId = form.elements.userId.value;
		
		const userData = {
			username: form.elements.username.value,
			firstName: form.elements.firstName.value,
			lastName: form.elements.lastName.value,
			middleName: form.elements.middleName.value,
			isAdmin: form.elements.isAdmin.checked
		};

		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData)
			});

			if (response.ok) {
				closeEditModal();
				loadUsers(); // Перезагружаем список пользователей
				alert('Пользователь успешно обновлен');
			} else {
				const data = await response.json();
				alert(data.error || 'Ошибка при обновлении пользователя');
			}
		} catch (error) {
			console.error('Ошибка:', error);
			alert('Ошибка при обновлении пользователя');
		}
	});

	// Обработчик клика по кнопке редактирования
	document.addEventListener('click', function(e) {
		const editBtn = e.target.closest('.edit-btn');
		if (editBtn) {
			const userId = editBtn.dataset.userId || editBtn.closest('[data-user-id]')?.dataset.userId;
			if (userId) {
				openEditModal(userId);
			}
		}
	});

	// Закрытие модального окна при клике вне его
	window.addEventListener('click', function(e) {
		const modal = document.getElementById('editUserModal');
		if (e.target === modal) {
			closeEditModal();
		}
	});

	// Добавляем обработчик для кнопки отмены
	document.getElementById('cancelEditBtn').addEventListener('click', () => {
		closeEditModal();
	});

	// Инициализация
	loadUsers();
});