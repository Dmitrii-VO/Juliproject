const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

const educationalData = require('./data/educational-standards');
const aiService = require('./services/ai-service');
const exportService = require('./services/export-service');

app.get('/api/subjects', (req, res) => {
  res.json(educationalData.subjects);
});

app.get('/api/classes', (req, res) => {
  res.json(educationalData.classes);
});

app.post('/api/generate-materials', async (req, res) => {
  try {
    const { subject, className, topic, materialTypes } = req.body;

    if (!subject || !className || !topic || !materialTypes) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    const materials = await aiService.generateMaterials({
      subject,
      className,
      topic,
      materialTypes
    });

    // Сохраняем материалы в сессии для возможного экспорта
    req.session = req.session || {};
    req.session.lastMaterials = materials;
    req.session.lastMetadata = { subject, className, topic };

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Ошибка генерации материалов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Экспорт в DOCX
app.post('/api/export/docx', async (req, res) => {
  try {
    const { materials, metadata } = req.body;

    if (!materials || !metadata) {
      return res.status(400).json({ error: 'Материалы и метаданные обязательны' });
    }

    const results = await exportService.exportToDocx(materials, metadata);
    
    // Возвращаем первый успешный файл для скачивания
    const successFile = Object.values(results).find(r => !r.error);
    if (!successFile) {
      return res.status(500).json({ error: 'Не удалось создать документ' });
    }

    res.download(successFile.filePath, successFile.fileName, (err) => {
      if (err) {
        console.error('Ошибка скачивания:', err);
        res.status(500).json({ error: 'Ошибка скачивания файла' });
      }
    });
  } catch (error) {
    console.error('Ошибка экспорта DOCX:', error);
    res.status(500).json({ error: 'Ошибка создания документа' });
  }
});

// Экспорт в PDF
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { materials, metadata } = req.body;

    if (!materials || !metadata) {
      return res.status(400).json({ error: 'Материалы и метаданные обязательны' });
    }

    const results = await exportService.exportToPdf(materials, metadata);
    
    const successFile = Object.values(results).find(r => !r.error);
    if (!successFile) {
      return res.status(500).json({ error: 'Не удалось создать документ' });
    }

    res.download(successFile.filePath, successFile.fileName, (err) => {
      if (err) {
        console.error('Ошибка скачивания:', err);
        res.status(500).json({ error: 'Ошибка скачивания файла' });
      }
    });
  } catch (error) {
    console.error('Ошибка экспорта PDF:', error);
    res.status(500).json({ error: 'Ошибка создания документа' });
  }
});

// Экспорт в ZIP (все форматы)
app.post('/api/export/zip', async (req, res) => {
  try {
    const { materials, metadata, formats = ['docx', 'pdf'] } = req.body;

    if (!materials || !metadata) {
      return res.status(400).json({ error: 'Материалы и метаданные обязательны' });
    }

    const result = await exportService.exportToZip(materials, metadata, formats);
    
    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Ошибка скачивания архива:', err);
        res.status(500).json({ error: 'Ошибка скачивания файла' });
      }
    });
  } catch (error) {
    console.error('Ошибка экспорта ZIP:', error);
    res.status(500).json({ error: 'Ошибка создания архива' });
  }
});

// Очистка временных файлов (можно вызывать периодически)
app.post('/api/cleanup', async (req, res) => {
  try {
    await exportService.cleanupTempFiles();
    res.json({ success: true, message: 'Временные файлы очищены' });
  } catch (error) {
    console.error('Ошибка очистки:', error);
    res.status(500).json({ error: 'Ошибка очистки файлов' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});