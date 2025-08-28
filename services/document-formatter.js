const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Tab, TabStopPosition, TabStopType, PageMargins } = require('docx');

class DocumentFormatter {
  constructor() {
    // Стандартные настройки ГОСТ для учебных документов
    this.gostSettings = {
      font: {
        name: 'Times New Roman',
        size: 28 // 14pt в half-points
      },
      headingFont: {
        name: 'Times New Roman',
        size: 32 // 16pt
      },
      margins: {
        top: 1134, // 2см в twips
        bottom: 1134, // 2см
        left: 1701, // 3см
        right: 850 // 1.5см
      },
      lineSpacing: 360, // 1.5 интервала
      indent: 708 // 1.25см красная строка
    };
  }

  formatEducationalDocument(content, metadata) {
    const { subject, className, topic, materialType } = metadata;
    
    const sections = [{
      properties: {
        page: {
          margin: {
            top: this.gostSettings.margins.top,
            bottom: this.gostSettings.margins.bottom,
            left: this.gostSettings.margins.left,
            right: this.gostSettings.margins.right
          }
        }
      },
      children: [
        ...this.createHeader(subject, className, topic, materialType),
        ...this.formatContent(content, materialType),
        ...this.createFooter()
      ]
    }];

    return new Document({
      sections
    });
  }

  createHeader(subject, className, topic, materialType) {
    const materialTypeNames = {
      'lesson-plan': 'ПЛАН УРОКА',
      'presentation': 'СТРУКТУРА ПРЕЗЕНТАЦИИ',
      'worksheet': 'РАБОЧИЙ ЛИСТ',
      'test': 'КОНТРОЛЬНАЯ РАБОТА',
      'homework': 'ДОМАШНЕЕ ЗАДАНИЕ',
      'summary': 'КОНСПЕКТ УРОКА'
    };

    return [
      new Paragraph({
        children: [
          new TextRun({
            text: materialTypeNames[materialType] || 'УЧЕБНЫЙ МАТЕРИАЛ',
            font: this.gostSettings.headingFont.name,
            size: this.gostSettings.headingFont.size,
            bold: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Предмет: ${this.getSubjectName(subject)}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Класс: ${className}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Тема: ${topic}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            bold: true
          })
        ],
        spacing: { after: 360 }
      })
    ];
  }

  formatContent(content, materialType) {
    const paragraphs = content.split('\\n\\n');
    const formattedParagraphs = [];

    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') return;

      // Определяем тип параграфа
      if (this.isHeading(paragraph)) {
        formattedParagraphs.push(this.createHeading(paragraph));
      } else if (this.isList(paragraph)) {
        formattedParagraphs.push(...this.createList(paragraph));
      } else if (this.isTable(paragraph)) {
        formattedParagraphs.push(this.createTable(paragraph));
      } else {
        formattedParagraphs.push(this.createBodyParagraph(paragraph));
      }
    });

    return formattedParagraphs;
  }

  isHeading(text) {
    return /^[А-Я][А-Я\\s]{2,}:?$/.test(text.trim()) || 
           text.includes('###') || 
           text.includes('**') && text.length < 100;
  }

  isList(text) {
    return text.includes('- ') || text.includes('1. ') || text.includes('•');
  }

  isTable(text) {
    return text.includes('|') && text.includes('---');
  }

  createHeading(text) {
    const cleanText = text.replace(/[#*]/g, '').trim();
    return new Paragraph({
      children: [
        new TextRun({
          text: cleanText,
          font: this.gostSettings.headingFont.name,
          size: this.gostSettings.headingFont.size,
          bold: true
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 }
    });
  }

  createBodyParagraph(text) {
    const cleanText = text.replace(/[`]/g, '').trim();
    return new Paragraph({
      children: [
        new TextRun({
          text: cleanText,
          font: this.gostSettings.font.name,
          size: this.gostSettings.font.size
        })
      ],
      indent: { firstLine: this.gostSettings.indent },
      spacing: { 
        line: this.gostSettings.lineSpacing,
        after: 120 
      }
    });
  }

  createList(text) {
    const items = text.split('\\n').filter(item => item.trim());
    return items.map(item => {
      const cleanItem = item.replace(/^[-•]\\s*\\d*\\.?\\s*/, '').trim();
      return new Paragraph({
        children: [
          new TextRun({
            text: `• ${cleanItem}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        indent: { left: 708 },
        spacing: { after: 120 }
      });
    });
  }

  createTable(text) {
    // Упрощенная обработка таблиц - преобразуем в список
    const rows = text.split('\\n').filter(row => row.includes('|'));
    const formattedRows = rows.map(row => {
      const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
      return cells.join(' | ');
    });

    return new Paragraph({
      children: [
        new TextRun({
          text: formattedRows.join('\\n'),
          font: 'Courier New',
          size: this.gostSettings.font.size - 4
        })
      ],
      spacing: { before: 120, after: 120 }
    });
  }

  createFooter() {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: `\\n\\nДата создания: ${currentDate}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size - 4,
            italics: true
          })
        ],
        spacing: { before: 480 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Создано с помощью образовательной платформы ИИ',
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size - 4,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 }
      })
    ];
  }

  getSubjectName(subjectId) {
    const subjects = {
      'mathematics': 'Математика',
      'russian': 'Русский язык',
      'literature': 'Литература',
      'physics': 'Физика',
      'chemistry': 'Химия',
      'biology': 'Биология',
      'geography': 'География',
      'history': 'История России',
      'social-studies': 'Обществознание',
      'english': 'Английский язык',
      'art': 'Изобразительное искусство',
      'music': 'Музыка',
      'pe': 'Физическая культура',
      'technology': 'Технология',
      'informatics': 'Информатика'
    };
    return subjects[subjectId] || subjectId;
  }

  // Метод для создания PDF (упрощенная версия)
  createPDFContent(content, metadata) {
    const { subject, className, topic, materialType } = metadata;
    
    const materialTypeNames = {
      'lesson-plan': 'ПЛАН УРОКА',
      'presentation': 'СТРУКТУРА ПРЕЗЕНТАЦИИ',
      'worksheet': 'РАБОЧИЙ ЛИСТ',
      'test': 'КОНТРОЛЬНАЯ РАБОТА',
      'homework': 'ДОМАШНЕЕ ЗАДАНИЕ',
      'summary': 'КОНСПЕКТ УРОКА'
    };

    const header = `${materialTypeNames[materialType] || 'УЧЕБНЫЙ МАТЕРИАЛ'}

Предмет: ${this.getSubjectName(subject)}
Класс: ${className}
Тема: ${topic}

────────────────────────────────────────

`;

    const footer = `

────────────────────────────────────────
Дата создания: ${new Date().toLocaleDateString('ru-RU')}
Создано с помощью образовательной платформы ИИ`;

    return header + content.replace(/\\n/g, '\\n') + footer;
  }
}

module.exports = new DocumentFormatter();