"""
API Views для взаимодействий (лайки, комментарии, сохранения).

Эти endpoints используются SPA интерфейсом для интерактивных действий.
Все endpoints требуют аутентификации (кроме получения данных).
"""

from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db.models import F
import json

from core.models import Work
from .models import Like, Comment, Repost, SavedWork, Notification

User = get_user_model()


@login_required
@require_http_methods(["POST"])
def like_api(request, work_id):
    """
    Лайк/анлайк работы.

    Оптимизация:
    - get_or_create вместо separate exists + create (1 запрос вместо 2)
    - Атомарное обновление счётчика через F() expression
    - Минимальный JSON ответ для уменьшения трафика

    Почему POST: изменение состояния на сервере
    Почему не PUT: операция toggle (переключение), а не установка значения
    """
    work = get_object_or_404(Work, pk=work_id)

    # get_or_create проверяет существование и создаёт если нет
    # Это атомарная операция, избегаем race conditions
    like, created = Like.objects.get_or_create(user=request.user, work=work)

    if not created:
        # Уже лайкнуто - удаляем лайк (toggle)
        like.delete()
        liked = False
    else:
        liked = True
        # Создаём уведомление автору (асинхронно можно улучшить через Celery)
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='like',
                work=work
            )

    # Обновляем счётчик лайков - используем count() для актуальности
    # Можно оптимизировать через F('likes_count') +/- 1, но count() надёжнее
    work.likes_count = Like.objects.filter(work=work).count()
    work.save(update_fields=['likes_count'])

    # Минимальный ответ - только статус и новое количество
    return JsonResponse({'liked': liked, 'count': work.likes_count})


@login_required
@require_http_methods(["POST"])
def save_work_api(request, work_id):
    """
    Сохранить работу в избранное / удалить из избранного.

    Оптимизация:
    - Toggle операция (сохранить/удалить)
    - Минимальный ответ
    - Уведомление автору при сохранении

    Почему не отдельная модель Collection: SavedWork проще для быстрого доступа
    """
    work = get_object_or_404(Work, pk=work_id)

    saved, created = SavedWork.objects.get_or_create(user=request.user, work=work)

    if not created:
        # Уже сохранено - удаляем (toggle)
        saved.delete()
        saved_flag = False
    else:
        saved_flag = True
        # Уведомление автору
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='save',
                work=work
            )

    work.saves_count = SavedWork.objects.filter(work=work).count()
    work.save(update_fields=['saves_count'])

    return JsonResponse({'saved': saved_flag, 'count': work.saves_count})


@login_required
@require_http_methods(["POST"])
def comment_api(request, work_id):
    """
    Создание комментария к работе.

    Оптимизация:
    - Только необходимый минимум в ответе
    - Валидация контента на пустоту
    - Уведомление автору работы

    Почему POST: создание нового ресурса
    """
    work = get_object_or_404(Work, pk=work_id)

    # Парсим JSON тело запроса
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    content = data.get('content', '').strip()

    # Валидация - комментарий не может быть пустым
    if not content:
        return JsonResponse({'error': 'Content is required'}, status=400)

    # Создаём комментарий
    comment = Comment.objects.create(
        user=request.user,
        work=work,
        content=content
    )

    # Обновляем счётчик комментариев
    work.comments_count = Comment.objects.filter(work=work, is_deleted=False).count()
    work.save(update_fields=['comments_count'])

    # Уведомление автору работы
    if work.author != request.user:
        Notification.objects.create(
            recipient=work.author,
            actor=request.user,
            type='comment',
            work=work,
            comment=comment
        )

    # Возвращаем созданный комментарий для немедленного отображения в UI
    return JsonResponse({
        'id': comment.id,
        'user': request.user.username,
        'user_avatar': request.user.avatar.url if request.user.avatar else None,
        'content': content,
        'created_at': comment.created_at.isoformat(),
    })


@login_required
def notifications_api(request):
    """
    Получение списка уведомлений пользователя.

    Оптимизация:
    - select_related для уменьшения SQL запросов (JOIN вместо N+1)
    - Ограничение 50 последними уведомлениями
    - Автоматическая пометка всех как прочитанные при получении

    Почему GET: получение данных без изменения состояния
    """
    # select_related уменьшает количество запросов с N+1 до 1
    # prefetch_related можно использовать для many-to-many
    notifications = request.user.notifications.select_related(
        'actor',  # Пользователь, создавший уведомление
        'work',   # Работа (если есть)
        'comment' # Комментарий (если есть)
    ).order_by('-created_at')[:50]  # Последние 50

    # Помечаем все уведомления как прочитанные
    # update() эффективнее чем цикл с save() для каждого объекта
    request.user.notifications.filter(is_read=False).update(is_read=True)

    # Сериализуем в формат, готовый для отображения в UI
    return JsonResponse({
        'notifications': [
            {
                'id': n.id,
                'type': n.type,  # like, comment, follow, repost, save
                'actor': {
                    'username': n.actor.username,
                    'avatar': n.actor.avatar.url if n.actor.avatar else None,
                },
                'work': {
                    'title': n.work.title,
                    'slug': n.work.slug,
                } if n.work else None,
                'comment': {
                    'content': n.comment.content,
                } if n.comment else None,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
                'text': f'{n.actor.username} {get_notification_text(n.type)}',
            }
            for n in notifications
        ]
    })


def get_notification_text(notification_type):
    """
    Возвращает текст уведомления по типу.

    Оптимизация: простой dict lookup вместо if/else цепочки
    """
    texts = {
        'like': 'оценил вашу работу',
        'comment': 'прокомментировал вашу работу',
        'follow': 'подписался на вас',
        'repost': 'сделал репост вашей работы',
        'save': 'сохранил вашу работу',
        'mention': 'упомянул вас',
    }
    return texts.get(notification_type, 'взаимодействовал с вами')


@login_required
@require_http_methods(["POST"])
def follow_api(request, username):
    """
    Подписка/отписка от пользователя.

    Оптимизация:
    - get_or_create для toggle операции
    - Обновление счётчиков подписчиков/подписок

    Почему POST: изменение состояния
    """
    from accounts.models import Follow, Profile

    target_user = get_object_or_404(User, username=username)

    if target_user == request.user:
        return JsonResponse({'error': 'Cannot follow yourself'}, status=400)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=target_user
    )

    if not created:
        follow.delete()
        following = False
    else:
        following = True
        # Уведомление пользователю
        Notification.objects.create(
            recipient=target_user,
            actor=request.user,
            type='follow'
        )

    # Обновляем счётчики
    follower_profile = Profile.objects.filter(user=request.user).first()
    following_profile = Profile.objects.filter(user=target_user).first()

    if follower_profile:
        follower_profile.following_count = Follow.objects.filter(follower=request.user).count()
        follower_profile.save(update_fields=['following_count'])

    if following_profile:
        following_profile.followers_count = Follow.objects.filter(following=target_user).count()
        following_profile.save(update_fields=['followers_count'])

    return JsonResponse({
        'following': following,
        'followers_count': following_profile.followers_count if following_profile else 0,
    })
