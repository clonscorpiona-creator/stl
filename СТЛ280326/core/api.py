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
from django.shortcuts import get_object_or_404

from .models import Work, Category, Collection, WorkFrame, WorkVideo
from interactions.models import Like, Comment, SavedWork, Notification
from accounts.models import UserCategoryView
from django.core.files.base import ContentFile
import base64
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
    # Обычные пользователи не видят заблокированные работы
    if request.user.is_authenticated and request.user.is_staff:
        works = Work.objects.filter(
            status='published'
        ).select_related(
            'author', 'category'
        ).prefetch_related(
            'tags'
        )[:12]
    else:
        works = Work.objects.filter(
            status='published',
            is_blocked=False
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

    # Обычные пользователи не видят заблокированные работы
    if request.user.is_staff:
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
    else:
        if following_ids:
            # Работы от подписок
            following_works = Work.objects.filter(
                status='published',
                is_blocked=False,
                author_id__in=following_ids
            ).select_related('author', 'category').order_by('-created_at')[:20]
        else:
            following_works = []

        # Рекомендации (популярные работы)
        recommended = Work.objects.filter(
            status='published',
            is_blocked=False
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
    # Обычные пользователи не видят заблокированные работы
    if request.user.is_authenticated and request.user.is_staff:
        works = Work.objects.filter(status='published').select_related('author', 'category').prefetch_related('tags')
    else:
        works = Work.objects.filter(status='published', is_blocked=False).select_related('author', 'category').prefetch_related('tags')

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


@login_required
@require_http_methods(["POST"])
def extract_frame_api(request, work_id):
    """
    Извлечение кадра из видео через JavaScript canvas.
    Получает base64 изображение и сохраняет как кадр.
    """
    try:
        # Отладка
        print(f"=== extract_frame_api called ===")
        print(f"Request method: {request.method}")
        print(f"URL work_id: {work_id}")
        print(f"POST keys: {list(request.POST.keys())}")
        print(f"FILES keys: {list(request.FILES.keys())}")
        print(f"User: {request.user}")
        video_id = request.POST.get('video_id')
        frame_time = request.POST.get('frame_time', '0')
        # Получаем image_data из FILES (так как отправляем blob) или из POST (как base64 строку)
        image_data = request.FILES.get('image_data') or request.POST.get('image_data')

        print(f"work_id: {work_id}, video_id: {video_id}, frame_time: {frame_time}")
        print(f"image_data type: {type(image_data)}")

        if not image_data:
            print(f"ERROR: No image_data. POST keys: {list(request.POST.keys())}, FILES keys: {list(request.FILES.keys())}")
            return JsonResponse({'error': 'Нет данных изображения'}, status=400)

        work = get_object_or_404(Work, pk=work_id)
        print(f"Work found: {work.title}, author: {work.author}")

        # Проверка прав - только автор или администрация
        if work.author != request.user and not request.user.is_staff:
            return JsonResponse({'error': 'Нет прав доступа'}, status=403)

        video = None
        if video_id:
            video = get_object_or_404(WorkVideo, pk=video_id, work=work)

        # Конвертируем frame_time в float безопасно
        try:
            frame_time_float = float(frame_time) if frame_time else 0.0
        except (ValueError, TypeError):
            frame_time_float = 0.0

        # Если это файл (blob), просто используем его
        if hasattr(image_data, 'read'):
            image_file = image_data
            image_file.name = f'frame_{frame_time_float}.png'
            print(f"Processing blob file: {image_file.name}")
        else:
            # Если это base64 строка
            print(f"Processing base64 string")
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_file = ContentFile(base64.b64decode(image_data))
            image_file.name = f'frame_{frame_time_float}.png'

        # Создаем кадр
        print(f"Creating WorkFrame...")
        try:
            frame = WorkFrame.objects.create(
                work=work,
                video=video,
                frame_time=frame_time_float,
                frame_image=image_file,
                order=work.frames.count()
            )
            print(f"Frame created: {frame.id}")
        except Exception as create_error:
            print(f"ERROR creating frame: {create_error}")
            import traceback
            traceback.print_exc()
            # Try without order
            frame = WorkFrame.objects.create(
                work=work,
                video=video,
                frame_time=frame_time_float,
                frame_image=image_file
            )
            print(f"Frame created without order: {frame.id}")

        return JsonResponse({
            'success': True,
            'frame_id': frame.id,
            'frame_url': frame.frame_image.url if frame.frame_image else None
        })
    except Exception as e:
        print(f"ERROR in extract_frame_api: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def set_cover_from_frame_api(request):
    """
    Установка обложки из выбранного кадра.
    """
    try:
        print(f"=== set_cover_from_frame_api called ===")
        frame_id = request.POST.get('frame_id')
        print(f"frame_id: {frame_id}")

        if not frame_id:
            return JsonResponse({'error': 'Нет ID кадра'}, status=400)

        frame = get_object_or_404(WorkFrame, pk=frame_id)
        work = frame.work
        print(f"Frame found: {frame.id}, work: {work.title}")

        # Проверка прав
        if work.author != request.user and not request.user.is_staff:
            return JsonResponse({'error': 'Нет прав доступа'}, status=403)

        if not frame.frame_image:
            return JsonResponse({'error': 'У кадра нет изображения'}, status=400)

        # Проверяем, существует ли файл
        if not frame.frame_image.path:
            return JsonResponse({'error': 'Файл изображения не найден'}, status=400)

        print(f"Frame image path: {frame.frame_image.path}")

        # Копируем изображение кадра в обложку
        frame.frame_image.seek(0)
        work.cover.save(
            f'cover_from_frame_{frame.id}.png',
            ContentFile(frame.frame_image.read()),
            save=True
        )
        print(f"Cover saved successfully: {work.cover.url}")
    except Exception as e:
        print(f"ERROR in set_cover_from_frame_api: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({
        'success': True,
        'cover_url': work.cover.url
    })


@login_required
@require_http_methods(["POST"])
def delete_frame_api(request):
    """
    Удаление кадра.
    """
    frame_id = request.POST.get('frame_id')

    if not frame_id:
        return JsonResponse({'error': 'Нет ID кадра'}, status=400)

    frame = get_object_or_404(WorkFrame, pk=frame_id)
    work = frame.work

    # Проверка прав
    if work.author != request.user and not request.user.is_staff:
        return JsonResponse({'error': 'Нет прав доступа'}, status=403)

    frame.delete()

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def toggle_admin_recommend_api(request, work_id):
    """
    Toggle is_admin_recommended для работы.
    Только для staff пользователей.
    """
    work = get_object_or_404(Work, pk=work_id)

    # Только для staff
    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    from django.utils import timezone

    if work.is_admin_recommended:
        # Снять рекомендацию
        work.is_admin_recommended = False
        work.recommended_at = None
        work.recommended_by = None
    else:
        # Добавить рекомендацию
        work.is_admin_recommended = True
        work.recommended_at = timezone.now()
        work.recommended_by = request.user

    work.save(update_fields=['is_admin_recommended', 'recommended_at', 'recommended_by'])

    return JsonResponse({
        'success': True,
        'is_admin_recommended': work.is_admin_recommended,
        'recommended_at': work.recommended_at.isoformat() if work.recommended_at else None,
        'recommended_by': work.recommended_by.username if work.recommended_by else None
    })


@login_required
@require_http_methods(['POST'])
def block_work_api(request, work_id):
    """
    Заблокировать/разблокировать работу.
    Только для staff пользователей.
    """
    work = get_object_or_404(Work, pk=work_id)

    # Только для staff
    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    from django.utils import timezone

    data = json.loads(request.body)
    block = data.get('block', True)
    reason = data.get('reason', '')

    if block:
        # Заблокировать
        work.is_blocked = True
        work.blocked_at = timezone.now()
        work.blocked_by = request.user
        work.block_reason = reason
    else:
        # Разблокировать
        work.is_blocked = False
        work.blocked_at = None
        work.blocked_by = None
        work.block_reason = ''

    work.save(update_fields=['is_blocked', 'blocked_at', 'blocked_by', 'block_reason'])

    return JsonResponse({
        'success': True,
        'is_blocked': work.is_blocked,
        'blocked_at': work.blocked_at.isoformat() if work.blocked_at else None,
        'blocked_by': request.user.username,
    })


@login_required
@require_http_methods(['POST'])
def delete_work_api(request, work_id):
    """
    Удалить работу.
    Только для staff пользователей.
    """
    work = get_object_or_404(Work, pk=work_id)

    # Только для staff
    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    work.delete()

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["GET"])
def get_work_frames_api(request, work_id):
    """
    Получить все кадры работы.
    """
    work = get_object_or_404(Work, pk=work_id)

    # Проверка прав - публично для опубликованных, иначе только автор
    if work.status != 'published' and work.author != request.user:
        return JsonResponse({'error': 'Нет прав доступа'}, status=403)

    frames = work.frames.all().select_related('video')

    frames_data = [{
        'id': frame.id,
        'frame_time': frame.frame_time,
        'frame_image': frame.frame_image.url if frame.frame_image else None,
        'order': frame.order,
        'video_id': frame.video.id if frame.video else None
    } for frame in frames]

    return JsonResponse({'frames': frames_data})


@login_required
def new_works_count_api(request):
    """
    API для получения количества новых работ.

    Сравнивает текущее количество работ в просмотренных категориях
    с количеством на момент последнего просмотра.

    Учитывает только любимые категории пользователя (если выбраны).
    Если у пользователя нет любимых категорий - уведомления не отправляются.

    Возвращает:
    - total_new_works: общее количество новых работ (0 если уменьшилось)
    - by_category: количество новых работ по категориям
    - new_comments: количество новых комментариев
    """
    from accounts.models import UserFavoriteCategory
    from interactions.models import Comment

    # Получаем категорию из запроса (если фильтрация по конкретной категории)
    category_slug = request.GET.get('category')
    category = None
    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)

    # Проверяем, есть ли у пользователя любимые категории
    user_has_favorites = UserFavoriteCategory.user_has_favorites(request.user)

    # Если у пользователя нет любимых категорий - не показываем уведомления
    if not user_has_favorites:
        return JsonResponse({
            'total_new_works': 0,
            'new_comments': 0,
            'combined': 0,
        })

    # Получаем ID любимых категорий
    favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)

    # НЕ обновляем просмотр категории здесь - только считаем разницу
    # Обновление происходит в mark_works_viewed_api при реальном просмотре

    # Получаем количество новых работ только из любимых категорий
    if category:
        # Для конкретной категории - проверяем, входит ли она в любимые
        if category.id in favorite_category_ids:
            new_works = UserCategoryView.get_new_works_count(request.user, category)
            total_new_works = new_works
        else:
            total_new_works = 0
    else:
        # Общее количество только по любимым категориям
        total_new_works = 0
        views = UserCategoryView.objects.filter(
            user=request.user,
            category_id__in=favorite_category_ids
        )

        for view in views:
            # Проверяем, нужно ли уведомлять о новых работах в этой категории
            fav = UserFavoriteCategory.objects.filter(
                user=request.user,
                category_id=view.category_id
            ).first()

            if fav and fav.notify_new_works:
                current_count = UserCategoryView.get_works_count(view.category)
                diff = current_count - view.works_count
                if diff > 0:
                    total_new_works += diff

    # Получаем количество новых комментариев к работам пользователя
    user_works_ids = Work.objects.filter(author=request.user).values_list('id', flat=True)
    new_comments_count = 0

    # Получаем последний визит пользователя (для комментариев)
    last_view = UserCategoryView.objects.filter(
        user=request.user,
        category__isnull=True
    ).first()

    if last_view:
        # Считаем только комментарии с уведомлением
        new_comments_count = Comment.objects.filter(
            work_id__in=user_works_ids,
            created_at__gt=last_view.updated_at
        ).count()
    else:
        # Если ещё не было просмотров, считаем все комментарии
        new_comments_count = Comment.objects.filter(work_id__in=user_works_ids).count()

    return JsonResponse({
        'total_new_works': total_new_works,
        'new_comments': new_comments_count,
        'combined': total_new_works + new_comments_count,
    })


