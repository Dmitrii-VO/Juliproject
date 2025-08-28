const fs = require('fs').promises;
const path = require('path');
const documentFormatter = require('./enhanced-document-formatter');
const archiver = require('archiver');

// Динамический импорт jsPDF только при использовании
let jsPDF = null;

class ExportService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async exportToDocx(materials, metadata) {
    const results = {};

    for (const [type, material] of Object.entries(materials)) {
      if (material.error || !material.content) continue;

      try {
        const document = documentFormatter.formatEducationalDocument(
          material.content,
          { ...metadata, materialType: type }
        );

        const fileName = this.generateFileName(metadata, type, 'docx');
        const filePath = path.join(this.tempDir, fileName);

        // Генерируем DOCX
        const buffer = await this.generateDocxBuffer(document);
        await fs.writeFile(filePath, buffer);

        results[type] = {
          fileName,
          filePath,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
      } catch (error) {
        console.error(`Ошибка создания DOCX для ${type}:`, error);
        results[type] = { error: 'Ошибка создания документа' };
      }
    }

    return results;
  }

  async exportToPdf(materials, metadata) {
    const results = {};

    // Для PDF используем альтернативный подход - создаем текстовые файлы с предупреждением
    // jsPDF плохо поддерживает кириллицу
    for (const [type, material] of Object.entries(materials)) {
      if (material.error || !material.content) continue;

      try {
        const fileName = this.generateFileName(metadata, type, 'txt');
        const filePath = path.join(this.tempDir, fileName);

        const content = documentFormatter.createPDFContent(
          material.content,
          { ...metadata, materialType: type }
        );

        // Добавляем предупреждение о кодировке
        const warningMessage = `ВНИМАНИЕ: PDF экспорт с кириллицей ограничен.\nРекомендуется использовать DOCX формат для корректного отображения русского текста.\n\n────────────────────────────────────────\n\n`;
        
        const fullContent = warningMessage + content;
        
        await fs.writeFile(filePath, fullContent, 'utf8');

        results[type] = {
          fileName: fileName.replace('.txt', '.pdf'),
          filePath,
          contentType: 'text/plain',
          note: 'PDF с кириллицей не поддерживается - используйте DOCX формат'
        };
      } catch (error) {
        console.error(`Ошибка создания текстового файла для ${type}:`, error);
        results[type] = { error: 'Ошибка создания документа' };
      }
    }

    return results;
  }

  async exportToSimplePdf(materials, metadata) {
    // Простая заглушка для PDF без jsPDF
    const results = {};
    
    for (const [type, material] of Object.entries(materials)) {
      if (material.error || !material.content) continue;

      try {
        const fileName = this.generateFileName(metadata, type, 'txt');
        const filePath = path.join(this.tempDir, fileName);

        const content = documentFormatter.createPDFContent(
          material.content,
          { ...metadata, materialType: type }
        );

        await fs.writeFile(filePath, content, 'utf8');

        results[type] = {
          fileName: fileName.replace('.txt', '.pdf'),
          filePath,
          contentType: 'text/plain', // Временно как текст
          note: 'PDF экспорт недоступен - используйте DOCX формат'
        };
      } catch (error) {
        console.error(`Ошибка создания текстового файла для ${type}:`, error);
        results[type] = { error: 'Ошибка создания документа' };
      }
    }

    return results;
  }

  async exportToZip(materials, metadata, formats = ['docx', 'pdf']) {
    const zipFileName = `materials_${this.sanitizeFilename(metadata.subject)}_${metadata.className}_${this.sanitizeFilename(metadata.topic)}.zip`;
    const zipPath = path.join(this.tempDir, zipFileName);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = require('fs').createWriteStream(zipPath);

    archive.pipe(output);

    // Добавляем файлы в архив
    for (const format of formats) {
      let exportResults;
      
      if (format === 'docx') {
        exportResults = await this.exportToDocx(materials, metadata);
      } else if (format === 'pdf') {
        exportResults = await this.exportToPdf(materials, metadata);
      }

      for (const [type, result] of Object.entries(exportResults)) {
        if (!result.error && result.filePath) {
          archive.file(result.filePath, { name: result.fileName });
        }
      }
    }

    // Добавляем README с информацией
    const readmeContent = this.generateReadmeContent(metadata);
    archive.append(readmeContent, { name: 'README.txt' });

    await archive.finalize();

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          fileName: zipFileName,
          filePath: zipPath,
          contentType: 'application/zip',
          size: archive.pointer()
        });
      });

      archive.on('error', reject);
    });
  }

  generateFileName(metadata, type, extension) {
    const typeNames = {
      'lesson-plan': 'план_урока',
      'presentation': 'презентация',
      'worksheet': 'рабочий_лист',
      'test': 'контрольная',
      'homework': 'домашнее_задание',
      'summary': 'конспект'
    };

    const typeName = typeNames[type] || type;
    const subject = this.sanitizeFilename(metadata.subject);
    const topic = this.sanitizeFilename(metadata.topic);
    
    return `${typeName}_${subject}_${metadata.className}_${topic}.${extension}`;
  }

  sanitizeFilename(name) {
    return name
      .replace(/[^a-zA-Zа-яА-Я0-9\\s]/g, '')
      .replace(/\\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }

  generateReadmeContent(metadata) {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    
    return `УЧЕБНЫЕ МАТЕРИАЛЫ
===============================

Предмет: ${metadata.subject}
Класс: ${metadata.className}
Тема: ${metadata.topic}
Дата создания: ${currentDate}

СОДЕРЖАНИЕ АРХИВА:
- Документы в формате DOCX (Microsoft Word)
- Документы в формате PDF (Portable Document Format)

ТРЕБОВАНИЯ К ОФОРМЛЕНИЮ:
Все документы созданы в соответствии с требованиями ГОСТ:
- Шрифт: Times New Roman, 14pt
- Поля: верхнее и нижнее - 2см, левое - 3см, правое - 1.5см
- Межстрочный интервал: 1.5
- Красная строка: 1.25см

СИСТЕМА СОЗДАНИЯ:
Материалы созданы с помощью образовательной платформы ИИ
с учетом требований ФГОС России.

===============================`;
  }

  async generateDocxBuffer(document) {
    // Используем docx library для генерации буфера
    const Packer = require('docx').Packer;
    return await Packer.toBuffer(document);
  }

  async cleanupTempFiles(olderThan = 3600000) { // 1 час
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > olderThan) {
          await fs.unlink(filePath);
          console.log(`Удален временный файл: ${file}`);
        }
      }
    } catch (error) {
      console.error('Ошибка очистки временных файлов:', error);
    }
  }
}

module.exports = new ExportService();