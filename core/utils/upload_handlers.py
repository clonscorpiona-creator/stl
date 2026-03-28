"""
Кастомные загрузчики файлов для распределения по папкам.

Папки назначения:
- images/ - для изображений (jpg, jpeg, png, gif, webp, svg)
- audio/ - для аудио файлов (mp3, wav, ogg, flac, m4a)
- video/ - для видео файлов (mp4, webm, avi, mov, mkv)
"""

import os
from django.core.files.storage import default_storage


def get_file_extension(filename):
    """Получить расширение файла в нижнем регистре"""
    return os.path.splitext(filename)[1].lower().lstrip('.')


def is_image_file(filename):
    """Проверка, является ли файл изображением"""
    image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'}
    return get_file_extension(filename) in image_extensions


def is_audio_file(filename):
    """Проверка, является ли файл аудио"""
    audio_extensions = {'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'}
    return get_file_extension(filename) in audio_extensions


def is_video_file(filename):
    """Проверка, является ли файл видео"""
    video_extensions = {'mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv'}
    return get_file_extension(filename) in video_extensions


def custom_upload_to(instance, filename):
    """
    Кастомная функция для определения пути загрузки файла.

    Распределяет файлы по папкам в зависимости от типа:
    - images/ - изображения
    - audio/ - аудио
    - video/ - видео

    Args:
        instance: Экземпляр модели
        filename: Имя файла

    Returns:
        str: Путь для сохранения файла
    """
    # Определяем тип файла и папку назначения
    if is_image_file(filename):
        folder = 'images'
    elif is_audio_file(filename):
        folder = 'audio'
    elif is_video_file(filename):
        folder = 'video'
    else:
        # Для остальных файлов используем папку files
        folder = 'files'

    # Сохраняем оригинальное имя файла (можно добавить уникальность при необходимости)
    return os.path.join(folder, filename)


class ContentTypeUpload:
    """
    Миксин для моделей с загрузкой файлов по типу контента.

    Использование:
        class MyModel(ContentTypeUpload, models.Model):
            file = models.FileField(upload_to=custom_upload_to)
    """

    @property
    def file_type_category(self):
        """Определить категорию файла (images, audio, video, files)"""
        if not hasattr(self, 'file') or not self.file:
            return 'files'

        filename = self.file.name if hasattr(self.file, 'name') else str(self.file)

        if is_image_file(filename):
            return 'images'
        elif is_audio_file(filename):
            return 'audio'
        elif is_video_file(filename):
            return 'video'
        else:
            return 'files'