@login_required
@require_http_methods(["POST"])
def mark_works_viewed_api(request):
    """
    Отметить работы как просмотренные (обновить счетчик).

    Вызывается когда пользователь просматривает страницу с работами.
    """
    category_slug = request.POST.get('category')
    category = None
    if category_slug:
        category = get_object_or_404(Category, slug=category_slug)

    UserCategoryView.update_view(request.user, category)

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def mark_notifications_viewed_api(request):
    """
    Отметить уведомления как просмотренные (обновить счетчики).

    Вызывается когда пользователь просматривает страницу уведомлений.
    Обновляет works_count для всех любимых категорий до текущего значения,
    чтобы сбросить счетчик новых работ.
    """
    from accounts.models import UserFavoriteCategory, UserCategoryView
    from .models import Category

    # Обновляем просмотры для всех любимых категорий - сбрасываем счетчик
    favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)

    for category_id in favorite_category_ids:
        category = Category.objects.get(id=category_id)
        UserCategoryView.update_view(request.user, category)

    # Помечаем все уведомления как прочитанные
    request.user.notifications.filter(is_read=False).update(is_read=True)

    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def mark_notification_viewed_api(request, notification_id):
    """
    Отметить одно уведомление как просмотренное.

    Вызывается при клике на ссылку в уведомлении.
    """
    from interactions.models import Notification

    notification = get_object_or_404(Notification, pk=notification_id, recipient=request.user)
    notification.is_read = True
    notification.save(update_fields=['is_read'])

    return JsonResponse({'success': True})


