from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q, Count, F
from django.core.paginator import Paginator
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
    works = Work.objects.filter(status='published').select_related('author', 'category')[:12]
    categories = Category.objects.all()
    return render(request, 'core/home.html', {'works': works, 'categories': categories})


@login_required
def feed_view(request):
    """Лента новостей - работы подписок и рекомендации"""
    # Работы авторов, на которых подписан пользователь
    following_ids = request.user.following.values_list('following_id', flat=True)
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
    works = Work.objects.filter(status='published').select_related('author', 'category')

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

    # Увеличиваем счётчик просмотров
    work.views_count += 1
    work.save(update_fields=['views_count'])

    # Похожие работы
    similar_works = Work.objects.filter(
        status='published',
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
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        category_id = request.POST.get('category')
        tags = request.POST.get('tags', '')

        work = Work.objects.create(
            author=request.user,
            title=title,
            description=description,
            category_id=category_id,
            status='published'  # Сразу публикуем работу
        )

        # Теги
        if tags:
            work.tags.add(*[t.strip() for t in tags.split(',')])

        # Изображения
        images = request.FILES.getlist('images')
        for i, img in enumerate(images):
            work.images.create(image=img, order=i)

        # Обложка
        if 'cover' in request.FILES:
            work.cover = request.FILES['cover']
            work.save()

        return redirect('core:work_detail', username=request.user.username, slug=work.slug)

    categories = Category.objects.all()
    return render(request, 'core/work_form.html', {'categories': categories, 'editing': False})


@login_required
def edit_work(request, username, slug):
    """Редактирование работы"""
    work = get_object_or_404(Work, slug=slug, author=request.user)

    if request.method == 'POST':
        work.title = request.POST.get('title', work.title)
        work.description = request.POST.get('description', work.description)
        work.category_id = request.POST.get('category')
        tags = request.POST.get('tags', '')

        work.tags.clear()
        if tags:
            work.tags.add(*[t.strip() for t in tags.split(',')])

        if 'cover' in request.FILES:
            work.cover = request.FILES['cover']

        work.save()
        return redirect('core:work_detail', username=username, slug=slug)

    categories = Category.objects.all()
    return render(request, 'core/work_form.html', {
        'work': work,
        'categories': categories,
        'editing': True
    })


@login_required
def delete_work(request, username, slug):
    """Удаление работы"""
    work = get_object_or_404(Work, slug=slug, author=request.user)
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
