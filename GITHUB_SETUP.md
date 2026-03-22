# 🔗 Настройка GitHub репозитория

## Шаг 1: Создайте репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) и войдите в аккаунт
2. Нажмите **+** (в правом верхнем углу) → **New repository**
3. Заполните:
   - **Repository name**: `stl` (или любое другое имя)
   - **Description**: "STL Platform - Creative community platform"
   - **Visibility**: Private или Public (на ваш выбор)
   - ❌ **НЕ** ставьте галочки на "Add README", "Add .gitignore", "Choose a license"
4. Нажмите **Create repository**

## Шаг 2: Скопируйте URL репозитория

После создания GitHub покажет URL вашего репозитория:

```
https://github.com/ваш-username/stl.git
```

Или SSH формат (если настроен SSH):

```
git@github.com:ваш-username/stl.git
```

## Шаг 3: Подключите локальный проект к GitHub

Замените `ваш-username` на ваш реальный GitHub username:

```bash
# HTTPS (проще, но нужно вводить пароль)
git remote add origin https://github.com/ваш-username/stl.git

# Или SSH (если настроен)
git remote add origin git@github.com:ваш-username/stl.git

# Проверьте, что remote добавлен
git remote -v

# Запушьте код
git push -u origin master
```

## Шаг 4: Проверка

После push зайдите на GitHub и убедитесь, что все файлы загружены.

## Альтернатива: GitHub CLI

Если установлен [GitHub CLI](https://cli.github.com/):

```bash
# Авторизуйтесь (один раз)
gh auth login

# Создайте репозиторий и запушьте код одной командой
gh repo create stl --private --source=. --remote=origin --push
```

## Что дальше?

После того как код на GitHub:
1. Следуйте инструкциям в `NEXT_STEPS.md`
2. Подключите Render к GitHub репозиторию
3. Подключите Cloudflare Pages к GitHub репозиторию

## Нужна помощь с GitHub username?

Ваш GitHub username можно найти:
- В правом верхнем углу GitHub (нажмите на аватар)
- В URL вашего профиля: `https://github.com/username`
- Командой: `gh api user --jq .login` (если установлен gh CLI)
