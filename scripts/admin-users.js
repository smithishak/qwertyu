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
	async function loadUsers(searchQuery = '') {
		try {
			const response = await fetch(`/api/users${searchQuery ? `?search=${searchQuery}` : ''}`);
			if (!response.ok) throw new Error('Failed to load users');
			const users = await response.json();
			
			const tbody = document.getElementById('usersList');
			const mobileList = document.getElementById('usersListMobile');
			
			if (!tbody || !mobileList) {
				console.error('Required DOM elements not found');
				return;
			}

			tbody.innerHTML = '';
			mobileList.innerHTML = '';
			
			users.forEach((user, index) => {
				const fullName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
				
				// Desktop view
				const tr = document.createElement('tr');
				tr.innerHTML = `
					<td>${fullName}</td>
					<td>${user.email || '-'}</td>
					<td>${user.isAdmin ? 'Администратор' : 'Пользователь'}</td>
					<td>
						<div class="action-buttons">
							<button class="edit-btn" title="Редактировать"><i class="fas fa-edit"></i></button>
							<button class="delete-btn" title="Удалить"><i class="fas fa-trash"></i></button>
							<button class="reset-btn" title="Сбросить пароль"><i class="fas fa-key"></i></button>
						</div>
					</td>
				`;
				tbody.appendChild(tr);
				attachActionHandlers(tr, user);

				// Mobile view
				const userRow = document.createElement('div');
				userRow.classList.add('user-row');
				userRow.innerHTML = `
					<div class="user-header">
						<div class="user-summary">
							<span class="user-number">${index + 1}</span>
							<span class="user-preview">${fullName}</span>
							<i class="fas fa-chevron-down"></i>
						</div>
					</div>
					<div class="user-details">
						<div class="full-name">${fullName}</div>
						<div class="user-email">${user.email || '-'}</div>
						<div class="user-role">${user.isAdmin ? 'Администратор' : 'Пользователь'}</div>
						<div class="action-buttons">
							<button class="icon-btn edit-btn" data-user-id="${user._id}">
								<i class="fas fa-edit"></i> <span>Редактировать</span>
							</button>
							<button class="icon-btn reset-btn" onclick="resetPassword('${user._id}')">
								<i class="fas fa-key"></i> <span>Сбросить пароль</span>
							</button>
							<button class="icon-btn delete-btn" onclick="deleteUser('${user._id}')">
								<i class="fas fa-trash"></i> <span>Удалить</span>
							</button>
						</div>
					</div>
				`;
				mobileList.appendChild(userRow);

				// Add toggle handler for mobile view
				const header = userRow.querySelector('.user-header');
				header.addEventListener('click', () => {
					userRow.classList.toggle('expanded');
				});
			});
		} catch (error) {
			console.error('Error:', error);
			alert('Ошибка при загрузке пользователей');
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

	// Add helper functions for generating user data
	function generateUsername(firstName, lastName) {
		const transliterate = str => {
			const ru = {
				'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
				'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
				'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
				'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
				'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
			};
			return str.toLowerCase().split('').map(char => ru[char] || char).join('');
		};

		const translitFirstName = transliterate(firstName);
		const translitLastName = transliterate(lastName);
		
		// Добавляем случайное число от 100 до 999
		const randomNum = Math.floor(Math.random() * 900 + 100);
		return translitFirstName.charAt(0) + translitLastName + randomNum;
	}

	function generatePassword() {
		const length = 8;
		const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		return Array.from(crypto.getRandomValues(new Uint32Array(length)))
			.map(x => charset[x % charset.length])
			.join('');
	}

	// Модифицируем обработчик добавления пользователя
	addUserForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		
		try {
			const formData = new FormData(e.target);
			const firstName = formData.get('firstName')?.trim();
			const lastName = formData.get('lastName')?.trim();

			if (!firstName || !lastName) {
				throw new Error('Имя и фамилия обязательны для заполнения');
			}

			const userData = {
				firstName,
				lastName,
				middleName: formData.get('middleName')?.trim() || '',
				email: formData.get('email')?.trim() || '',
				phoneNumber: '', // Add default phone number
				isAdmin: formData.get('isAdmin') === 'on',
				username: generateUsername(firstName, lastName),
				password: generatePassword()
			};

			console.log('Sending user data:', userData); // Debug log

			const response = await fetch('/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(userData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Ошибка при создании пользователя');
			}

			const data = await response.json();

			// Store the password temporarily
			userPasswords.set(data.user._id, userData.password);

			alert(`Пользователь успешно создан!\nЛогин: ${userData.username}\nПароль: ${userData.password}`);
			e.target.reset();
			await loadUsers();

		} catch (error) {
			console.error('Ошибка создания пользователя:', error);
			alert(error.message);
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
	async function editUser(user) {
		try {
			const modal = document.getElementById('editUserModal');
			if (!modal) {
				throw new Error('Modal element not found');
			}

			const response = await fetch(`/api/users/${user._id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch user data');
			}

			const userData = await response.json();
			console.log('User data fetched:', userData);

			// Fill form fields
			const form = document.getElementById('editUserForm');
			form.elements.userId.value = userData._id;
			form.elements.firstName.value = userData.firstName || '';
			form.elements.lastName.value = userData.lastName || '';
			form.elements.middleName.value = userData.middleName || '';
			form.elements.phoneNumber.value = userData.phoneNumber || '';
			form.elements.email.value = userData.email || '';
			form.elements.isAdmin.checked = userData.isAdmin || false;

			// Show modal
			modal.classList.add('active');
		} catch (error) {
			console.error('Error editing user:', error);
			alert('Ошибка при редактировании пользователя: ' + error.message);
		}
	}

	function closeEditModal() {
		const modal = document.getElementById('editUserModal');
		modal.classList.remove('active');
	}

	// Обновляем функцию добавления пользователя в мобильный список
	function addUserToMobileList(user) {
		const userRow = document.createElement('div');
		userRow.classList.add('user-row');
		userRow.dataset.userId = user._id;
	
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
				<button class="icon-btn edit-btn" data-user-id="${user._id}">
					<i class="fas fa-edit"></i> <span>Редактировать</span>
				</button>
				<button class="icon-btn reset-btn" onclick="resetPassword('${user._id}')">
					<i class="fas fa-key"></i> <span>Сменить пароль</span>
				</button>
				<button class="icon-btn delete-btn" onclick="deleteUser('${user._id}')">
					<i class="fas fa-trash"></i> <span>Удалить</span>
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

	// Обработчик отправки формы редактирования
	document.getElementById('editUserForm').addEventListener('submit', async (e) => {
		e.preventDefault();
		const form = e.target;
		const userId = form.elements.userId.value;
		
		const userData = {
			firstName: form.elements.firstName.value,
			lastName: form.elements.lastName.value,
			middleName: form.elements.middleName.value,
			phoneNumber: form.elements.phoneNumber.value,
			email: form.elements.email.value,
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
				loadUsers();
				alert('Пользователь успешно обновлен');
			} else {
				const data = await response.json();
				alert(data.error || 'Ошибка при обновлении пользователя');
			}
		} catch (error) {
			console.error('Error:', error);
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

	// Update attachActionHandlers function
	function attachActionHandlers(tr, user) {
		if (!tr || !user) {
			console.error('Invalid parameters for attachActionHandlers');
			return;
		}

		const editBtn = tr.querySelector('.edit-btn');
		const deleteBtn = tr.querySelector('.delete-btn');
		const resetBtn = tr.querySelector('.reset-btn');

		if (editBtn) {
			editBtn.addEventListener('click', () => editUser(user));
		}
		if (deleteBtn) {
			deleteBtn.addEventListener('click', () => deleteUser(user._id));
		}
		if (resetBtn) {
			resetBtn.addEventListener('click', () => resetPassword(user._id));
		}
	}

	// Инициализация
	loadUsers();
});