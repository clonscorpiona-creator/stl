# Загрузка и отображение изображений в чате

## Обзор

Чат поддерживает загрузку и отображение изображений следующих форматов:
- JPEG
- PNG
- GIF
- WebP

Максимальный размер файла: 5MB

## Архитектура

### Backend (Python/Django)

#### API эндпоинты

1. **Загрузка изображения**
   - URL: `POST /chat/api/upload-image/`
   - Формат: `multipart/form-data` или `base64`
   - Возвращает: `{"url": "<image_url>"}`

   ```python
   @login_required
   def upload_image_api(request):
       # Принимает изображение из request.FILES['image']
       # или base64 из request.POST['image']
       # Проверяет тип файла и размер
       # Сохраняет в media/chat/images/
       # Возвращает URL
   ```

2. **Отправка сообщения с изображением**
   - URL: `POST /chat/api/channels/<slug>/messages/`
   - Формат: JSON с полем `image_url`
   - WebSocket: `{"type": "message", "content": "...", "image_url": "..."}`

3. **Хранение в текстовом файле**
   - Файл: `chat/messages_storage/<channel_slug>.txt`
   - Формат: `username\ttimestamp\tcontent\tattachments`
   - Пример: `admin\t2025-03-20T10:00:00Z\tПривет!\thttps://.../image.png`

### Frontend (JavaScript)

#### Загрузка изображения

1. Пользователь выбирает файл через `<input type="file">`
2. Файл конвертируется в base64 для предпросмотра
3. При отправке сообщения файл загружается через API
4. URL изображения сохраняется в сообщении

```javascript
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/chat/api/upload-image/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': window.CHAT.csrf,
        },
        body: formData,
    });

    if (response.ok) {
        const data = await response.json();
        return data.url;
    }
    return null;
}
```

#### Отправка сообщения с изображением

```javascript
async function sendMessageWithImage(content, replyTo = null) {
    if (!currentImage) return;

    // Конвертируем base64 в Blob
    const response = await fetch(currentImage);
    const blob = await response.blob();
    const file = new File([blob], 'image.png', { type: 'image/png' });

    // Загружаем изображение
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
        alert('Ошибка загрузки изображения');
        return;
    }

    // Отправляем сообщение через WebSocket или HTTP
    const payload = {
        content: content || '[Изображение]',
        image_url: imageUrl,
    };
    if (replyTo) {
        payload.reply_to = replyTo.id;
    }

    if (window.CHAT.ws?.readyState === WebSocket.OPEN) {
        window.CHAT.ws.send(JSON.stringify({
            type: 'message',
            ...payload,
        }));
    } else {
        await sendViaHTTP(payload.content, replyTo, payload.image_url);
    }

    // Очищаем
    currentImage = null;
    imagePreview.style.display = 'none';
    imageInput.value = '';
}
```

#### Отображение изображения

Изображения отображаются в сообщениях с максимальными размерами 720x460px:

```javascript
// В функции appendMessage:
if (msg.has_image && msg.image) {
    imageHtml = `
        <div class="chat-image-container" style="
            position: relative;
            display: inline-block;
            margin-top: 8px;
        ">
            <img src="${msg.image}" alt="Image" style="
                max-width: 720px;
                max-height: 460px;
                width: auto;
                height: auto;
                border-radius: 8px;
                display: block;
                cursor: pointer;
            ">
        </div>
    `;
}
```

#### Полноэкранный просмотр

При клике на изображение открывается модальное окно:

```javascript
function openImageModal(src) {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
        `;
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <button id="closeImageModal" style="
            position: absolute;
            top: 20px;
            right: 20px;
            background: transparent;
            border: none;
            color: white;
            font-size: 32px;
            cursor: pointer;
            z-index: 10001;
        ">&times;</button>
        <img src="${src}" style="
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        ">
    `;

    modal.style.display = 'flex';

    // Закрытие по клику на кнопку
    document.getElementById('closeImageModal').onclick = () => {
        modal.style.display = 'none';
    };

    // Закрытие по клику вне изображения
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Закрытие по ESC
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}
```

## Кнопки управления

### Кнопка загрузки изображения

```html
<button id="imageUploadBtn" title="Прикрепить изображение">
    🖼️
</button>
<input type="file" id="imageInput" accept="image/*" style="display: none;">
```

### Кнопка развёртывания

При наведении на изображение появляется кнопка развёртывания:

```javascript
function initializeImageExpanders() {
    document.querySelectorAll('.chat-image-container').forEach(container => {
        if (container.querySelector('.expand-btn')) return;

        const img = container.querySelector('img');
        if (!img) return;

        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.innerHTML = '⛶';
        expandBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border: none;
            font-size: 16px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
        `;

        container.style.position = 'relative';
        container.appendChild(expandBtn);

        // Показываем кнопку при наведении
        container.addEventListener('mouseenter', () => {
            expandBtn.style.opacity = '1';
        });
        container.addEventListener('mouseleave', () => {
            expandBtn.style.opacity = '0';
        });

        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openImageModal(img.src);
        });

        img.addEventListener('click', () => {
            openImageModal(img.src);
        });
    });
}
```

## CSS стили

```css
.chat-image-container {
    position: relative;
    display: inline-block;
    margin-top: 8px;
}

.chat-image-container img {
    max-width: 720px;
    max-height: 460px;
    border-radius: 8px;
    cursor: pointer;
    transition: filter 0.2s;
}

.chat-image-container:hover img {
    filter: brightness(0.85);
}

.expand-btn {
    opacity: 0;
    transition: opacity 0.2s;
}

.chat-image-container:hover .expand-btn {
    opacity: 1;
}
```

## История сообщений

При загрузке истории из текстового хранилища изображения извлекаются из поля `attachments`:

```javascript
const historicalMessages = storageData.messages.map((msg, index) => {
    const attachments = msg.attachments || [];
    const imageUrl = attachments.find(att => typeof att === 'string' && att.startsWith('http'));

    return {
        id: 'hist_' + index,
        content: msg.content.replace(/\[Изображение:.*?\]/g, '').trim() || '[Изображение]',
        has_image: !!imageUrl,
        image: imageUrl || null,
        // ... остальные поля
    };
});
```

## Безопасность

1. **Проверка типа файла**: Только изображения (JPEG, PNG, GIF, WebP)
2. **Проверка размера**: Максимум 5MB
3. **Авторизация**: Только авторизованные пользователи могут загружать
4. **CSRF защита**: Токен требуется для всех POST запросов

## Пример использования

```javascript
// Предпросмотр изображения
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        currentImage = e.target.result;
        imagePreview.innerHTML = `
            <img src="${currentImage}" style="
                max-width: 200px;
                max-height: 200px;
                border-radius: 8px;
            ">
            <button onclick="removeImage()">×</button>
        `;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// Удаление предпросмотра
function removeImage() {
    currentImage = null;
    imagePreview.style.display = 'none';
    imageInput.value = '';
}
```
