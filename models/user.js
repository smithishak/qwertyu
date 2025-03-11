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
    middleName: {
        type: String
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    lastLoginDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Экспорт модели
module.exports = mongoose.model('User', userSchema);
