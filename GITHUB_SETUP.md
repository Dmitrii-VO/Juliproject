# 📋 Инструкция по созданию GitHub репозитория

## 🔥 Быстрый старт:

### 1. Создайте репозиторий на GitHub:
Перейдите на https://github.com/new и создайте новый репозиторий:
- **Название:** `education-materials-platform`
- **Описание:** `🎓 Образовательная платформа для генерации учебных материалов с ИИ и экспортом по ГОСТ`
- **Visibility:** Public (или Private по желанию)
- **❌ НЕ добавляйте README, .gitignore или license** (они уже есть)

### 2. Подключите локальный репозиторий:
```bash
# Добавьте remote origin (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/education-materials-platform.git

# Отправьте код на GitHub
git push -u origin master
```

### 3. Альтернативный способ через SSH:
```bash
# Если используете SSH ключи
git remote add origin git@github.com:YOUR_USERNAME/education-materials-platform.git
git push -u origin master
```

## 📄 Рекомендуемые настройки репозитория:

### Topics (теги):
Добавьте в настройках репозитория:
- `education`
- `ai`
- `react`
- `nodejs`
- `russia`
- `fgos`
- `gost`
- `teaching`
- `materials`
- `generator`

### Описание:
```
🎓 AI-powered educational content generator for Russian schools with GOST document formatting | Образовательная платформа для генерации учебных материалов с ИИ
```

### Ветки:
- Основная ветка: `master`
- Можно настроить `main` как основную, если предпочитаете

## 🔒 Безопасность:

**⚠️ ВАЖНО:** Файл `.env` уже добавлен в `.gitignore` и не попадет в репозиторий.
Ваши API ключи остаются в безопасности!

## 🌟 Дополнительные файлы для GitHub:

Можете добавить позже:
- `.github/workflows/` - для GitHub Actions
- `CONTRIBUTING.md` - правила внесения изменений  
- `LICENSE` - лицензия (рекомендуется MIT)
- `CHANGELOG.md` - история изменений

## ✅ После создания:

1. Репозиторий будет доступен по адресу: `https://github.com/YOUR_USERNAME/education-materials-platform`
2. GitHub автоматически предложит клонировать или форкнуть проект
3. Можете настроить GitHub Pages для демонстрации (если нужно)

---

**🤖 Создано с помощью Claude Code**