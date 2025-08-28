const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    this.baseURL = process.env.AI_BASE_URL || 'https://hubai.loe.gg/v1';
  }

  async generateMaterials({ subject, className, topic, materialTypes }) {
    const results = {};

    for (const materialType of materialTypes) {
      try {
        const material = await this.generateSingleMaterial({
          subject,
          className,
          topic,
          materialType
        });
        results[materialType] = material;
      } catch (error) {
        console.error(`Ошибка генерации ${materialType}:`, error.message);
        results[materialType] = { error: 'Не удалось сгенерировать материал' };
      }
    }

    return results;
  }

  async generateSingleMaterial({ subject, className, topic, materialType }) {
    const prompt = this.buildPrompt({ subject, className, topic, materialType });

    if (!this.apiKey) {
      return this.generateMockMaterial({ subject, className, topic, materialType });
    }

    try {
      const response = await axios.post(`${this.baseURL}/messages`, {
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Ты - опытный российский педагог, создающий качественные учебные материалы в соответствии с ФГОС.\n\n${prompt}`
          }
        ],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        content: response.data.content[0].text,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Недействительный API ключ');
      }
      if (error.response?.status === 400) {
        throw new Error('Некорректный запрос к API');
      }
      throw new Error(`Ошибка при обращении к AI API: ${error.message}`);
    }
  }

  buildPrompt({ subject, className, topic, materialType }) {
    const basePrompt = `Создай ${this.getMaterialTypeDescription(materialType)} по предмету "${subject}" для ${className} класса на тему "${topic}".`;
    
    const requirements = [
      'Материал должен соответствовать ФГОС России',
      'Используй современные педагогические подходы',
      'Учитывай возрастные особенности учащихся',
      'Включи практические задания и примеры',
      'ВАЖНО: Структурируй текст с четкими заголовками и разделами',
      'Используй нумерацию для основных пунктов (1., 2., 3.)',
      'Выделяй подпункты буквами (а), б), в))',
      'Создавай списки с маркерами (-) для перечислений',
      'Помещай таблицы в формат |заголовок|заголовок| для правильного отображения'
    ];

    const specificRequirements = this.getSpecificRequirements(materialType);
    const structureGuidelines = this.getStructureGuidelines(materialType);

    return `${basePrompt}\n\nТребования к содержанию:\n${requirements.map(r => `- ${r}`).join('\n')}\n\nТребования к структуре:\n${specificRequirements.concat(structureGuidelines).map(r => `- ${r}`).join('\n')}`;
  }

  getMaterialTypeDescription(materialType) {
    const descriptions = {
      'lesson-plan': 'подробный план урока',
      'presentation': 'структуру презентации с описанием слайдов',
      'worksheet': 'рабочий лист с заданиями',
      'test': 'контрольную работу с вопросами и заданиями',
      'homework': 'домашнее задание',
      'summary': 'подробный конспект урока с полным планом проведения учебного занятия'
    };
    return descriptions[materialType] || 'учебный материал';
  }

  getSpecificRequirements(materialType) {
    const requirements = {
      'lesson-plan': [
        'Укажи цели и задачи урока',
        'Опиши этапы урока с временными рамками',
        'Включи методы и приемы работы'
      ],
      'presentation': [
        'Структурируй материал по слайдам',
        'Укажи ключевые понятия для каждого слайда',
        'Добавь рекомендации по визуализации'
      ],
      'worksheet': [
        'Создай разноуровневые задания',
        'Включи инструкции для выполнения',
        'Добавь критерии оценивания'
      ],
      'test': [
        'Создай вопросы разных типов и уровней сложности',
        'Включи правильные ответы',
        'Укажи критерии оценивания'
      ],
      'homework': [
        'Дай четкие инструкции по выполнению',
        'Укажи примерное время выполнения',
        'Добавь дополнительные ресурсы для изучения'
      ],
      'summary': [
        'Создай полный конспект урока в формате как в образце - с шапкой, целями, планируемыми результатами',
        'Начни с информации об уроке: предмет, класс, тема, дата',
        'Четко сформулируй цель урока (одну основную)',
        'Укажи 3 задачи: формировать/познакомить, развивать, воспитывать',
        'Детализируй планируемые результаты: предметные, метапредметные (регулятивные, познавательные, коммуникативные), личностные',
        'Укажи оборудование, тип урока, методы, формы',
        'Создай подробную таблицу "Структура урока" с колонками: Вид деят. | Деятельность учителя | Деятельность учеников | Формы обучения | УУД | Примечание',
        'Включи все этапы: I. Организационный момент, II. Актуализация знаний, III. Самоопределение к деятельности, IV. Сообщение темы и целей, V. Изучение нового материала, VI. Закрепление, VII. Подведение итогов. Рефлексия, VIII. Домашнее задание',
        'Для каждого этапа детально опиши диалоги, вопросы учителя, ответы учеников',
        'В конце добавь строки для подписей: Учитель:, Методист:, Оценка:, Методист:'
      ]
    };
    return requirements[materialType] || [];
  }

  getStructureGuidelines(materialType) {
    const guidelines = {
      'lesson-plan': [
        'Начни с заголовка "ПЛАН УРОКА"',
        'Раздел "Цели урока:" с подпунктами',
        'Раздел "Ход урока:" с нумерацией этапов',
        'Каждый этап: название, время в скобках, содержание'
      ],
      'presentation': [
        'Заголовок "СТРУКТУРА ПРЕЗЕНТАЦИИ"',
        'Нумеруй слайды: "Слайд 1:", "Слайд 2:", и т.д.',
        'Для каждого слайда: заголовок и краткое содержание'
      ],
      'worksheet': [
        'Заголовок "РАБОЧИЙ ЛИСТ"',
        'Раздел "Задания:" с нумерацией',
        'Раздел "Инструкции:" с четкими указаниями'
      ],
      'test': [
        'Заголовок "КОНТРОЛЬНАЯ РАБОТА"',
        'Нумеруй вопросы: "Вопрос 1:", "Вопрос 2:"',
        'В конце раздел "ОТВЕТЫ:" с правильными ответами'
      ],
      'homework': [
        'Заголовок "ДОМАШНЕЕ ЗАДАНИЕ"',
        'Раздел "Задания:" с нумерацией',
        'Раздел "Критерии выполнения:"'
      ],
      'summary': [
        'Начни с шапки: "Пробный урок по [предмет] в [класс], проведённый [дата]"',
        'Строка "Тема: [тема урока]"',
        'Строка "Цель: [одна главная цель]"',
        'Раздел "Задачи:" с тремя подпунктами (формировать, развивать, воспитывать)',
        'Раздел "Планируемые результаты:" с детальными подразделами "Предметные:", "Метапредметные:" (регулятивные, познавательные, коммуникативные), "Личностные:"',
        'Строки: "Оборудование:", "Тип урока:", "Методы:", "Формы:"',
        'Заголовок "Структура урока"',
        'Создай таблицу с колонками: | Вид деят. | Деятельность учителя | Деятельность учеников | Формы обучения | УУД | Примечание |',
        'В таблице детально опиши 8 этапов урока с диалогами и конкретными действиями',
        'В конце добавь подписи: "Учитель:", "Методист:", "Оценка:", "Методист:"'
      ]
    };
    return guidelines[materialType] || [];
  }

  generateMockMaterial({ subject, className, topic, materialType }) {
    return {
      content: `Пример ${this.getMaterialTypeDescription(materialType)} по ${subject} для ${className} класса на тему "${topic}".\n\n⚠️ Это демонстрационный материал. Для полной функциональности необходимо настроить AI API ключ.`,
      generated_at: new Date().toISOString(),
      mock: true
    };
  }
}

module.exports = new AIService();