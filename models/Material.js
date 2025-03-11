const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: String,
    description: String,
    type: {
        type: String,
        required: true,
        enum: ['text', 'document', 'video']
    },
    fileUrl: String,
    mimeType: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Material', materialSchema);
