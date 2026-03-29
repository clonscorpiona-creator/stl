from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, F
from django.core.paginator import Paginator
from django.utils import timezone
from .models import Work, Category, Collection
from taggit.models import Tag

User = get_user_model()


def spa_view(request):
    """
    SPA (Single Page Application) view.

    Загружает минимальный HTML шаблон, весь контент подгружается
    динамически через API calls на JavaScript.

    Оптимизация:
    - Минимальный начальный HTML
    - Асинхронная загрузка данных
    - Lazy loading изображений через Intersection Observer
    - CSS Grid для адаптивной раскладки без медиа-запросов
    """
    return render(request, 'core/spa.html')


def home_view(request):
    """Главная страница"""
    # Обычные пользователи не видят заблокированные работы, администрация видит все
    if request.user.is_staff:
        works = Work.objects.filter(status='published').select_related('author', 'category')[:12]
    else:
        works = Work.objects.filter(status='published', is_blocked=False).select_related('author', 'category')[:12]
    categories = Category.objects.all()
    return render(request, 'core/home.html', {'works': works, 'categories': categories})


@login_required
def feed_view(request):
    """Лента новостей - работы подписок и рекомендации"""
    # Работы авторов, на которых подписан пользователь
    following_ids = request.user.following.values_list('following_id', flat=True)
    # Обычные пользователи не видят заблокированные работы, администрация видит все
    if request.user.is_staff:
        following_works = Work.objects.filter(
            status='published',
            author_id__in=following_ids
        ).select_related('author', 'category').order_by('-created_at')[:20]

        # Рекомендации (популярные работы)
        recommended = Work.objects.filter(
            status='published'
        ).exclude(author=request.user).annotate(
            score=F('likes_count') + F('views_count') * 0.5
        ).order_by('-score', '-created_at')[:10]
    else:
        following_works = Work.objects.filter(
            status='published',
            is_blocked=False,
            author_id__in=following_ids
        ).select_related('author', 'category').order_by('-created_at')[:20]

        # Рекомендации (популярные работы)
        recommended = Work.objects.filter(
            status='published',
            is_blocked=False
        ).exclude(author=request.user).annotate(
            score=F('likes_count') + F('views_count') * 0.5
        ).order_by('-score', '-created_at')[:10]

    # Категории для фильтра
    categories = Category.objects.all()

    context = {
        'following_works': following_works,
        'recommended': recommended,
        'categories': categories,
    }
    return render(request, 'core/feed.html', context)


def work_list_view(request):
    """Список всех работ с фильтрами"""
    # Обычные пользователи не видят заблокированные работы, администрация видит все
    if request.user.is_staff:
        works = Work.objects.filter(status='published').select_related('author', 'category')
    else:
        works = Work.objects.filter(status='published', is_blocked=False).select_related('author', 'category')

    # Фильтры
    category_slug = request.GET.get('category')
    tag_slug = request.GET.get('tag')
    sort = request.GET.get('sort', '-created_at')
    query = request.GET.get('q', '')

    if category_slug:
        works = works.filter(category__slug=category_slug)

    if tag_slug:
        works = works.filter(tags__slug=tag_slug)

    if query:
        works = works.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(author__username__icontains=query) |
            Q(author__first_name__icontains=query) |
            Q(author__last_name__icontains=query)
        )

    # Сортировка
    valid_sorts = ['-created_at', 'created_at', '-likes_count', '-views_count', '-published_at']
    if sort in valid_sorts:
        works = works.order_by(sort)

    # Пагинация
    paginator = Paginator(works, 12)
    page = request.GET.get('page')
    works = paginator.get_page(page)

    # Теги для облака
    popular_tags = Tag.objects.annotate(
        count=Count('taggit_taggeditem_items')
    ).order_by('-count')[:20]

    categories = Category.objects.all()

    context = {
        'works': works,
        'categories': categories,
        'popular_tags': popular_tags,
        'current_category': category_slug,
        'current_tag': tag_slug,
        'current_sort': sort,
        'query': query,
    }
    return render(request, 'core/work_list.html', context)


