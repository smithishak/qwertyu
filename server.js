// Импорт необходимых модулей
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const { ObjectId } = require('mongodb');
const fs = require('fs');
const Test = require('./models/test');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
let gridFSBucket;

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/web-app-db', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log('MongoDB подключен успешно'))
.catch(err => console.error('Ошибка подключения к MongoDB:', err));

const db = mongoose.connection;
let questionsCollection;
let testsCollection; // Добавляем переменную для коллекции тестов
let materialsCollection;
let videosCollection;
let documentsCollection;

db.once('open', async () => {
    questionsCollection = db.collection('questions');
    testsCollection = db.collection('tests'); // Инициализируем коллекцию тестов
    materialsCollection = db.collection('materials');
    videosCollection = db.collection('videos');
    documentsCollection = db.collection('documents');
    gridFSBucket = new GridFSBucket(db);
    console.log('Коллекции questions и tests инициализированы');
});

// Инициализация Express приложения
const app = express();

// Изменяем настройки multer для сохранения в памяти
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware для обработки JSON данных и статических файлов
app.use(express.json());

// Add session middleware
const session = require('express-session');
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Add new middleware for authentication check
const checkAuth = async (req, res, next) => {
    // Allow access to login page and auth endpoints
    const publicPaths = [
        '/login.html',
        '/pages/login.html',
        '/auth',
        '/styles/login.css',
        '/scripts/login.js'
    ];

    // Allow static assets for login page
    if (publicPaths.includes(req.path) || 
        req.path.startsWith('/styles/') || 
        req.path.startsWith('/scripts/')) {
        return next();
    }

    // Check if user is logged in (you'll need to implement session management)
    if (!req.session?.authenticated) {
        // If accessing HTML page, redirect to login
        if (req.path.endsWith('.html') || req.path === '/') {
            return res.redirect('/login.html');
        }
        // If accessing API, return unauthorized
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// Apply authentication middleware
app.use(checkAuth);

// Обновляем middleware проверки админа
const checkAdmin = async (req, res, next) => {
    if (!req.session?.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};

// Маршрут для авторизации
app.post('/auth', async (req, res) => {
    const { login, password } = req.body;
    try {
        const user = await User.findOne({ username: login });
        
        if (!user || user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Неверный логин или пароль' 
            });
        }
        
        // Set session data
        req.session.authenticated = true;
        req.session.userId = user._id;
        req.session.isAdmin = user.isAdmin;
        
        // Обновляем время последнего входа
        await User.findByIdAndUpdate(user._id, {
            lastLoginDate: new Date()
        });
        
        res.json({ 
            success: true,
            username: user.username,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера' 
        });
    }
});

// Add logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.json({ success: true });
    });
});

// Protected admin routes
app.get('/api/check-admin', checkAdmin, (req, res) => {
    res.json({ success: true });
});

// Защищенный маршрут для админ-панели
app.get('/admin-panel.html', checkAdmin, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'admin-panel.html'));
});

// Добавляем защиту для страниц управления
app.get('/views/users-management.html', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/users-management.html'));
});

app.get('/views/questions-management.html', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/questions-management.html'));
});

// Добавляем маршрут для страницы управления теорией
app.get('/views/theory-management.html', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'views/theory-management.html'));
});

// Добавляем маршрут для проверки статуса подключения к БД
app.get('/api/db-status', (req, res) => {
    res.json({ 
        connected: !!questionsCollection,
        dbStatus: mongoose.connection.readyState
    });
});

