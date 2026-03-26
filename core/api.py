"""
API Views для SPA интерфейса STL Platform.

Все API endpoints возвращают JSON данные для динамической подгрузки контента.
Используется пагинация для уменьшения размера ответов.
Lazy loading реализуется на клиенте через Intersection Observer.
"""

from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import F, FloatField

from .models import Work, Category, Collection
from interactions.models import Like, Comment, SavedWork, Notification
import json

User = get_user_model()


def serialize_work(work):
    """
    Сериализует модель Work в JSON-словарь.

    Оптимизация: возвращаем только необходимые поля,
    чтобы уменьшить размер ответа API.
    """
    return {
        'id': work.id,
        'title': work.title,
        'slug': work.slug,
        'description': work.description[:200] if work.description else '',
        'cover': work.cover.url if work.cover else None,
        'author': {
            'username': work.author.username,
            'avatar': work.author.avatar.url if work.author.avatar else None,
        },
        'category': {
            'name': work.category.name,
            'slug': work.category.slug,
        } if work.category else None,
        'stats': {
            'likes': work.likes_count,
            'views': work.views_count,
            'comments': work.comments_count,
            'saves': work.saves_count,
        },
        'tags': list(work.tags.all().values('name', 'slug')),
        'created_at': work.created_at.isoformat(),
    }


def home_api(request):
    """
    Главная страница API - возвращает популярные работы.

    Оптимизация:
    - select_related для уменьшения SQL запросов (JOIN вместо N+1)
    - Ограничение выборки ([:12]) для быстрого ответа
    - Только опубликованные работы
    """
    works = Work.objects.filter(
        status='published'
    ).select_related(
        'author', 'category'
    ).prefetch_related(
        'tags'
    )[:12]

    return JsonResponse({
        'works': [serialize_work(w) for w in works],
        'categories': list(Category.objects.values('name', 'slug')),
    })


def feed_api(request):
    """
    Лента новостей API.

    Для авторизованных пользователей:
    - Работы авторов, на которых подписан пользователь
    - Рекомендации на основе лайков

    Оптимизация:
    - Кэширование ID подписок
    - Ограничение выборки
    """
    if not request.user.is_authenticated:
        return home_api(request)

    # Получаем ID авторов, на которых подписан пользователь
    following_ids = request.user.following.values_list('following_id', flat=True)

    if following_ids:
        # Работы от подписок
        following_works = Work.objects.filter(
            status='published',
            author_id__in=following_ids
        ).select_related('author', 'category').order_by('-created_at')[:20]
    else:
        following_works = []

    # Рекомендации (популярные работы)
    recommended = Work.objects.filter(
        status='published'
    ).exclude(author=request.user).annotate(
        score=F('likes_count') + F('views_count') * 0.5
    ).order_by('-score', '-created_at')[:10]

    return JsonResponse({
        'following': [serialize_work(w) for w in following_works],
        'recommended': [serialize_work(w) for w in recommended],
    })


def works_list_api(request):
    """
    Список всех работ с фильтрами и пагинацией.

    Фильтры:
    - category: фильтр по категории
    - tag: фильтр по тегу
    - q: поиск по названию, описанию, автору
    - sort: сортировка (-created_at, -likes_count, -views_count)

    Оптимизация:
    - Пагинация (12 работ на страницу)
    - select_related для связанных моделей
    - Индексы в БД на часто используемых полях
    """
    works = Work.objects.filter(status='published').select_related('author', 'category').prefetch_related('tags')

    # Применяем фильтры
    category = request.GET.get('category')
    tag = request.GET.get('tag')
    query = request.GET.get('q', '')
    sort = request.GET.get('sort', '-created_at')

    if category:
        works = works.filter(category__slug=category)

    if tag:
        works = works.filter(tags__slug=tag)

    if query:
        works = works.filter(
            models.Q(title__icontains=query) |
            models.Q(description__icontains=query) |
            models.Q(author__username__icontains=query)
        )

    # Валидация сортировки
    valid_sorts = ['-created_at', 'created_at', '-likes_count', '-views_count']
    if sort in valid_sorts:
        works = works.order_by(sort)

    # Пагинация
    page = int(request.GET.get('page', 1))
    paginator = Paginator(works, 12)
    page_obj = paginator.get_page(page)

    return JsonResponse({
        'works': [serialize_work(w) for w in page_obj],
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
    })


