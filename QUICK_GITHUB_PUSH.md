# 🚀 Быстрый пуш на GitHub

## Проблема
Вы получили ошибку: `fatal: 'origin' does not appear to be a git repository`

Это значит, что remote ещё не добавлен.

## Решение

### Шаг 1: Создайте репозиторий на GitHub

1. Откройте [github.com/new](https://github.com/new)
2. Repository name: `stl`
3. НЕ добавляйте README, .gitignore или license
4. Нажмите **Create repository**

### Шаг 2: Скопируйте URL

GitHub покажет URL вашего репозитория. Например:
```
https://github.com/your-username/stl.git
```

### Шаг 3: Добавьте remote и запушьте

Замените `your-username` на ваш реальный GitHub username:

```bash
# Добавьте remote
git remote add origin https://github.com/your-username/stl.git

# Проверьте, что remote добавлен
git remote -v

# Запушьте код
git push -u origin master
```

### Альтернатива: GitHub CLI (быстрее)

Если установлен [GitHub CLI](https://cli.github.com/):

```bash
# Авторизуйтесь (один раз)
gh auth login

# Создайте репозиторий и запушьте одной командой
gh repo create stl --private --source=. --remote=origin --push
```

Это автоматически:
- Создаст репозиторий на GitHub
- Добавит remote origin
- Запушит весь код

## Что дальше?

После успешного push:
1. Откройте ваш репозиторий на GitHub
2. Следуйте `DEPLOYMENT_CHECKLIST.md` для деплоя на Render и Cloudflare
