import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const materialTypeNames = {
  'lesson-plan': 'План урока',
  'presentation': 'Презентация',
  'worksheet': 'Рабочие листы',
  'test': 'Контрольная работа',
  'homework': 'Домашнее задание',
  'summary': 'Конспект'
};

function App() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    className: '',
    topic: '',
    materialTypes: []
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        axios.get('/api/subjects'),
        axios.get('/api/classes')
      ]);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      setError('Ошибка загрузки данных');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialTypeChange = (materialType, checked) => {
    setFormData(prev => ({
      ...prev,
      materialTypes: checked 
        ? [...prev.materialTypes, materialType]
        : prev.materialTypes.filter(type => type !== materialType)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.className || !formData.topic || formData.materialTypes.length === 0) {
      setError('Пожалуйста, заполните все поля и выберите хотя бы один тип материала');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post('/api/generate-materials', formData);
      setResults(response.data.materials);
    } catch (error) {
      setError(error.response?.data?.error || 'Произошла ошибка при генерации материалов');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!results || !formData.subject) {
      setError('Сначала сгенерируйте материалы');
      return;
    }

    setExportLoading(true);
    setError('');

    try {
      const exportData = {
        materials: results,
        metadata: {
          subject: formData.subject,
          className: formData.className,
          topic: formData.topic
        }
      };

      let endpoint;
      switch (format) {
        case 'docx':
          endpoint = '/api/export/docx';
          break;
        case 'pdf':
          endpoint = '/api/export/pdf';
          break;
        case 'zip':
          endpoint = '/api/export/zip';
          exportData.formats = ['docx', 'pdf'];
          break;
        default:
          throw new Error('Неподдерживаемый формат');
      }

      const response = await axios.post(endpoint, exportData, {
        responseType: 'blob'
      });

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `materials.${format}`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).+\2|[^;\n]*)/);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Ошибка экспорта:', error);
      setError(error.response?.data?.error || `Ошибка экспорта в формат ${format.toUpperCase()}`);
    } finally {
      setExportLoading(false);
    }
  };

  const materialTypes = [
    { id: 'lesson-plan', name: 'План урока', description: 'Подробный план проведения урока' },
    { id: 'presentation', name: 'Презентация', description: 'Слайды для демонстрации материала' },
    { id: 'worksheet', name: 'Рабочие листы', description: 'Упражнения и задания для учеников' },
    { id: 'test', name: 'Контрольная работа', description: 'Тестовые задания для проверки знаний' },
    { id: 'homework', name: 'Домашнее задание', description: 'Задания для самостоятельной работы' },
    { id: 'summary', name: 'Конспект', description: 'Краткое изложение основных понятий' }
  ];

  return (
    <div className="container">
      <div className="header">
        <h1>Образовательная платформа</h1>
        <p>Генерация учебных материалов с использованием ИИ</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject">Предмет:</label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="form-control"
            required
          >
            <option value="">Выберите предмет</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="className">Класс:</label>
          <select
            id="className"
            name="className"
            value={formData.className}
            onChange={handleInputChange}
            className="form-control"
            required
          >
            <option value="">Выберите класс</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="topic">Тема урока:</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            className="form-control"
            placeholder="Введите тему урока"
            required
          />
        </div>

        <div className="form-group">
          <label>Выберите типы материалов для генерации:</label>
          <div className="material-types">
            {materialTypes.map(type => (
              <div key={type.id} className="material-type">
                <input
                  type="checkbox"
                  id={type.id}
                  checked={formData.materialTypes.includes(type.id)}
                  onChange={(e) => handleMaterialTypeChange(type.id, e.target.checked)}
                />
                <div className="material-info">
                  <h4>{type.name}</h4>
                  <p>{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Генерация...' : 'Сгенерировать материалы'}
        </button>
      </form>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Идет генерация учебных материалов...</p>
        </div>
      )}

      {results && (
        <div className="results">
          <div className="results-header">
            <h2>Сгенерированные материалы</h2>
            <div className="export-buttons">
              <h3>Скачать материалы:</h3>
              <div className="export-options">
                <button 
                  className="btn export-btn" 
                  onClick={() => handleExport('docx')}
                  disabled={exportLoading}
                  title="Скачать в формате Microsoft Word (с форматированием по ГОСТ)"
                >
                  📄 DOCX
                </button>
                <button 
                  className="btn export-btn pdf-warning" 
                  onClick={() => handleExport('pdf')}
                  disabled={exportLoading}
                  title="⚠️ PDF экспорт с кириллицей ограничен. Рекомендуется использовать DOCX формат"
                >
                  📑 PDF ⚠️
                </button>
                <button 
                  className="btn export-btn" 
                  onClick={() => handleExport('zip')}
                  disabled={exportLoading}
                  title="Скачать все материалы в архиве (DOCX + PDF)"
                >
                  📦 ZIP
                </button>
              </div>
              {exportLoading && (
                <p className="export-loading">⏳ Подготовка файлов для скачивания...</p>
              )}
            </div>
          </div>
          
          <div className="gost-info">
            <h4>📋 Форматирование по ГОСТ:</h4>
            <ul>
              <li><strong>Шрифт:</strong> Times New Roman, 14pt</li>
              <li><strong>Поля:</strong> верх/низ - 2см, лево - 3см, право - 1.5см</li>
              <li><strong>Интервал:</strong> 1.5 между строк</li>
              <li><strong>Красная строка:</strong> 1.25см</li>
            </ul>
            <div className="format-info">
              <p><strong>📄 DOCX формат:</strong> Рекомендуется для корректного отображения русского текста с полным форматированием</p>
              <p><strong>⚠️ PDF формат:</strong> Ограниченная поддержка кириллицы. Файлы сохраняются как текст с предупреждением</p>
            </div>
          </div>

          {Object.entries(results).map(([type, material]) => (
            <div key={type} className="result-item">
              <h3>{materialTypeNames[type] || type}</h3>
              {material.error ? (
                <div className="error">{material.error}</div>
              ) : (
                <div className="result-content">
                  {material.content}
                  {material.mock && (
                    <p style={{color: '#666', fontStyle: 'italic', marginTop: '15px'}}>
                      💡 Для получения полных материалов настройте AI API ключ в файле .env
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
