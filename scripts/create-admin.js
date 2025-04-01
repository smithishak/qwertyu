const mongoose = require('mongoose');
const User = require('../models/user');

mongoose.connect('mongodb://localhost:27017/web-app-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createAdmin() {
    try {
        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // В реальном приложении используйте хеширование
            firstName: 'Admin',
            lastName: 'User',
            isAdmin: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

createAdmin();
