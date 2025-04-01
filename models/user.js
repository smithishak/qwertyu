const mongoose = require('mongoose');

// Схема пользователя
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true,  // Обязательное поле
        unique: true     // Должно быть уникальным
    },
    password: { 
        type: String, 
        required: true   // Обязательное поле
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    middleName: String,
    email: String,
    phoneNumber: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginDate: Date
});

// Экспорт модели
module.exports = mongoose.model('User', userSchema);