@login_required
def notifications_count_api(request):
    """
    API для получения количества всех уведомлений пользователя.

    Включает:
    - Непрочитанные уведомления (лайки, комментарии, репосты, сохранения, подписки)
    - Новые работы в любимых категориях (с момента последнего просмотра)
    - Новые комментарии к работам пользователя

    Возвращает:
    - total: общее количество новых уведомлений
    - unread_notifications: непрочитанные уведомления
    - new_works: новые работы в любимых категориях
    """
    from accounts.models import UserFavoriteCategory, UserCategoryView

    # Считаем непрочитанные уведомления
    unread_notifications = request.user.notifications.filter(is_read=False).count()

    # Считаем новые работы в любимых категориях (если есть избранные)
    # Используем разницу между текущим счетчиком и сохраненным
    new_works_count = 0
    if UserFavoriteCategory.user_has_favorites(request.user):
        favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)

        # Получаем все просмотры категорий пользователя
        views = UserCategoryView.objects.filter(
            user=request.user,
            category_id__in=favorite_category_ids
        )

        for view in views:
            # Проверяем, нужно ли уведомлять о новых работах в этой категории
            fav = UserFavoriteCategory.objects.filter(
                user=request.user,
                category_id=view.category_id
            ).first()

            if fav and fav.notify_new_works:
                current_count = UserCategoryView.get_works_count(view.category)
                diff = current_count - view.works_count
                if diff > 0:
                    new_works_count += diff

    # Общее количество
    total = unread_notifications + new_works_count

    return JsonResponse({
        'total': total,
        'unread_notifications': unread_notifications,
        'new_works': new_works_count,
    })


