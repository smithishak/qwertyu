const mongoose = require('mongoose');

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
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Добавляем метод для подсчета вопросов
testSchema.virtual('questionCount').get(function() {
    return this.questions.length;
});

module.exports = mongoose.model('Test', testSchema);
