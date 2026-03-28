"""
Утилиты для STL проекта.
Включают функции для обработки изображений и видео.
"""

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
import os


def get_logo_path():
    """Получить путь к логотипу сайта"""
    # Используем логотип из шапки сайта
    logo_path = os.path.join(settings.BASE_DIR, 'media', 'images', 'logo.png')
    if os.path.exists(logo_path):
        return logo_path
    # Резервный вариант - статический логотип
    static_logo = os.path.join(settings.BASE_DIR, 'static', 'logo.png')
    if os.path.exists(static_logo):
        return static_logo
    return None


def create_logo():
    """
    Создать логотип сайта программно.
    Логотип 128x128px с градиентным кругом и текстом STL.
    """
    # Создаем логотип 128x128 с прозрачным фоном
    logo = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(logo)

    # Рисуем градиентный круг (от фиолетового к красному)
    for r in range(60, 0, -1):
        t = r / 60
        red = int(230 * t + 102 * (1-t))
        green = int(0 * t + 75 * (1-t))
        blue = int(230 * t + 255 * (1-t))
        draw.ellipse([64-r, 64-r, 64+r, 64+r], fill=(red, green, blue, 255))

    # Добавляем текст STL
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()

    # Вычисляем центр для текста
    bbox = draw.textbbox((0, 0), 'STL', font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = (128 - text_width) // 2
    text_y = (128 - text_height) // 2

    draw.text((text_x, text_y), 'STL', fill='white', font=font)

    # Сохраняем
    logo_path = get_logo_path()
    logo.save(logo_path, 'PNG')

    return logo_path


def apply_watermark(image_path, username, output_path=None):
    """
    Нанести водяной знак на изображение.

    Водяной знак состоит из:
    - Логотипа сайта в правом нижнем углу (128x128px, прозрачность 97%)
    - Имени пользователя под логотипом (та же прозрачность)

    Args:
        image_path: Путь к исходному изображению
        username: Имя пользователя для нанесения
        output_path: Путь для сохранения результата (если None, перезаписывает исходное)

    Returns:
        Путь к изображению с водяным знаком
    """
    try:
        # Открываем исходное изображение
        base_image = Image.open(image_path).convert('RGBA')

        # Создаем прозрачный слой для водяного знака
        watermark_layer = Image.new('RGBA', base_image.size, (255, 255, 255, 0))

        # Получаем размеры
        base_width, base_height = base_image.size

        # Размер логотипа
        logo_size = 128
        padding = 50  # Поднимаем выше (увеличенный отступ)

        # Позиция логотипа (правый нижний угол)
        logo_x = base_width - logo_size - padding
        logo_y = base_height - logo_size - padding

        # Пытаемся загрузить логотип
        logo_path = get_logo_path()
        if logo_path and os.path.exists(logo_path):
            logo = Image.open(logo_path).convert('RGBA')
            logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

            # Прозрачность 97% (3% видимости)
            alpha = logo.split()[3] if logo.mode == 'RGBA' else None
            if alpha:
                alpha = alpha.point(lambda p: int(p * 0.03))
                logo.putalpha(alpha)

            # Накладываем логотип
            watermark_layer.paste(logo, (logo_x, logo_y), logo)
        else:
            # Если логотип не найден, рисуем текст вместо него
            draw = ImageDraw.Draw(watermark_layer)
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except:
                font = ImageFont.load_default()

            # Рисуем полупрозрачный прямоугольник
            draw.rectangle(
                [logo_x, logo_y, logo_x + logo_size, logo_y + logo_size],
                fill=(255, 255, 255, 8)  # 3% непрозрачности
            )

        # Добавляем имя пользователя под логотипом
        draw = ImageDraw.Draw(watermark_layer)

        # Пытаемся загрузить шрифт
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()

        # Текст с именем пользователя
        user_text = f"@{username}"

        # Получаем размер текста
        bbox = draw.textbbox((0, 0), user_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        # Позиция текста (под логотипом)
        text_x = logo_x + (logo_size - text_width) // 2
        text_y = logo_y + logo_size + 5

        # Рисуем текст с 97% прозрачностью (3% видимости)
        # PIL не поддерживает прозрачность текста напрямую, поэтому используем хак
        # Создаем отдельное изображение для текста
        text_layer = Image.new('RGBA', base_image.size, (255, 255, 255, 0))
        text_draw = ImageDraw.Draw(text_layer)
        text_draw.text((text_x, text_y), user_text, font=font, fill=(255, 255, 255, 8))  # 3% непрозрачности

        # Объединяем слои
        watermark_layer = Image.alpha_composite(watermark_layer, text_layer)

        # Объединяем с исходным изображением
        result = Image.alpha_composite(base_image, watermark_layer)

        # Конвертируем обратно в RGB для сохранения
        result_rgb = result.convert('RGB')

        # Сохраняем результат
        if output_path is None:
            output_path = image_path

        result_rgb.save(output_path, quality=95)

        return output_path

    except Exception as e:
        print(f"Error applying watermark: {e}")
        # В случае ошибки возвращаем исходное изображение
        return image_path


def apply_watermark_to_image(image_file, username, apply_watermark_flag=True):
    """
    Нанести водяной знак на загруженный файл изображения.

    Args:
        image_file: Файл изображения (UploadedFile)
        username: Имя пользователя
        apply_watermark_flag: Флаг применения водяного знака (True/False)

    Returns:
        Обработанный файл изображения
    """
    from io import BytesIO
    from django.core.files.uploadedfile import InMemoryUploadedFile

    try:
        # Открываем изображение
        img = Image.open(image_file).convert('RGBA')

        # Получаем размеры
        base_width, base_height = img.size

        # Размер логотипа
        logo_size = 128
        padding = 50  # Поднимаем выше (увеличенный отступ)

        # Позиция логотипа (правый нижний угол)
        logo_x = base_width - logo_size - padding
        logo_y = base_height - logo_size - padding

        # Пытаемся загрузить логотип
        logo_path = get_logo_path()

        if apply_watermark_flag:
            # Создаем прозрачный слой для водяного знака
            watermark_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))

            if logo_path and os.path.exists(logo_path):
                logo = Image.open(logo_path).convert('RGBA')
                logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

                # Прозрачность 90% (10% видимости)
                alpha = logo.split()[3] if logo.mode == 'RGBA' else None
                if alpha:
                    alpha = alpha.point(lambda p: int(p * 0.10))
                    logo.putalpha(alpha)

                # Накладываем логотип
                watermark_layer.paste(logo, (logo_x, logo_y), logo)
                print(f"DEBUG: Watermark applied - logo at ({logo_x}, {logo_y}), image size: {base_width}x{base_height}")

            # Добавляем имя пользователя
            draw = ImageDraw.Draw(watermark_layer)

            try:
                font = ImageFont.truetype("arial.ttf", 20)
            except:
                font = ImageFont.load_default()

            user_text = f"@{username}"
            bbox = draw.textbbox((0, 0), user_text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            text_x = logo_x + (logo_size - text_width) // 2
            text_y = logo_y + logo_size + 5

            # Рисуем текст с 90% прозрачностью (10% видимости)
            text_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
            text_draw = ImageDraw.Draw(text_layer)
            text_draw.text((text_x, text_y), user_text, font=font, fill=(255, 255, 255, 26))  # 10% непрозрачности

            watermark_layer = Image.alpha_composite(watermark_layer, text_layer)

            # Объединяем с исходным изображением
            result = Image.alpha_composite(img, watermark_layer)
            print(f"DEBUG: Watermark completed for user @{username}")
        else:
            # Без водяного знака
            print(f"DEBUG: Watermark disabled for user @{username}")
            result = img

        # Сохраняем в буфер
        buffer = BytesIO()
        result_rgb = result.convert('RGB')
        result_rgb.save(buffer, format='JPEG', quality=95)
        buffer.seek(0)

        # Создаем новый файл
        return InMemoryUploadedFile(
            buffer,
            'ImageField',
            image_file.name,
            'image/jpeg',
            buffer.getbuffer().nbytes,
            None
        )

    except Exception as e:
        print(f"Error applying watermark: {e}")
        return image_file
