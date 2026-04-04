"""
Контекстные процессоры для шаблонов.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import IconSet

User = get_user_model()


def header_stats_context(request):
    """
    Добавляет статистику для шапки:
    - Всего зарегистрированных пользователей
    - Пользователей онлайн (активность за последние 5 минут)
    """
    total_users = User.objects.count()

    # Считаем онлайн пользователей (активность за последние 5 минут)
    online_minutes = 5
    online_time = timezone.now() - timedelta(minutes=online_minutes)
    online_users = User.objects.filter(last_login__gte=online_time).count()

    return {
        'total_users': total_users,
        'online_users': online_users,
    }


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


def icon_set_context(request):
    """
    Добавляет активный набор иконок и цветовую тему в контекст всех шаблонов.
    """
    active_set = IconSet.get_active_set()
    icon_set_slug = active_set.slug if active_set else 'default'

    # Получаем активную цветовую тему из сессии
    color_theme = request.session.get('color_theme', 'olive-sage')

    # Получаем фон Герой секции из сессии
    hero_bg = request.session.get('hero_bg', 'classic')

    return {
        'icon_set': icon_set_slug,
        'color_theme': color_theme,
        'hero_bg': hero_bg,
    }


def calendar_context(request):
    """
    Добавляет данные календаря для текущего месяца.
    """
    from datetime import datetime
    import calendar

    now = datetime.now()
    current_year = now.year
    current_month = now.month
    current_day = now.day

    # Получаем календарь на текущий месяц
    cal = calendar.Calendar(firstweekday=0)  # Понедельник - первый день
    month_days = cal.monthdayscalendar(current_year, current_month - 1)

    # Формируем список дней для шаблона
    calendar_days = []
    month_name = now.strftime('%B %Y')

    for week in month_days:
        for day in week:
            if day == 0:
                continue  # Пропускаем нулевые дни
            calendar_days.append({
                'day': day,
                'is_today': day == current_day,
                'is_other_month': False,
            })

    return {
        'calendar_days': calendar_days,
        'calendar_month_year': month_name,
    }
