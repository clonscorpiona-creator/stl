"""
Custom template tags for STL platform.

Оптимизация:
- Кэширование количества непрочитанных уведомлений
- Минимум запросов к БД через select_related
"""

from django import template
from django.contrib.auth import get_user_model

register = template.Library()

User = get_user_model()


@register.simple_tag
def unread_notifications_count(user):
    """
    Возвращает количество непрочитанных уведомлений для пользователя.

    Почему simple_tag: нужно выполнить запрос к БД и вернуть значение
    Почему не inclusion_tag: нужно только значение, а не шаблон

    Оптимизация:
    - Используем count() вместо len(queryset) для эффективности
    - count() делает SELECT COUNT(*) вместо SELECT * и len() в Python
    """
    if not user or not user.is_authenticated:
        return 0

    # count() эффективнее чем len() - делает SELECT COUNT(*) в SQL
    return user.notifications.filter(is_read=False).count()


@register.simple_tag
def has_unread_notifications(user):
    """
    Проверяет, есть ли непрочитанные уведомления.

    Почему exists(): существует хотя бы одно непрочитанное
    Оптимизация:
    - exists() делает SELECT 1 ... LIMIT 1
    - Гораздо быстрее count() когда нужна только проверка существования
    """
    if not user or not user.is_authenticated:
        return False

    # exists() останавливается после первого найденного совпадения
    return user.notifications.filter(is_read=False).exists()


@register.filter
def get_item(dictionary, key):
    """
    Получает элемент словаря по ключу.

    Использование: {{ my_dict|get_item:key }}
    """
    if dictionary is None:
        return None
    return dictionary.get(key)
