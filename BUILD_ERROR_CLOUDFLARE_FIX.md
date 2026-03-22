# 🔧 Build Error Fix - Cloudflare Pages

## Проблема

```
Failed: error occurred while running build command
```

## Причина

`next.config.js` использовал `output: 'standalone'` по умолчанию.

**Standalone mode** предназначен для Node.js серверов (Render), но **НЕ работает** на Cloudflare Pages.

## Решение

Обновлён `next.config.js`:

**Было:**
```javascript
output: process.env.NEXT_OUTPUT_MODE || 'standalone',
```

**Стало:**
```javascript
...(process.env.NEXT_OUTPUT_MODE === 'standalone' && { output: 'standalone' }),
```

Теперь:
- **Cloudflare Pages**: использует default output (работает)
- **Render Backend**: может установить `NEXT_OUTPUT_MODE=standalone` если нужно

## Что делать

1. Код уже исправлен и загружен на GitHub
2. Retry deployment на Cloudflare Pages
3. Сборка должна пройти успешно

## Проверка

После исправления build command должен работать:
```bash
npm run build
```

Без ошибок.