// API маршруты для пользователей
app.get('/api/users', checkAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/users', checkAdmin, async (req, res) => {
    try {
        const userData = req.body;
        
        // Validate required fields
        if (!userData.username || !userData.password || !userData.firstName || !userData.lastName) {
            return res.status(400).json({ 
                error: 'Не все обязательные поля заполнены'
            });
        }

        // Create user instance
        const newUser = new User({
            username: userData.username,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            middleName: userData.middleName || '',
            email: userData.email || '',
            isAdmin: !!userData.isAdmin,
            createdAt: new Date(),
            lastLoginDate: null
        });

        // Save user to database
        await newUser.save();

        // Send response with user data (excluding password)
        res.status(201).json({
            success: true,
            user: {
                _id: newUser._id,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                middleName: newUser.middleName,
                email: newUser.email,
                isAdmin: newUser.isAdmin,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        if (error.code === 11000) { // MongoDB duplicate key error
            res.status(400).json({ 
                error: 'Пользователь с таким логином уже существует' 
            });
        } else {
            res.status(500).json({ 
                error: 'Ошибка сервера',
                details: error.message 
            });
        }
    }
});

app.delete('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        const result = await User.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        // Удаляем возможность обновления username
        const { username, ...updateData } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, select: '-password' }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(updatedUser);
    } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавляем маршрут для получения данных пользователя
app.get('/api/users/:id', checkAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json(user);
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Важно: размещаем ДО других маршрутов questions
// API маршруты для вопросов
app.get('/api/questions/:id', async (req, res) => {
    try {
        const question = await questionsCollection.findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!question) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }

        res.json(question);
    } catch (error) {
        console.error('Ошибка при получении вопроса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновляем endpoint для редактирования вопроса
app.put('/api/questions/:id', async (req, res) => {
    try {
        if (!questionsCollection) {
            return res.status(500).json({ error: 'База данных не инициализирована' });
        }

        const questionId = req.params.id;
        console.log('Received question update request:', { id: questionId, body: req.body }); // Debug log

        if (!ObjectId.isValid(questionId)) {
            console.error('Invalid ObjectId:', questionId);
            return res.status(400).json({ error: 'Неверный формат ID вопроса' });
        }

        const { testId, questionText, answers, correctAnswer } = req.body;

        // Validate required fields
        if (!testId || !questionText || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }

        // Convert testId to ObjectId if valid
        let testObjId;
        try {
            testObjId = new ObjectId(testId);
        } catch (error) {
            return res.status(400).json({ error: 'Неверный формат ID теста' });
        }

        const questionObjId = new ObjectId(questionId);

        // Update the question
        const updateResult = await questionsCollection.updateOne(
            { _id: questionObjId },
            {
                $set: {
                    testId: testObjId,
                    questionText: questionText.trim(),
                    answers: answers.map(a => a.trim()),
                    correctAnswer: Number(correctAnswer),
                    updatedAt: new Date()
                }
            }
        );

        console.log('Update result:', updateResult); // Debug log

        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }

        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ error: 'Нет изменений для сохранения' });
        }

        // Fetch and return the updated question
        const updatedQuestion = await questionsCollection.findOne({ _id: questionObjId });
        res.json(updatedQuestion);

    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            details: error.message
        });
    }
});

app.delete('/api/questions/:id', async (req, res) => {
    try {
        const result = await questionsCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Вопрос не найден' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении вопроса:', error);
        res.status(500).json({ error: 'Ошибка при удалении вопроса' });
    }
});

