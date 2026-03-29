# Визуализация изображений в чате

## Текущая реализация

Изображения в чате отображаются со следующим функционалом:

### 1. Отображение в сообщении

**Размеры:**
- Максимальная ширина: 720px
- Максимальная высота: 460px
- Соотношение сторон сохраняется

**Стили:**
- Закруглённые углы (8px)
- Тень для объёма
- Эффект затемнения при наведении
- Плавная анимация увеличения при наведении

### 2. Кнопка развёртывания

При наведении на изображение появляется кнопка "⛶" в правом верхнем углу:
- Полупрозрачный фон с blur-эффектом
- Плавное появление/исчезновение
- Увеличивается при наведении

### 3. Полноэкранный просмотр

При клике на изображение или кнопку развёртывания:
- Открывается модальное окно на весь экран
- Тёмный полупрозрачный фон (90% чёрный)
- Изображение центрируется с максимальными размерами 90% экрана
- Анимация появления (fade-in) и увеличения (zoom-in)

**Закрытие:**
- Кнопка "×" в правом верхнем углу
- Клик вне изображения
- Нажатие клавиши Escape

### 4. Предпросмотр перед отправкой

После выбора файла:
- Показывается миниатюра (макс. 100px высота)
- Кнопка удаления "×" для отмены
- Проверка типа файла (только изображения)
- Проверка размера (макс. 5MB)

## Компоненты

### HTML структура

```html
<!-- Контейнер изображения в сообщении -->
<div class="chat-image-container">
    <img src="..." alt="Image">
    <button class="expand-btn">⛶</button>
</div>

<!-- Предпросмотр -->
<div id="imagePreview">
    <img id="previewImg" src="...">
    <button id="removeImage">×</button>
</div>

<!-- Модальное окно -->
<div id="imageModal">
    <button id="closeImageModal">×</button>
    <img src="..." alt="Full size">
</div>
```

### CSS стили (base.html)

```css
.chat-image-container {
    position: relative;
    display: inline-block;
    margin-top: 8px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chat-image-container img {
    max-width: 720px;
    max-height: 460px;
    transition: filter 0.2s, transform 0.2s;
}

.chat-image-container:hover img {
    filter: brightness(0.85);
    transform: scale(1.01);
}

.chat-image-container .expand-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    transition: opacity 0.2s, background 0.2s;
}

.chat-image-container:hover .expand-btn {
    opacity: 1;
}

#imageModal {
    animation: modalFadeIn 0.3s ease;
}

#imageModal img {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: imageZoomIn 0.3s ease;
}
```

### JavaScript функции (room.html)

```javascript
// Инициализация кнопок развёртывания
function initializeImageExpanders() {
    document.querySelectorAll('.chat-image-container').forEach(container => {
        // Создаёт кнопку ⛶ и добавляет обработчики
    });
}

// Открытие модального окна
function openImageModal(src) {
    // Создаёт модальное окно с изображением
    // Добавляет обработчики закрытия
}

// Загрузка изображения
async function uploadImage(file) {
    // Отправляет файл на сервер
    // Возвращает URL
}

// Отправка с изображением
async function sendMessageWithImage(content, replyTo) {
    // Загружает изображение
    // Отправляет сообщение через WebSocket/HTTP
}
```

## Обработчики событий

```javascript
// Выбор файла
imageInput.addEventListener('change', (e) => {
    // Читает файл
    // Показывает предпросмотр
});

// Удаление предпросмотра
removeImage.addEventListener('click', () => {
    // Очищает currentImage
    // Скрывает preview
});

// Клик на изображение
img.addEventListener('click', () => {
    openImageModal(img.src);
});

// Клик на кнопку развёртывания
expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openImageModal(img.src);
});

// Закрытие модального окна
closeImageModal.addEventListener('click', () => {
    modal.remove();
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.remove();
});
```

## Поддерживаемые форматы

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Ограничения

- Максимальный размер файла: 5MB
- Максимальные размеры отображения: 720x460px
- Только авторизованные пользователи могут загружать

## Примеры использования

### Вставка изображения в сообщение

```javascript
// 1. Пользователь выбирает файл
// 2. Показывается предпросмотр
// 3. При отправке:
const imageUrl = await uploadImage(file);
// 4. Сообщение отправляется с image_url
```

### Отображение полученного сообщения

```javascript
// В appendMessage():
if (msg.has_image && msg.image) {
    imageHtml = `
        <div class="chat-image-container">
            <img src="${msg.image}">
        </div>
    `;
}
// После renderMessages():
initializeImageExpanders();
```

## Улучшения (возможные)

1. **Ленивая загрузка** - загружать изображения только при прокрутке
2. **Lightbox с галереей** - переключение между изображениями в чате
3. **Кнопка скачать** - возможность скачать изображение
4. **EXIF данные** - отображение информации о файле
5. **Progress бар** - индикатор загрузки при отправке
6. **Редактирование** - обрезка/поворот перед отправкой