def work_detail_view(request, username, slug):
    """Страница работы"""
    work = get_object_or_404(
        Work.objects.select_related('author', 'category').prefetch_related('tags', 'images'),
        slug=slug,
        author__username=username
    )

    # Проверка доступа: заблокированные работы видны только администрации и автору
    if work.is_blocked and not request.user.is_staff and request.user != work.author:
        return redirect('core:feed')

    # Увеличиваем счётчик просмотров
    work.views_count += 1
    work.save(update_fields=['views_count'])

    # Похожие работы (не показываем заблокированные)
    if request.user.is_staff:
        similar_works = Work.objects.filter(
            status='published',
            category=work.category
        ).exclude(pk=work.pk).select_related('author')[:6]
    else:
        similar_works = Work.objects.filter(
            status='published',
            is_blocked=False,
            category=work.category
        ).exclude(pk=work.pk).select_related('author')[:6]

    # Комментарии
    comments = work.comments.filter(parent=None).select_related('user')

    # Проверка лайка
    is_liked = False
    is_saved = False
    if request.user.is_authenticated:
        is_liked = work.likes.filter(user=request.user).exists()
        is_saved = work.saved_by.filter(user=request.user).exists()

    context = {
        'work': work,
        'similar_works': similar_works,
        'comments': comments,
        'is_liked': is_liked,
        'is_saved': is_saved,
    }
    return render(request, 'core/work_detail.html', context)


@login_required
def create_work(request):
    """Создание работы"""
    from .image_utils import apply_watermark_to_image
    from django.utils.text import slugify

    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        category_id = request.POST.get('category')
        tags = request.POST.get('tags', '')
        apply_watermark = request.POST.get('apply_watermark') == 'on'
        cover_index = request.POST.get('cover_index', '0')  # Индекс изображения для обложки

        # Отладка: проверяем параметр водяного знака
        print(f"DEBUG: apply_watermark = {apply_watermark}, POST value = {request.POST.get('apply_watermark')}")

        # Генерируем slug из заголовка
        base_slug = slugify(title)
        if not base_slug:
            # Fallback для нелатинских заголовков (кириллица и др.)
            base_slug = f'work-{timezone.now().timestamp()}'
        slug = base_slug
        counter = 1
        # Проверяем уникальность slug для данного автора
        while Work.objects.filter(slug=slug, author=request.user).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        work = Work.objects.create(
            author=request.user,
            title=title,
            description=description,
            category_id=category_id,
            slug=slug,
            status='published'  # Сразу публикуем работу
        )

        # Теги
        if tags:
            work.tags.add(*[t.strip() for t in tags.split(',')])

        # Получаем все изображения
        images = request.FILES.getlist('images')

        if images:
            # Обрабатываем все изображения
            processed_images = []
            for i, img in enumerate(images):
                if apply_watermark:
                    img = apply_watermark_to_image(img, request.user.username, apply_watermark_flag=True)
                else:
                    img = apply_watermark_to_image(img, request.user.username, apply_watermark_flag=False)
                processed_images.append(img)

            # Устанавливаем обложку из выбранного изображения
            try:
                cover_idx = int(cover_index)
                if 0 <= cover_idx < len(processed_images):
                    work.cover = processed_images[cover_idx]
                    work.save()
                    # Сохраняем остальные изображения
                    for i, img in enumerate(processed_images):
                        if i != cover_idx:
                            work.images.create(image=img, order=i if i < cover_idx else i-1)
                else:
                    # Если индекс вне диапазона, берём первое изображение как обложку
                    work.cover = processed_images[0]
                    work.save()
                    for i, img in enumerate(processed_images[1:], 1):
                        work.images.create(image=img, order=i-1)
            except (ValueError, IndexError):
                # По умолчанию первое изображение - обложка
                work.cover = processed_images[0]
                work.save()
                for i, img in enumerate(processed_images[1:], 1):
                    work.images.create(image=img, order=i-1)

        # Видео (без водяного знака, т.к. требуется отдельная обработка)
        videos = request.FILES.getlist('videos')
        for i, video in enumerate(videos):
            work.videos.create(video=video, order=i)

        # Проверяем, это AJAX запрос
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        is_json = 'application/json' in request.headers.get('Accept', '')

        if is_ajax or is_json:
            from django.http import JsonResponse
            return JsonResponse({
                'success': True,
                'redirect_url': work.get_absolute_url()
            })

        return redirect('core:work_detail', username=request.user.username, slug=work.slug)

    categories = Category.objects.all()
    return render(request, 'core/work_form.html', {'categories': categories, 'editing': False, 'work': None})


