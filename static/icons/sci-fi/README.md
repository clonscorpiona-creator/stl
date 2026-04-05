# Sci-Fi Icon Set

Комплект иконок в стиле Sci-Fi для проекта STL.

## Особенности

- **currentColor** в stroke и fill — цвет иконок меняется через CSS `color`
- **Opacity слои** — некоторые элементы имеют прозрачность для создания глубины
- **Тонкие линии** — stroke-width="1.5" для современного вида
- **Геометрические акценты** — круги, полигоны для Sci-Fi эстетики

## Использование в CSS

```css
/* Базовый стиль */
.icon {
  width: 24px;
  height: 24px;
  color: #00f5ff; /* Cyan - основной Sci-Fi цвет */
}

/* При наведении */
.icon:hover {
  color: #7b2ff7; /* Purple - акцентный цвет */
}

/* С свечением */
.icon-glow {
  color: #00f5ff;
  filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
}
```

## Sci-Fi цветовые схемы

### Cyan Glow
```css
color: #00f5ff;
filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.6));
```

### Purple Neon
```css
color: #7b2ff7;
filter: drop-shadow(0 0 10px rgba(123, 47, 247, 0.6));
```

### Monochrome White
```css
color: #ffffff;
filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
```

### Cyber Red
```css
color: #ff2d55;
filter: drop-shadow(0 0 10px rgba(255, 45, 85, 0.5));
```

## Список иконок

| Имя файла | Описание |
|-----------|----------|
| home.svg | Главная / Дом |
| user.svg | Пользователь / Профиль |
| feed.svg | Лента / Новости |
| like.svg | Лайк / Нравится |
| heart.svg | Сердце / Избранное |
| heart-outline.svg | Сердце контур |
| eye.svg | Просмотры |
| star.svg | Звезда / Рейтинг |
| message.svg | Сообщения / Чат |
| notification.svg | Уведомления |
| settings.svg | Настройки |
| search.svg | Поиск |
| upload.svg | Загрузка |
| tag.svg | Тег / Категория |
| gallery.svg | Галерея / Работы |
| video.svg | Видео |
| share.svg | Поделиться |
| follow.svg | Подписаться |
| logout.svg | Выход |
| login.svg | Вход |
| admin.svg | Админ |
| block.svg | Блок / Запрет |
| thumb.svg | Палец вверх/вниз |
| chart.svg | График / Статистика |
| palette.svg | Палитра / Дизайн |
| code.svg | Код / Программирование |
| calendar.svg | Календарь / Управление |
| scale.svg | Весы / Юридические услуги |
| book.svg | Книга / Контент |

## Пример использования в HTML

```html
<!-- Простая иконка -->
<svg class="icon" viewBox="0 0 24 24">
  <use href="/static/icons/sci-fi/home.svg#icon"></use>
</svg>

<!-- Или напрямую -->
<img src="/static/icons/sci-fi/home.svg" alt="Home" class="icon">

<!-- С CSS классом -->
<span class="icon icon-glow">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <!-- путь иконки -->
  </svg>
</span>
```

## Анимации

```css
/* Пульсация */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.icon-pulse {
  animation: pulse 2s ease-in-out infinite;
}

/* Свечение */
@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 5px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 15px currentColor);
  }
}

.icon-glow-animation {
  animation: glow 1.5s ease-in-out infinite;
}

/* Вращение */
.icon-spin {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Интеграция с портфолио Sci-Fi

Для использования с гексагональной инфографикой в портфолио:

```css
.hex-module .icon {
  width: 48px;
  height: 48px;
  fill: #fff;
  transition: all 0.3s ease;
}

.hex-module:hover .icon {
  fill: #000;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.8));
}
```