// Общие маршруты questions идут ПОСЛЕ специфичных
app.get('/api/questions', async (req, res) => {
    try {
        if (!questionsCollection) {
            throw new Error('База данных не инициализирована');
        }
        const questions = await questionsCollection.find({}).toArray();
        
        // Фильтруем некорректные записи
        const validQuestions = questions.filter(q => 
            q && 
            typeof q.questionText === 'string' && 
            Array.isArray(q.answers) &&
            typeof q.correctAnswer === 'number'
        );

        res.setHeader('Content-Type', 'application/json');
        res.json(validQuestions || []);
    } catch (error) {
        console.error('Ошибка при получении вопросов:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/questions', async (req, res) => {
    if (!questionsCollection) {
        return res.status(500).json({ error: 'База данных не инициализирована' });
    }
    try {
        const { testId, questionText, answers, correctAnswer } = req.body;

        // Проверяем существование теста
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        // Создаем новый вопрос
        const questionData = { questionText, answers, correctAnswer };
        const result = await questionsCollection.insertOne(questionData);
        
        // Добавляем вопрос к тесту
        await Test.findByIdAndUpdate(testId, {
            $push: { questions: result.insertedId }
        });

        res.json({ 
            success: true, 
            id: result.insertedId 
        });
    } catch (error) {
        console.error('Ошибка при добавлении вопроса:', error);
        res.status(500).json({ error: 'Ошибка при добавлении вопроса' });
    }
});

// ВАЖНО: Все маршруты для questions размещаем здесь, перед общими маршрутами
app.get('/api/questions/public', async (req, res) => {
    try {
        if (!questionsCollection) {
            throw new Error('База данных не инициализирована');
        }
        const questions = await questionsCollection.find({}).toArray();
        // Удаляем информацию о правильных ответах перед отправкой
        const publicQuestions = questions.map(({ questionText, answers, _id }) => ({
            _id,
            questionText,
            answers
        }));
        res.json(publicQuestions);
    } catch (error) {
        console.error('Ошибка при получении вопросов:', error);
        res.status(500).json({ error: error.message });
    }
});

// Добавляем endpoint для получения вопросов конкретного теста
app.get('/api/tests/:testId/questions', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId);
        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        const questions = await questionsCollection
            .find({
                _id: { $in: test.questions }
            })
            .toArray();

        res.json(questions);
    } catch (error) {
        console.error('Ошибка при получении вопросов теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновляем API endpoints для тестов
app.post('/api/tests', checkAdmin, async (req, res) => {
    if (!testsCollection) {
        console.error('Коллекция тестов не инициализирована');
        return res.status(500).json({ error: 'База данных не инициализирована' });
    }
    try {
        console.log('Получены данные для создания теста:', req.body);
        const { title, description } = req.body;
        
        if (!title) {
            console.error('Отсутствует обязательное поле title');
            return res.status(400).json({ error: 'Название теста обязательно' });
        }

        const newTest = {
            title,
            description: description || '',
            questions: [],
            isActive: true,
            createdAt: new Date(),
            createdBy: req.session.userId // Добавляем ID создателя
        };

        console.log('Создаем новый тест:', newTest);
        const result = await testsCollection.insertOne(newTest);
        console.log('Тест создан, ID:', result.insertedId);

        res.status(201).json({
            success: true,
            test: { ...newTest, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Ошибка создания теста:', error);
        res.status(500).json({ error: 'Ошибка при создании теста', details: error.message });
    }
});

app.get('/api/tests', async (req, res) => {
    if (!testsCollection) {
        return res.status(500).json({ error: 'База данных не инициализирована' });
    }
    try {
        const tests = await testsCollection.find({}).toArray();
        // Добавляем информацию о вопросах для каждого теста
        const testsWithQuestions = await Promise.all(tests.map(async (test) => {
            if (test.questions && test.questions.length > 0) {
                const questions = await questionsCollection
                    .find({ _id: { $in: test.questions.map(id => new ObjectId(id)) } })
                    .toArray();
                return { ...test, questions };
            }
            return { ...test, questions: [] };
        }));
        res.json(testsWithQuestions);
    } catch (error) {
        console.error('Ошибка получения тестов:', error);
        res.status(500).json({ error: 'Ошибка при получении тестов' });
    }
});

app.delete('/api/tests/:id', checkAdmin, async (req, res) => {
    try {
        const testId = new ObjectId(req.params.id);
        
        // Находим и удаляем связанные вопросы
        if (questionsCollection) {
            await questionsCollection.deleteMany({ testId });
        }

        // Удаляем сам тест
        const result = await testsCollection.deleteOne({ _id: testId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        res.json({ success: true, message: 'Тест успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении теста:', error);
        res.status(500).json({ error: 'Ошибка при удалении теста' });
    }
});

// Обновляем endpoint для редактирования теста
app.put('/api/tests/:id', checkAdmin, async (req, res) => {
    try {
        if (!testsCollection) {
            console.error('Tests collection not initialized');
            return res.status(500).json({ error: 'База данных не инициализирована' });
        }

        const testId = req.params.id;
        console.log('Updating test:', testId, req.body); // Debug log

        // Validate ObjectId
        if (!ObjectId.isValid(testId)) {
            console.error('Invalid test ID:', testId);
            return res.status(400).json({ error: 'Неверный формат ID теста' });
        }

        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Название теста обязательно' });
        }

        // Use updateOne instead of findOneAndUpdate
        const result = await testsCollection.updateOne(
            { _id: new ObjectId(testId) },
            {
                $set: {
                    title: title.trim(),
                    description: description ? description.trim() : '',
                    updatedAt: new Date()
                }
            }
        );

        console.log('Update result:', result); // Debug log

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        if (result.modifiedCount === 0) {
            return res.status(400).json({ error: 'Нет изменений для сохранения' });
        }

        // Fetch and return the updated test
        const updatedTest = await testsCollection.findOne({ _id: new ObjectId(testId) });
        res.json(updatedTest);

    } catch (error) {
        console.error('Error updating test:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Добавляем endpoint для получения конкретного теста
app.get('/api/tests/:id', async (req, res) => {
    try {
        const test = await testsCollection.findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        // Получаем вопросы теста
        const questions = await questionsCollection
            .find({ _id: { $in: test.questions.map(id => new ObjectId(id)) } })
            .toArray();

        res.json({
            ...test,
            questions
        });
    } catch (error) {
        console.error('Ошибка при получении теста:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршруты для статистики
app.get('/api/admin/statistics/users', checkAdmin, async (req, res) => {
    try {
        // Получаем общее количество пользователей
        const totalUsers = await User.countDocuments();

        // Получаем количество активных пользователей за последние 24 часа
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            lastLoginDate: { $gte: oneDayAgo }
        });

        res.json({
            totalUsers,
            activeUsers
        });
    } catch (error) {
        console.error('Ошибка при получении статистики пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для получения статистики тестов
app.get('/api/admin/statistics/tests', checkAdmin, async (req, res) => {
    try {
        // Получаем общее количество вопросов
        const totalQuestions = await questionsCollection.countDocuments();

        // Получаем количество завершённых тестов
        const completedTests = await db.collection('test_results').countDocuments({
            completed: true
        });

        res.json({
            totalQuestions,
            completedTests
        });
    } catch (error) {
        console.error('Ошибка при получении статистики тестов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Add new endpoint for test completion statistics
app.get('/api/admin/statistics/test-completions', checkAdmin, async (req, res) => {
    try {
        const testResults = await db.collection('test_results').find({
            completed: true
        }).toArray();

        const totalCompletions = testResults.length;
        let totalScore = 0;
        let bestScore = 0;

        if (totalCompletions > 0) {
            testResults.forEach(result => {
                if (result.correctAnswers && result.totalQuestions) {
                    const score = Math.round((result.correctAnswers / result.totalQuestions) * 100);
                    totalScore += score;
                    bestScore = Math.max(bestScore, score);
                }
            });

            const averageScore = Math.round(totalScore / totalCompletions);

            res.json({
                totalCompletions,
                averageScore,
                bestScore
            });
        } else {
            res.json({
                totalCompletions: 0,
                averageScore: 0,
                bestScore: 0
            });
        }
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Маршрут для создания резервной копии
app.post('/api/admin/backup', checkAdmin, async (req, res) => {
    try {
        // Получаем все коллекции
        const collections = {
            users: await User.find({}).lean(),
            questions: await questionsCollection.find({}).toArray(),
            test_results: await db.collection('test_results').find({}).toArray()
        };

        // Создаем дату для имени файла
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, 'backups', `backup-${date}.json`);

        // Создаем директорию для бэкапов, если её нет
        if (!fs.existsSync(path.join(__dirname, 'backups'))) {
            fs.mkdirSync(path.join(__dirname, 'backups'));
        }

        // Записываем данные в файл
        fs.writeFileSync(backupPath, JSON.stringify(collections, null, 2));

        res.json({
            success: true,
            message: 'Резервная копия успешно создана',
            filename: `backup-${date}.json`
        });
    } catch (error) {
        console.error('Ошибка при создании резервной копии:', error);
        res.status(500).json({ error: 'Ошибка при создании резервной копии' });
    }
});

// Обновляем API endpoints для материалов
app.post('/api/materials/documents', checkAdmin, upload.single('file'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
            metadata: { 
                title, 
                description, 
                type: 'document',
                mimetype: req.file.mimetype 
            }
        });

        uploadStream.end(req.file.buffer);

        const document = {
            title,
            description,
            filename: req.file.originalname,
            fileId: uploadStream.id,
            mimetype: req.file.mimetype,
            type: 'document',
            uploadDate: new Date()
        };
        
        const result = await documentsCollection.insertOne(document);
        res.json({ success: true, document: { ...document, _id: result.insertedId } });
    } catch (error) {
        console.error('Ошибка загрузки документа:', error);
        res.status(500).json({ error: 'Ошибка при загрузке файла' });
    }
});

app.post('/api/materials/videos', checkAdmin, upload.single('video'), async (req, res) => {
    try {
        const { title, description } = req.body;
        const uploadStream = gridFSBucket.openUploadStream(req.file.originalname, {
            metadata: { 
                title, 
                description, 
                type: 'video',
                mimetype: req.file.mimetype 
            }
        });

        uploadStream.end(req.file.buffer);

        const video = {
            title,
            description,
            filename: req.file.originalname,
            fileId: uploadStream.id,
            mimetype: req.file.mimetype,
            type: 'video',
            uploadDate: new Date()
        };
        
        const result = await videosCollection.insertOne(video);
        res.json({ success: true, video: { ...video, _id: result.insertedId } });
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        res.status(500).json({ error: 'Ошибка при загрузке видео' });
    }
});

// Добавляем endpoint для текстовых материалов
app.post('/api/materials/text', checkAdmin, async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const material = {
            title,
            content,
            type: 'text',
            uploadDate: new Date()
        };
        
        const result = await materialsCollection.insertOne(material);
        res.json({ success: true, material: { ...material, _id: result.insertedId } });
    } catch (error) {
        console.error('Ошибка сохранения текста:', error);
        res.status(500).json({ error: 'Ошибка при сохранении текста' });
    }
});

app.get('/api/materials', async (req, res) => {
    try {
        // Получаем материалы из всех коллекций
        const documents = await documentsCollection.find({}).toArray();
        const videos = await videosCollection.find({}).toArray();
        const texts = await materialsCollection.find({ type: 'text' }).toArray();
        
        const materials = [
            ...documents.map(doc => ({ ...doc, type: 'document' })),
            ...videos.map(video => ({ ...video, type: 'video' })),
            ...texts // Добавляем текстовые материалы
        ];
        
        res.json(materials);
    } catch (error) {
        console.error('Ошибка получения материалов:', error);
        res.status(500).json({ error: 'Ошибка при получении материалов' });
    }
});

// Добавляем endpoint для получения конкретного материала
app.get('/api/materials/:id', async (req, res) => {
    try {
        const materialId = new ObjectId(req.params.id);
        let material = await materialsCollection.findOne({ _id: materialId });

        if (!material) {
            material = await documentsCollection.findOne({ _id: materialId });
        }

        if (!material) {
            material = await videosCollection.findOne({ _id: materialId });
        }

        if (!material) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        res.json(material);
    } catch (error) {
        console.error('Ошибка при получении материала:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/materials/:id/download', async (req, res) => {
    try {
        let material = await documentsCollection.findOne({
            _id: new ObjectId(req.params.id)
        });

        if (!material) {
            material = await videosCollection.findOne({
                _id: new ObjectId(req.params.id)
            });
        }

        if (!material) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        const downloadStream = gridFSBucket.openDownloadStream(material.fileId);
        res.set('Content-Type', material.mimetype);
        res.set('Content-Disposition', `inline; filename="${material.filename}"`);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Ошибка при скачивании:', error);
        res.status(500).json({ error: 'Ошибка при скачивании файла' });
    }
});

app.delete('/api/materials/:id', checkAdmin, async (req, res) => {
    try {
        const materialId = new ObjectId(req.params.id);
        let material = null;
        let collection = null;

        // Check documents collection
        material = await documentsCollection.findOne({ _id: materialId });
        if (material) {
            collection = documentsCollection;
        }

        // If not found in documents, check videos collection
        if (!material) {
            material = await videosCollection.findOne({ _id: materialId });
            if (material) {
                collection = videosCollection;
            }
        }

        // If not found in videos, check materials collection (for text materials)
        if (!material) {
            material = await materialsCollection.findOne({ _id: materialId });
            if (material) {
                collection = materialsCollection;
            }
        }

        if (!material) {
            return res.status(404).json({ error: 'Материал не найден' });
        }

        // Delete file from GridFS if it exists
        if (material.fileId) {
            try {
                await gridFSBucket.delete(material.fileId);
            } catch (error) {
                console.error('Error deleting file from GridFS:', error);
            }
        }

        // Delete the material from its collection
        const result = await collection.deleteOne({ _id: materialId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Не удалось удалить материал' });
        }

        res.json({ 
            success: true,
            message: 'Материал успешно удален'
        });

    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ 
            error: 'Ошибка при удалении материала',
            details: error.message
        });
    }
});

const materialsRouter = require('./routes/materials');
app.use('/api/materials', materialsRouter);

// Add new endpoint for submitting test results
app.post('/api/test-results', async (req, res) => {
    try {
        const { testId, answers } = req.body;

        if (!testId || !answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Некорректные данные' });
        }

        // Get test questions
        const test = await testsCollection.findOne({
            _id: new ObjectId(testId)
        });

        if (!test) {
            return res.status(404).json({ error: 'Тест не найден' });
        }

        // Get questions and verify answers
        const questions = await questionsCollection
            .find({ _id: { $in: test.questions.map(id => new ObjectId(id)) } })
            .toArray();

        let correctAnswers = 0;
        const totalQuestions = questions.length;

        questions.forEach(question => {
            const userAnswer = answers[question._id.toString()];
            if (userAnswer === question.correctAnswer) {
                correctAnswers++;
            }
        });

        // Save test result
        const result = await db.collection('test_results').insertOne({
            testId: new ObjectId(testId),
            answers,
            correctAnswers,
            totalQuestions,
            completed: true,
            completedAt: new Date()
        });

        res.json({
            success: true,
            correctAnswers,
            totalQuestions,
            percentage: Math.round((correctAnswers / totalQuestions) * 100)
        });

    } catch (error) {
        console.error('Error submitting test results:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Обновленные маршруты в правильном порядке
// 1. Разрешаем доступ к статическим файлам для страницы логина
app.get('/styles/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'styles', 'login.css'));
});

app.get('/scripts/login.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'scripts', 'login.js'));
});

// 2. Обрабатываем корневой маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

// 3. Обрабатываем прямой запрос к login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/login.html'));
});

// 4. Переносим статический middleware после определения конкретных маршрутов
app.use(express.static(path.join(__dirname)));

// 5. Защищаем все остальные HTML файлы
app.get('*.html', (req, res, next) => {
    if (req.path === 'pages/login.html') {
        return next();
    }
    checkAdmin(req, res, () => {
        res.sendFile(path.join(__dirname, req.path));
    });
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