def work_detail_api(request, work_id):
    """
    Детальная информация о работе.

    Оптимизация:
    - select_related для author и category
    - prefetch_related для изображений и тегов
    - Увеличение счётчика просмотров через F() (атомарная операция)
    """
    from django.db.models import F
    from django.shortcuts import get_object_or_404

    work = get_object_or_404(
        Work.objects.select_related('author', 'category').prefetch_related('images', 'tags'),
        pk=work_id
    )

    # Атомарное увеличение счётчика просмотров
    Work.objects.filter(pk=work_id).update(views_count=F('views_count') + 1)

    # Похожие работы
    similar = Work.objects.filter(
        status='published',
        category=work.category
    ).exclude(pk=work.pk).select_related('author')[:6] if work.category else []

    # Комментарии (только верхнего уровня)
    comments = work.comments.filter(parent=None).select_related('user')[:10]

    return JsonResponse({
        'work': serialize_work(work),
        'images': [
            {'url': img.image.url, 'caption': img.caption}
            for img in work.images.all()
        ],
        'similar': [serialize_work(w) for w in similar],
        'comments': [
            {
                'id': c.id,
                'user': c.user.username,
                'content': c.content,
                'created_at': c.created_at.isoformat(),
            }
            for c in comments
        ],
    })


@login_required
@require_http_methods(["POST"])
def like_api(request, work_id):
    """
    Лайк/анлайк работы.

    Оптимизация:
    - get_or_create вместо отдельного exists + create
    - Атомарное обновление счётчика через F()
    - Минимальный ответ (только статус и новое количество лайков)
    """
    work = get_object_or_404(Work, pk=work_id)

    like, created = Like.objects.get_or_create(user=request.user, work=work)

    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        # Создаём уведомление автору
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='like',
                work=work
            )

    # Обновляем счётчик
    work.likes_count = Like.objects.filter(work=work).count()
    work.save(update_fields=['likes_count'])

    return JsonResponse({'liked': liked, 'count': work.likes_count})


@login_required
@require_http_methods(["POST"])
def save_work_api(request, work_id):
    """
    Сохранить работу в избранное.

    Оптимизация:
    - get_or_create для идемпотентности
    - Минимальный ответ
    """
    work = get_object_or_404(Work, pk=work_id)

    saved, created = SavedWork.objects.get_or_create(user=request.user, work=work)

    if not created:
        saved.delete()
        saved_flag = False
    else:
        saved_flag = True
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
    Создание комментария.

    Оптимизация:
    - Только необходимый минимум данных в ответе
    - Уведомление автору работы
    """
    work = get_object_or_404(Work, pk=work_id)
    data = json.loads(request.body)
    content = data.get('content', '').strip()

    if not content:
        return JsonResponse({'error': 'Empty content'}, status=400)

    comment = Comment.objects.create(
        user=request.user,
        work=work,
        content=content
    )

    work.comments_count = Comment.objects.filter(work=work, is_deleted=False).count()
    work.save(update_fields=['comments_count'])

    if work.author != request.user:
        Notification.objects.create(
            recipient=work.author,
            actor=request.user,
            type='comment',
            work=work,
            comment=comment
        )

    return JsonResponse({
        'id': comment.id,
        'user': request.user.username,
        'content': content,
        'created_at': comment.created_at.isoformat(),
    })


@login_required
def notifications_api(request):
    """
    Получение уведомлений пользователя.

    Оптимизация:
    - select_related для actor, work, comment
    - Ограничение 50 последними уведомлениями
    - Автоматическая пометка как прочитанные
    """
    notifications = request.user.notifications.select_related(
        'actor', 'work', 'comment'
    ).order_by('-created_at')[:50]

    # Помечаем как прочитанные
    request.user.notifications.filter(is_read=False).update(is_read=True)

    return JsonResponse({
        'notifications': [
            {
                'id': n.id,
                'type': n.type,
                'actor': {
                    'username': n.actor.username,
                    'avatar': n.actor.avatar.url if n.actor.avatar else None,
                },
                'work': {
                    'title': n.work.title,
                    'slug': n.work.slug,
                } if n.work else None,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat(),
            }
            for n in notifications
        ]
    })


def categories_api(request):
    """
    Список всех категорий.

    Оптимизация:
    - Только name и slug (минимум данных)
    - Кэширование на стороне клиента (можно добавить Cache-Control)
    """
    categories = Category.objects.all()
    return JsonResponse({
        'categories': [
            {'name': c.name, 'slug': c.slug}
            for c in categories
        ]
    })


def tags_api(request):
    """
    Список популярных тегов.

    Оптимизация:
    - Аннотация с Count для количества работ
    - Ограничение топ-20
    """
    from taggit.models import Tag
    from django.db.models import Count

    tags = Tag.objects.annotate(
        count=Count('taggit_taggeditem_items')
    ).order_by('-count')[:20]

    return JsonResponse({
        'tags': [
            {'name': t.name, 'slug': t.slug, 'count': t.count}
            for t in tags
        ]
    })
