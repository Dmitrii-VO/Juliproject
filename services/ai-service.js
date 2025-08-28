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
      'Включи практические задания и примеры'
    ];

    const specificRequirements = this.getSpecificRequirements(materialType);

    return `${basePrompt}\n\nТребования:\n${requirements.concat(specificRequirements).map(r => `- ${r}`).join('\n')}`;
  }

  getMaterialTypeDescription(materialType) {
    const descriptions = {
      'lesson-plan': 'подробный план урока',
      'presentation': 'структуру презентации с описанием слайдов',
      'worksheet': 'рабочий лист с заданиями',
      'test': 'контрольную работу с вопросами и заданиями',
      'homework': 'домашнее задание',
      'summary': 'конспект урока'
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
        'Выдели основные понятия и определения',
        'Структурируй материал логически',
        'Включи схемы и таблицы где это уместно'
      ]
    };
    return requirements[materialType] || [];
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