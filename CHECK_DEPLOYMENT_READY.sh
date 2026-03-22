#!/bin/bash
# Проверка готовности к деплою

echo "🔍 Проверка конфигурации деплоя..."
echo ""

# Проверка файлов конфигурации
echo "📁 Файлы конфигурации:"
if [ -f "render-backend.yaml" ]; then
    echo "  ✅ render-backend.yaml"
else
    echo "  ❌ render-backend.yaml отсутствует"
fi

if [ -f "wrangler.toml" ]; then
    echo "  ✅ wrangler.toml"
else
    echo "  ❌ wrangler.toml отсутствует"
fi

if [ -f "next.config.js" ]; then
    echo "  ✅ next.config.js"
else
    echo "  ❌ next.config.js отсутствует"
fi

echo ""
echo "🗄️ PostgreSQL миграции:"
if [ -d "prisma/migrations/20260322000000_init" ]; then
    echo "  ✅ Миграции созданы"
    if [ -f "prisma/migrations/20260322000000_init/migration.sql" ]; then
        LINES=$(wc -l < prisma/migrations/20260322000000_init/migration.sql)
        echo "  ✅ migration.sql ($LINES строк)"
    fi
else
    echo "  ❌ Миграции отсутствуют"
fi

echo ""
echo "📚 Документация:"
MD_COUNT=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
echo "  ✅ $MD_COUNT markdown файлов"

echo ""
echo "🔗 Git Remote:"
REMOTE=$(git remote -v | grep origin | head -1)
if [ -n "$REMOTE" ]; then
    echo "  ✅ $REMOTE"
else
    echo "  ❌ Remote не настроен"
fi

echo ""
echo "📦 Git Status:"
if git diff-index --quiet HEAD --; then
    echo "  ✅ Все изменения закоммичены"
else
    echo "  ⚠️ Есть незакоммиченные изменения"
fi

echo ""
echo "🎯 Следующие шаги:"
echo "  1. Зайдите на https://dashboard.render.com"
echo "  2. Создайте Blueprint из репозитория"
echo "  3. Настройте Environment Variables"
echo "  4. Дождитесь деплоя"
echo ""
echo "📖 См. RENDER_DEPLOY_STEPS.md для подробностей"
