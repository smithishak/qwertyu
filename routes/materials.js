const express = require('express');
const router = express.Router();
const Material = require('../models/Material');

// Получение всех материалов
router.get('/', async (req, res) => {
    try {
        const materials = await Material.find();
        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Получение конкретного материала
router.get('/:id', async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Создание текстового материала
router.post('/text', async (req, res) => {
    try {
        const material = new Material({
            title: req.body.title,
            content: req.body.content,
            type: 'text'
        });
        const newMaterial = await material.save();
        res.status(201).json(newMaterial);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Удаление материала
router.delete('/:id', async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        await material.remove();
        res.json({ message: 'Материал успешно удален' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
