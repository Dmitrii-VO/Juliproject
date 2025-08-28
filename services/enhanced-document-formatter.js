const { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  LevelFormat,
  convertInchesToTwip
} = require('docx');

class EnhancedDocumentFormatter {
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
      subheadingFont: {
        name: 'Times New Roman',
        size: 30 // 15pt
      },
      margins: {
        top: convertInchesToTwip(0.79), // 2см
        bottom: convertInchesToTwip(0.79), // 2см
        left: convertInchesToTwip(1.18), // 3см
        right: convertInchesToTwip(0.59) // 1.5см
      },
      lineSpacing: 360, // 1.5 интервала
      indent: convertInchesToTwip(0.49) // 1.25см красная строка
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
        ...this.parseAndFormatContent(content, materialType),
        ...this.createFooter()
      ]
    }];

    return new Document({
      sections,
      numbering: {
        config: [{
          reference: "numbering",
          levels: [{
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5) }
              }
            }
          }]
        }]
      }
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
        spacing: { after: 360 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `Предмет: `,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            bold: true
          }),
          new TextRun({
            text: this.getSubjectName(subject),
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `Класс: `,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            bold: true
          }),
          new TextRun({
            text: `${className}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        spacing: { after: 120 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `Тема: `,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            bold: true
          }),
          new TextRun({
            text: topic,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            bold: true
          })
        ],
        spacing: { after: 480 }
      })
    ];
  }

  parseAndFormatContent(content, materialType) {
    // Разбиваем контент на логические блоки
    const lines = content.split('\n').filter(line => line.trim());
    const paragraphs = [];
    let currentSection = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Определяем тип строки
      if (this.isMainHeading(line)) {
        if (currentSection.length > 0) {
          paragraphs.push(...this.formatSection(currentSection));
          currentSection = [];
        }
        paragraphs.push(this.createMainHeading(line));
      } else if (this.isSubHeading(line)) {
        if (currentSection.length > 0) {
          paragraphs.push(...this.formatSection(currentSection));
          currentSection = [];
        }
        paragraphs.push(this.createSubHeading(line));
      } else if (this.isListItem(line)) {
        currentSection.push({ type: 'list', content: line });
      } else if (this.isTable(line, lines, i)) {
        if (currentSection.length > 0) {
          paragraphs.push(...this.formatSection(currentSection));
          currentSection = [];
        }
        const tableData = this.extractTable(lines, i);
        paragraphs.push(this.createTable(tableData.rows));
        i += tableData.consumed - 1;
      } else {
        currentSection.push({ type: 'paragraph', content: line });
      }
    }
    
    // Добавляем последнюю секцию
    if (currentSection.length > 0) {
      paragraphs.push(...this.formatSection(currentSection));
    }
    
    return paragraphs;
  }

  isMainHeading(line) {
    // Основные заголовки (большими буквами или с римскими цифрами)
    return /^[А-Я]{3,}/.test(line) || 
           /^I{1,3}\./.test(line) || 
           /^[А-Я][а-я]+:?\s*$/.test(line) ||
           /^ПЛАН УРОКА|^ХОД УРОКА|^ЦЕЛИ|^ЗАДАЧИ|^ОБОРУДОВАНИЕ|^ОБЩИЕ СВЕДЕНИЯ|^ПЛАНИРУЕМЫЕ РЕЗУЛЬТАТЫ|^СТРУКТУРА УРОКА|^ДОМАШНЕЕ ЗАДАНИЕ|^ДОПОЛНИТЕЛЬНО/.test(line);
  }

  isSubHeading(line) {
    // Подзаголовки (цифры с точкой, буквы)
    return /^\d+\./.test(line) || 
           /^[а-я]\)/.test(line) ||
           /^[А-Я][а-я]+\s+\([0-9]+\s+мин\)/.test(line) ||
           /^Этап \d+/.test(line) ||
           /^(Образовательные|Развивающие|Воспитательные|Предметные|Метапредметные|Личностные|Деятельность учителя|Деятельность учащихся|Методы):/.test(line);
  }

  isListItem(line) {
    return /^[-•*]\s/.test(line) || /^\d+\)\s/.test(line) || /^[а-я]\)\s/.test(line);
  }

  isTable(line, lines, index) {
    // Улучшенная проверка на таблицу
    return (line.includes('|') && lines[index + 1] && lines[index + 1].includes('|')) ||
           (line.includes('Вид деят.') && line.includes('Деятельность')) ||
           (line.match(/\|\s*[А-Я][а-я\s]+\s*\|.*\|\s*[А-Я][а-я\s]+\s*\|/));
  }

  createMainHeading(text) {
    const cleanText = text.replace(/[:]+$/, '').trim();
    return new Paragraph({
      children: [
        new TextRun({
          text: cleanText,
          font: this.gostSettings.subheadingFont.name,
          size: this.gostSettings.subheadingFont.size,
          bold: true
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 240 },
      alignment: AlignmentType.LEFT
    });
  }

  createSubHeading(text) {
    return new Paragraph({
      children: [
        new TextRun({
          text: text,
          font: this.gostSettings.font.name,
          size: this.gostSettings.font.size,
          bold: true
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      indent: { left: this.gostSettings.indent }
    });
  }

  formatSection(section) {
    const paragraphs = [];
    let listItems = [];
    
    for (const item of section) {
      if (item.type === 'list') {
        listItems.push(item.content);
      } else {
        // Сначала обрабатываем накопленные списки
        if (listItems.length > 0) {
          paragraphs.push(...this.createList(listItems));
          listItems = [];
        }
        
        // Затем добавляем обычный параграф
        paragraphs.push(this.createBodyParagraph(item.content));
      }
    }
    
    // Добавляем оставшиеся элементы списка
    if (listItems.length > 0) {
      paragraphs.push(...this.createList(listItems));
    }
    
    return paragraphs;
  }

  createBodyParagraph(text) {
    const cleanText = text.replace(/```/g, '').trim();
    
    // Проверяем на специальные форматы
    if (cleanText.includes('\"') && cleanText.length < 100) {
      // Короткая цитата или определение
      return new Paragraph({
        children: [
          new TextRun({
            text: cleanText,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size,
            italics: true
          })
        ],
        indent: { left: this.gostSettings.indent * 2 },
        spacing: { line: this.gostSettings.lineSpacing, after: 120 }
      });
    }
    
    return new Paragraph({
      children: [
        new TextRun({
          text: cleanText,
          font: this.gostSettings.font.name,
          size: this.gostSettings.font.size
        })
      ],
      indent: { firstLine: this.gostSettings.indent },
      spacing: { line: this.gostSettings.lineSpacing, after: 120 }
    });
  }

  createList(items) {
    return items.map(item => {
      const cleanItem = item.replace(/^[-•*]\s*\d*\.?\s*/, '').replace(/^\d+\)\s*/, '').trim();
      return new Paragraph({
        children: [
          new TextRun({
            text: `• ${cleanItem}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        indent: { left: this.gostSettings.indent },
        spacing: { line: this.gostSettings.lineSpacing, after: 60 }
      });
    });
  }

  extractTable(lines, startIndex) {
    const rows = [];
    let i = startIndex;
    
    while (i < lines.length && lines[i].includes('|')) {
      const line = lines[i].trim();
      if (line && !line.match(/^[\-|:\s]+$/)) { // Пропускаем разделительные строки
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          rows.push(cells);
        }
      }
      i++;
    }
    
    return { rows, consumed: i - startIndex };
  }

  createTable(rows) {
    if (!rows.length) return new Paragraph({});
    
    const tableRows = rows.map((row, rowIndex) => {
      const cells = row.map((cellText, cellIndex) => {
        // Определяем ширину колонок для таблицы урока
        let width = WidthType.AUTO;
        let widthSize = 2000;
        
        if (rows[0] && rows[0].length === 6) { // Таблица структуры урока
          const widths = [1500, 3000, 3000, 1200, 800, 1500]; // Настраиваем ширину колонок
          widthSize = widths[cellIndex] || 2000;
          width = WidthType.DXA;
        }
        
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cellText.trim(),
                  font: this.gostSettings.font.name,
                  size: this.gostSettings.font.size - 4, // Уменьшаем шрифт для таблицы
                  bold: rowIndex === 0 // Первая строка жирная (заголовок)
                })
              ],
              alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.JUSTIFIED
            })
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
          },
          width: { size: widthSize, type: width },
          margins: {
            top: 60,
            bottom: 60,
            left: 100,
            right: 100
          }
        });
      });
      
      return new TableRow({ children: cells });
    });

    return new Table({
      rows: tableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      margins: {
        top: 240,
        bottom: 240,
        left: 0,
        right: 0
      }
    });
  }

  createFooter() {
    const currentDate = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: '',
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size
          })
        ],
        spacing: { before: 600 }
      }),
      
      new Paragraph({
        children: [
          new TextRun({
            text: `Дата создания: ${currentDate}`,
            font: this.gostSettings.font.name,
            size: this.gostSettings.font.size - 4,
            italics: true
          })
        ],
        spacing: { before: 240 }
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

  // Метод для создания PDF контента (упрощенная версия)
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

    // Улучшенное форматирование для PDF
    const formattedContent = content
      .replace(/\n\n+/g, '\n\n') // Убираем лишние переносы
      .replace(/^([А-Я][А-Я\s]{2,}):?\s*$/gm, '\n$1\n') // Заголовки
      .replace(/^(\d+\..+)$/gm, '\n$1') // Нумерованные списки
      .replace(/^([-•].+)$/gm, '  $1') // Маркированные списки
      .replace(/```/g, '') // Убираем код-блоки
      .trim();

    return header + formattedContent + footer;
  }
}

module.exports = new EnhancedDocumentFormatter();