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
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: '' // Change to optional with empty default
    },
    email: {
        type: String,
        default: ''
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