@login_required
def edit_work(request, username, slug):
    """Редактирование работы (доступно автору и администрации)"""
    from .image_utils import apply_watermark_to_image

    work = get_object_or_404(
        Work.objects.select_related('author'),
        slug=slug,
        author__username=username
    )

    # Проверка прав: автор или администрация
    if work.author != request.user and not request.user.is_staff:
        return redirect('core:work_detail', username=username, slug=slug)

    if request.method == 'POST':
        apply_watermark = request.POST.get('apply_watermark') == 'on'
        cover_index = request.POST.get('cover_index', '0')

        work.title = request.POST.get('title', work.title)
        work.description = request.POST.get('description', work.description)

        # Обработка категории (может быть пустой)
        category_id = request.POST.get('category')
        work.category_id = category_id if category_id else None

        tags = request.POST.get('tags', '')

        work.tags.clear()
        if tags:
            work.tags.add(*[t.strip() for t in tags.split(',')])

        # Получаем все изображения
        images = request.FILES.getlist('images')

        if images:
            # Обрабатываем все изображения
            processed_images = []
            for i, img in enumerate(images):
                if apply_watermark:
                    img = apply_watermark_to_image(img, request.user.username, apply_watermark_flag=True)
                else:
                    img = apply_watermark_to_image(img, request.user.username, apply_watermark_flag=False)
                processed_images.append(img)

            # Устанавливаем обложку из выбранного изображения
            try:
                cover_idx = int(cover_index)
                if 0 <= cover_idx < len(processed_images):
                    work.cover = processed_images[cover_idx]
                    work.save()
                    # Сохраняем остальные изображения
                    for i, img in enumerate(processed_images):
                        if i != cover_idx:
                            work.images.create(image=img, order=i if i < cover_idx else i-1)
                else:
                    # Если индекс вне диапазона, оставляем текущую обложку или берём первую
                    if not work.cover:
                        work.cover = processed_images[0]
                        work.save()
                    for i, img in enumerate(processed_images[1:], 1):
                        work.images.create(image=img, order=i-1)
            except (ValueError, IndexError):
                if not work.cover:
                    work.cover = processed_images[0]
                    work.save()
                for i, img in enumerate(processed_images[1:], 1):
                    work.images.create(image=img, order=i-1)

        # Видео
        videos = request.FILES.getlist('videos')
        for i, video in enumerate(videos):
            work.videos.create(video=video, order=work.videos.count())

        # Удаление видео
        delete_video_ids = request.POST.getlist('delete_videos')
        if delete_video_ids:
            work.videos.filter(id__in=delete_video_ids).delete()

        # Принудительная генерация slug если он некорректный
        if not work.slug or work.slug == '-1':
            from django.utils.text import slugify
            base_slug = slugify(work.title)
            slug = base_slug
            counter = 1
            while Work.objects.filter(slug=slug, author=work.author).exclude(pk=work.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            work.slug = slug

        work.save()
        return redirect('core:work_detail', username=username, slug=work.slug)

    categories = Category.objects.all()
    return render(request, 'core/work_form.html', {
        'work': work,
        'categories': categories,
        'editing': True
    })


@login_required
def delete_work(request, username, slug):
    """Удаление работы (доступно автору и администрации)"""
    work = get_object_or_404(Work, slug=slug)

    # Проверка прав: автор или администрация
    if work.author != request.user and not request.user.is_staff:
        return redirect('core:work_detail', username=username, slug=slug)

    work.delete()
    return redirect('accounts:profile', username=username)


def tag_list_view(request):
    """Список всех тегов"""
    tags = Tag.objects.annotate(
        count=Count('taggit_taggeditem_items')
    ).order_by('-count')
    return render(request, 'core/tag_list.html', {'tags': tags})


def tag_detail_view(request, slug):
    """Страница тега"""
    tag = get_object_or_404(Tag, slug=slug)
    works = Work.objects.filter(status='published', tags=tag).select_related('author')

    paginator = Paginator(works, 12)
    page = request.GET.get('page')
    works = paginator.get_page(page)

    return render(request, 'core/tag_detail.html', {'tag': tag, 'works': works})


@login_required
def collection_list(request):
    """Мои подборки"""
    collections = request.user.collections.all()
    return render(request, 'core/collection_list.html', {'collections': collections})


@login_required
def collection_create(request):
    """Создание подборки"""
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        is_public = request.POST.get('is_public') == 'on'

        collection = Collection.objects.create(
            author=request.user,
            title=title,
            description=description,
            is_public=is_public
        )

        if 'cover' in request.FILES:
            collection.cover = request.FILES['cover']
            collection.save()

        return redirect('core:collection_detail', username=request.user.username, slug=collection.slug)

    return render(request, 'core/collection_form.html', {'editing': False})


def collection_detail_view(request, username, slug):
    """Страница подборки"""
    collection = get_object_or_404(
        Collection.objects.select_related('author'),
        slug=slug,
        author__username=username
    )

    # Проверка доступа
    if not collection.is_public and collection.author != request.user:
        return redirect('core:feed')

    items = collection.items.select_related('work__author').order_by('-added_at')

    is_owner = request.user == collection.author

    context = {
        'collection': collection,
        'items': items,
        'is_owner': is_owner,
    }
    return render(request, 'core/collection_detail.html', context)


@login_required
def collection_add_work(request, collection_slug, work_id):
    """Добавить работу в подборку"""
    collection = get_object_or_404(Collection, slug=collection_slug, author=request.user)
    work = get_object_or_404(Work, pk=work_id)

    collection.items.get_or_create(work=work)
    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
def collection_remove_work(request, collection_slug, work_id):
    """Удалить работу из подборки"""
    collection = get_object_or_404(Collection, slug=collection_slug, author=request.user)
    collection.items.filter(work_id=work_id).delete()
    return redirect('core:collection_detail', username=request.user.username, slug=collection_slug)


@login_required
def new_works_and_comments(request):
    """
    Страница "Новые работы и комментарии".

    Показывает новые работы из любимых категорий пользователя,
    а также новые комментарии к работам пользователя.

    Логика:
    - Если у пользователя нет любимых категорий - показываем пустую страницу
    - Получаем только любимые категории пользователя
    - Получаем работы из этих категорий, опубликованные после последнего просмотра
    - Получаем комментарии к работам пользователя за последнее время
    - После просмотра отмечаем категорию как просмотренную
    """
    from accounts.models import UserCategoryView, UserFavoriteCategory
    from interactions.models import Comment

    # Проверяем, есть ли у пользователя любимые категории
    user_has_favorites = UserFavoriteCategory.user_has_favorites(request.user)

    if not user_has_favorites:
        # У пользователя нет любимых категорий - показываем пустую страницу
        return render(request, 'core/new_works.html', {
            'new_works': [],
            'new_comments': [],
            'total_new_works': 0,
            'total_new_comments': 0,
            'no_favorites': True,
        })

    # Получаем ID любимых категорий
    favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)

    # Получаем настройки уведомлений для любимых категорий
    favorite_settings = UserFavoriteCategory.objects.filter(
        user=request.user,
        category_id__in=favorite_category_ids
    )

    # Получаем просмотры категорий только для любимых категорий
    category_views = UserCategoryView.objects.filter(
        user=request.user,
        category_id__in=favorite_category_ids
    ).select_related('category')

    # Получаем новые работы только из любимых категорий с уведомлением о новых работах
    new_works = []
    for view in category_views:
        # Проверяем, включено ли уведомление о новых работах для этой категории
        fav_setting = favorite_settings.filter(category_id=view.category_id).first()
        if not fav_setting or not fav_setting.notify_new_works:
            continue

        current_count = UserCategoryView.get_works_count(view.category)
        if current_count > view.works_count:
            # Есть новые работы в этой категории
            queryset = Work.objects.filter(
                status='published',
                category=view.category
            ).select_related('author', 'category').prefetch_related('tags').order_by('-created_at')

            # Берем только новые работы (примерно - последние N работ, где N = разница)
            diff = current_count - view.works_count
            queryset = queryset[:diff * 2]  # Берем с запасом

            for work in queryset:
                if work.created_at > view.updated_at:
                    new_works.append(work)

    # Сортируем по дате создания (новые первые)
    new_works = sorted(new_works, key=lambda w: w.created_at, reverse=True)

    # Получаем новые комментарии к работам пользователя
    user_works_ids = Work.objects.filter(author=request.user).values_list('id', flat=True)

    # Находим последний просмотр "всех категорий" (category=None)
    last_view = UserCategoryView.objects.filter(
        user=request.user,
        category__isnull=True
    ).first()

    if last_view:
        new_comments = Comment.objects.filter(
            work_id__in=user_works_ids,
            created_at__gt=last_view.updated_at
        ).select_related('user', 'work').order_by('-created_at')[:20]
    else:
        new_comments = Comment.objects.filter(
            work_id__in=user_works_ids
        ).select_related('user', 'work').order_by('-created_at')[:20]

    # Обновляем просмотр "всех категорий" после просмотра страницы
    UserCategoryView.update_view(request.user, None)

    # Обновляем просмотры всех любимых категорий, которые мы показали
    for view in category_views:
        view.works_count = UserCategoryView.get_works_count(view.category)
        view.save(update_fields=['works_count', 'updated_at'])

    context = {
        'new_works': new_works,
        'new_comments': new_comments,
        'total_new_works': len(new_works),
        'total_new_comments': new_comments.count(),
        'no_favorites': False,
    }

    return render(request, 'core/new_works.html', context)
