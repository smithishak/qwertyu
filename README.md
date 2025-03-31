# Web Application Near

Веб-приложение для управления тестированием и обучением пользователей.

## 📋 Содержание
- [Обзор](#обзор)
- [Основные функции](#основные-функции)
- [Технологии](#технологии)
- [Основные части кода](#основные-части-кода)
- [Установка и запуск](#установка-и-запуск)
- [Структура проекта](#структура-проекта)
- [Административная панель](#административная-панель)
- [API Endpoints](#api-endpoints)
- [Мобильная версия](#мобильная-версия)

## 🌟 Обзор
Web Application Near - это современная платформа для организации тестирования и обучения пользователей. Система включает в себя управление пользователями, создание и проведение тестов, а также размещение обучающих материалов различных форматов.

## 🎯 Основные функции

### Управление пользователями
- Создание и редактирование пользователей
- Разграничение прав доступа (администратор/пользователь)
- Отслеживание активности пользователей
- Просмотр статистики по каждому пользователю

### Система тестирования
- Создание тестов с множественным выбором
- Редактирование существующих тестов
- Добавление и управление вопросами
- Установка правильных ответов
- Просмотр результатов тестирования
- Статистика прохождения тестов

### Обучающие материалы
- Загрузка документов (PDF, DOCX)
- Добавление видеоматериалов
- Создание текстовых материалов с форматированием
- Организация материалов по категориям
- Удобный просмотр и скачивание

## 🛠 Технологии

### Frontend
- **HTML5**
  - Семантическая разметка
  - Формы с валидацией
  - LocalStorage для кэширования
  - Drag and Drop API для загрузки файлов

- **CSS3**
  - Flexbox и Grid для layouting
  - CSS Variables для темизации
  - CSS Animations для интерактивности
  - Media Queries для адаптивности
  - Custom Properties для управления стилями

- **JavaScript (ES6+)**
  - Async/Await для асинхронных операций
  - Fetch API для работы с сервером
  - ES6 Modules для модульности
  - Event Handling для интерактивности
  - DOM Manipulation для динамического контента

### Backend
- **Node.js**
  - Express.js как основной фреймворк
  - Multer для обработки файлов
  - Cors для кросс-доменных запросов
  - Dotenv для конфигурации
  - Morgan для логирования

- **Express.js Features**
  - Middleware система
  - Роутинг
  - Статические файлы
  - Обработка ошибок
  - Sessions для аутентификации

### База данных
- **MongoDB**
  - Mongoose для ODM
  - Индексация для оптимизации
  - Агрегации для статистики
  - Транзакции для целостности данных
  - Схемы и валидация

### Безопасность
- **Аутентификация**
  - Express-session
  - Cookie Parser
  - CSRF защита
  - Rate Limiting
  - Helmet.js

### Дополнительные инструменты
- **Nodemon**
  - Автоперезагрузка сервера
  - Отслеживание изменений
  
- **ESLint**
  - Проверка кода
  - Стандартизация стиля

- **Font Awesome 5**
  - Иконки интерфейса
  - SVG формат
  - Оптимизация загрузки

### Инструменты разработки
- **Git**
  - Версионный контроль
  - Ветвление для фич
  - Командная разработка

- **VS Code**
  - Live Server
  - Debugger
  - Extensions для разработки

### Оптимизация
- **Производительность**
  - Компрессия Gzip
  - Кэширование статики
  - Минификация ресурсов
  - Lazy Loading
  - Оптимизация изображений

### Тестирование
- **Jest**
  - Unit тесты
  - Integration тесты
  - API тесты
  
- **Postman**
  - Тестирование API
  - Коллекции запросов
  - Автоматизация тестов

## 💻 Основные части кода

### Модель теста
```javascript
// models/test.js
const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
});
```

### API эндпоинт для создания теста
```javascript
// server.js
app.post('/api/tests', checkAdmin, async (req, res) => {
    try {
        const { title, description } = req.body;
        const newTest = {
            title,
            description,
            questions: [],
            isActive: true,
            createdAt: new Date()
        };
        const result = await testsCollection.insertOne(newTest);
        res.status(201).json({
            success: true,
            test: { ...newTest, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при создании теста' });
    }
});
```

### Пример frontend кода для отображения тестов
```javascript
// scripts/test.js
async function loadTests() {
    try {
        const response = await fetch('/api/tests');
        const tests = await response.json();
        
        testsList.innerHTML = tests.map(test => `
            <div class="test-card">
                <h3 class="test-title">${escapeHtml(test.title)}</h3>
                <p class="test-description">${escapeHtml(test.description)}</p>
                <div class="test-meta">
                    <span><i class="fas fa-question-circle"></i> ${test.questions.length}</span>
                </div>
                <button onclick="startTest('${test._id}')">Начать тест</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки тестов:', error);
    }
}
```

### Аутентификация и проверка прав
```javascript
// middlewares/auth.js
const checkAdmin = (req, res, next) => {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
};

const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }
    next();
};
```

### Обработка загрузки материалов
```javascript
// routes/materials.js
app.post('/api/materials', upload.single('file'), async (req, res) => {
    try {
        const { title, description, type } = req.body;
        const file = req.file;
        
        const material = new Material({
            title,
            description,
            type,
            fileUrl: file ? file.path : null,
            mimeType: file ? file.mimetype : null
        });

        await material.save();
        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при загрузке материала' });
    }
});
```

### CSS стили компонентов
```css
/* styles/main.css */
.test-card {
    background: white;
    border-radius: 16px;
    padding: 25px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.test-card:hover {
    transform: translateY(-5px);
}

.material-card {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## 📥 Установка и запуск

1. Клонирование репозитория:
```bash
git clone [url-репозитория]
cd web-app-near
```

2. Установка зависимостей:
```bash
npm install
```

3. Настройка переменных окружения:
Создайте файл `.env` в корневой директории:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/web-app-near
SESSION_SECRET=your_secret_key
```

4. Запуск приложения:
```bash
npm start
```

## 📁 Структура проекта

```
web-app-near/
├── models/             # Модели данных MongoDB
├── public/            # Статические файлы
├── routes/            # Маршруты API
├── scripts/           # JavaScript файлы
├── styles/           # CSS стили
├── views/            # HTML шаблоны
└── server.js         # Основной файл сервера
```

## 👨‍💼 Административная панель

### Функции администратора:
- Управление пользователями
- Создание и редактирование тестов
- Управление вопросами
- Загрузка обучающих материалов
- Просмотр статистики
- Создание резервных копий

### Статистика и аналитика:
- Количество пользователей
- Активность пользователей
- Статистика прохождения тестов
- Популярные материалы

## 🌐 API Endpoints

### Пользователи
- `GET /api/users` - получение списка пользователей
- `POST /api/users` - создание пользователя
- `PUT /api/users/:id` - обновление пользователя
- `DELETE /api/users/:id` - удаление пользователя

### Тесты
- `GET /api/tests` - получение списка тестов
- `POST /api/tests` - создание теста
- `PUT /api/tests/:id` - обновление теста
- `DELETE /api/tests/:id` - удаление теста

### Материалы
- `GET /api/materials` - получение списка материалов
- `POST /api/materials` - добавление материала
- `DELETE /api/materials/:id` - удаление материала

### Подробное описание работы API

#### Аутентификация
```javascript
// Пример входа в систему
POST /api/auth/login
Body: {
    "username": "user@example.com",
    "password": "password123"
}

// Успешный ответ
{
    "success": true,
    "user": {
        "id": "123",
        "username": "user@example.com",
        "isAdmin": false
    }
}
```

#### Работа с тестами

1. **Получение списка тестов**
```javascript
GET /api/tests

// Ответ
{
    "tests": [
        {
            "_id": "test123",
            "title": "JavaScript Основы",
            "description": "Базовый тест по JavaScript",
            "questions": ["question1", "question2"],
            "createdAt": "2023-01-01T12:00:00Z"
        }
    ]
}
```

2. **Создание нового теста**
```javascript
POST /api/tests
Headers: {
    "Content-Type": "application/json",
    // Session cookie автоматически отправляется браузером
}
Body: {
    "title": "Новый тест",
    "description": "Описание теста"
}

// Успешный ответ
{
    "success": true,
    "test": {
        "_id": "newTest123",
        "title": "Новый тест",
        "description": "Описание теста",
        "questions": []
    }
}
```

3. **Добавление вопроса к тесту**
```javascript
POST /api/tests/{testId}/questions
Body: {
    "questionText": "Что такое JavaScript?",
    "answers": [
        "Язык программирования",
        "База данных",
        "Операционная система"
    ],
    "correctAnswer": 0
}
```

#### Работа с материалами

1. **Загрузка файла**
```javascript
// Пример загрузки PDF файла
POST /api/materials
Headers: {
    "Content-Type": "multipart/form-data"
}
FormData: {
    "title": "Лекция 1",
    "description": "Введение в JavaScript",
    "type": "document",
    "file": [бинарные данные файла]
}
```

2. **Получение материала**
```javascript
GET /api/materials/{materialId}
// Для скачивания файла
GET /api/materials/{materialId}/download
```

### Примеры использования API на frontend

```javascript
// Пример отправки теста
async function submitTest(testId, answers) {
    try {
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
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Ошибка при отправке теста:', error);
        throw error;
    }
}

// Пример загрузки файла
async function uploadMaterial(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('type', 'document');

    try {
        const response = await fetch('/api/materials', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке:', error);
        throw error;
    }
}
```

### Защита API

1. **Middleware аутентификации**
```javascript
// Проверка авторизации
const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({
            error: 'Требуется авторизация'
        });
    }
    next();
};

// Проверка прав администратора
const checkAdmin = (req, res, next) => {
    if (!req.session.user?.isAdmin) {
        return res.status(403).json({
            error: 'Требуются права администратора'
        });
    }
    next();
};
```

2. **Обработка ошибок**
```javascript
// Пример middleware для обработки ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: err.message
    });
});
```

### Схема взаимодействия с API

1. **Клиент → Сервер**
   - Отправка запроса с данными
   - Автоматическая отправка куки сессии
   - Включение необходимых заголовков

2. **Сервер**
   - Проверка аутентификации
   - Валидация данных
   - Обработка запроса
   - Формирование ответа

3. **Сервер → Клиент**
   - Отправка ответа с данными
   - Статус код операции
   - Сообщение об ошибке (если есть)

## 📱 Мобильная версия

Приложение адаптировано для мобильных устройств:
- Адаптивный дизайн
- Touch-friendly интерфейс
- Оптимизированные изображения
- Удобная навигация
- Поддержка жестов

## 🎨 Дизайн система

### Цветовая схема:
- Основной цвет: `#3498db`
- Второстепенный цвет: `#2ecc71`
- Фон: `#f5f6fa`
- Текст: `#2c3e50`

### Типография:
- Основной шрифт: System UI
- Заголовки: 24px - 32px
- Основной текст: 16px
- Вспомогательный текст: 14px

### Компоненты:
- Кнопки
- Формы
- Карточки
- Модальные окна
- Таблицы
- Навигация

## 🔒 Безопасность
- Защита от XSS
- CSRF токены
- Безопасные сессии
- Валидация данных
- Защита от инъекций
- Логирование ошибок

## 📊 Производительность
- Кэширование статики
- Оптимизация изображений
- Минификация CSS/JS
- Gzip сжатие
- Lazy loading
- Оптимизация запросов к БД

## 🔧 Обслуживание
- Логирование
- Мониторинг
- Резервное копирование
- Обработка ошибок
- Автоматическое восстановление

## 📝 Лицензия
MIT License