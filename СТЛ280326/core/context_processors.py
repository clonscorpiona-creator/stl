"""
Контекстные процессоры для шаблонов.
"""

from django.conf import settings


def logo_context(request):
    """
    Добавляет URL логотипа в контекст всех шаблонов.
    Использует альтернативный логотип, если он указан.
    """
    # Проверяем, использовать ли альтернативный логотип
    use_alt_logo = request.GET.get('alt_logo', 'false').lower() == 'true'

    if use_alt_logo:
        return {
            'logo_image': '/media/images/logo_alt.png',
        }
    return {
        'logo_image': '/media/images/logo.png',
    }