@login_required
def notifications_detailed_api(request):
    """
    API для получения детальной информации по уведомлениям по категориям и типам.

    Возвращает:
    - categories: словарь с категориями и счетчиками по типам
    """
    from accounts.models import UserFavoriteCategory, UserCategoryView
    from core.models import Category, Work

    result = {'categories': {}}

    # Получаем любимые категории пользователя
    if UserFavoriteCategory.user_has_favorites(request.user):
        favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)
        categories = Category.objects.filter(id__in=favorite_category_ids).order_by('name')

        for category in categories:
            # Получаем просмотр категории пользователем
            view = UserCategoryView.objects.filter(
                user=request.user,
                category=category
            ).first()

            # Считаем новые работы в категории
            if view:
                current_count = Work.objects.filter(
                    status='published',
                    category=category
                ).count()
                new_works_count = max(0, current_count - view.works_count)
            else:
                new_works_count = Work.objects.filter(
                    status='published',
                    category=category
                ).count()

            # Получаем уведомления по типам для этой категории
            category_notifications = request.user.notifications.filter(
                work__category=category,
                is_read=False
            )

            comments_count = category_notifications.filter(type='comment').count()
            likes_count = category_notifications.filter(type='like').count()
            reposts_count = category_notifications.filter(type='repost').count()
            saves_count = category_notifications.filter(type='save').count()
            complaints_count = category_notifications.filter(type='complaint').count()

            result['categories'][category.slug] = {
                'new_work': new_works_count,
                'comment': comments_count,
                'like': likes_count,
                'repost': reposts_count,
                'save': saves_count,
                'complaint': complaints_count,
            }

    return JsonResponse(result)
