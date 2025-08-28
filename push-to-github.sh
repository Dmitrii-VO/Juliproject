#!/bin/bash
# 🚀 Скрипт для отправки кода на GitHub

echo "🔄 Отправка кода в репозиторий git@github.com:Dmitrii-VO/Juliproject.git"

# Проверка статуса
echo "📋 Текущий статус:"
git status --short

# Проверка remote
echo "🔗 Remote репозитории:"
git remote -v

# Отправка на GitHub
echo "🚀 Отправляем код на GitHub..."
git push -u origin master

if [ $? -eq 0 ]; then
    echo "✅ Успешно! Код отправлен на GitHub!"
    echo "🌐 Ваш репозиторий: https://github.com/Dmitrii-VO/Juliproject"
else
    echo "❌ Ошибка при отправке. Возможные причины:"
    echo "   1. SSH ключи не настроены"
    echo "   2. Нет прав доступа к репозиторию"
    echo "   3. Проблемы с интернет-соединением"
    echo ""
    echo "🔧 Попробуйте:"
    echo "   git push -u origin main  # если основная ветка 'main'"
    echo "   или настройте SSH ключи для GitHub"
fi