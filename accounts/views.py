import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Profile, Follow, Warning, ProfileWidget

User = get_user_model()


def register_view(request):
    """Регистрация пользователя.

    Первый зарегистрированный пользователь (ID=1) автоматически становится администратором.
    """
    if request.user.is_authenticated:
        return redirect('core:feed')

    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if User.objects.filter(username=username).exists():
            return render(request, 'accounts/register.html', {'error': 'Имя пользователя занято'})

        if User.objects.filter(email=email).exists():
            return render(request, 'accounts/register.html', {'error': 'Email уже зарегистрирован'})

        user = User.objects.create_user(username=username, email=email, password=password)

        # Первый пользователь (ID=1) становится администратором
        if user.id == 1:
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=['is_staff', 'is_superuser'])

        Profile.objects.create(user=user)
        login(request, user)
        return redirect('core:feed')

    return render(request, 'accounts/register.html')


def login_view(request):
    """Вход пользователя"""
    if request.user.is_authenticated:
        return redirect('core:feed')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            # Явно сохраняем сессию после login()
            request.session.save()
            return redirect('core:feed')
        return render(request, 'accounts/login.html', {'error': 'Неверное имя пользователя или пароль'})

    return render(request, 'accounts/login.html')


@login_required
def logout_view(request):
    """Выход пользователя"""
    logout(request)
    return redirect('core:home')


from urllib.parse import unquote
import os

def create_admin_view(request):
    """Временный эндпоинт для создания админа на сервере"""
    # Проверка секретного ключа для безопасности
    secret = os.environ.get('ADMIN_CREATE_SECRET', 'stl_secret_2026')
    if request.GET.get('key') != secret:
        return JsonResponse({'error': 'Access denied'}, status=403)

    try:
        # Проверяем, есть ли уже админ
        admin = User.objects.filter(is_superuser=True).first()
        if admin:
            return JsonResponse({
                'status': 'exists',
                'username': admin.username,
                'message': f'Админ уже существует: {admin.username}'
            })

        # Создаем админа
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@стл.art',
            password='StlAdmin2026!',
            is_staff=True,
            is_superuser=True
        )
        Profile.objects.create(user=admin_user)

        return JsonResponse({
            'status': 'created',
            'username': admin_user.username,
            'password': 'StlAdmin2026!',
            'message': 'Админ создан успешно'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def deploy_update_view(request):
    """Эндпоинт для обновления кода через git pull и создания админа"""
    secret = os.environ.get('ADMIN_CREATE_SECRET', 'stl_secret_2026')
    if request.GET.get('key') != secret:
        return JsonResponse({'error': 'Access denied'}, status=403)

    import subprocess

    result = {
        'git_pull': '',
        'migrate': '',
        'create_admin': '',
        'restart': ''
    }

    try:
        # Git pull
        proc = subprocess.run(
            ['git', 'pull', 'origin', 'master'],
            cwd='/var/www/stl',
            capture_output=True,
            text=True,
            timeout=60
        )
        result['git_pull'] = proc.stdout + proc.stderr

        # Migrate
        proc = subprocess.run(
            ['/var/www/stl/venv/bin/python', 'manage.py', 'migrate', '--noinput'],
            cwd='/var/www/stl',
            capture_output=True,
            text=True,
            timeout=60
        )
        result['migrate'] = proc.stdout + proc.stderr

        # Create admin
        proc = subprocess.run(
            ['/var/www/stl/venv/bin/python', 'manage.py', 'create_admin'],
            cwd='/var/www/stl',
            capture_output=True,
            text=True,
            timeout=30
        )
        result['create_admin'] = proc.stdout + proc.stderr

        return JsonResponse({
            'status': 'success',
            'result': result,
            'message': 'Обновление завершено. Админ: admin / StlAdmin2026!'
        })
    except subprocess.TimeoutExpired:
        return JsonResponse({'error': 'Command timed out'}, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def profile_view(request, username):
    """Страница профиля пользователя"""
    username = unquote(username)
    profile_user = get_object_or_404(User, username=username)
    profile, created = Profile.objects.get_or_create(user=profile_user)
    all_works = profile_user.works.filter(status='published').order_by('-created_at')
    collections = profile_user.collections.filter(is_public=True).order_by('-created_at')

    profile.followers_count = profile_user.followers.count()
    profile.following_count = profile_user.following.count()
    profile.works_count = all_works.count()
    profile.save(update_fields=['followers_count', 'following_count', 'works_count'])

    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=request.user, following=profile_user).exists()

    # Последние работы (макс. 5 для отображения)
    recent_works = list(all_works[:5])
    works_count = all_works.count()

    # Лучшая работа (по лайкам) — топ-3 для виджета
    best_works = list(all_works.order_by('-likes_count')[:3])

    # Подсчёт общих лайков и просмотров
    total_likes = sum(w.likes_count for w in all_works)
    total_views = sum(w.views_count for w in all_works)

    # Drafts — visible to owner and staff
    drafted_works = []
    can_view_drafts = (request.user == profile_user) or request.user.is_staff
    if can_view_drafts:
        drafted_works = list(profile_user.works.filter(status='draft').order_by('-created_at'))

    # Online статус (last_login < 15 мин назад)
    is_online = False
    if profile_user.last_login:
        is_online = (timezone.now() - profile_user.last_login).seconds < 900

    # Список инструментов
    tools_list = [t.strip() for t in profile.tools.split(',') if t.strip()] if profile.tools else []

    # Социальные сети
    social_links = {}
    if profile.social_links:
        try:
            social_links = json.loads(profile.social_links)
        except (json.JSONDecodeError, TypeError):
            social_links = {}

    # Видимые виджеты
    visible_widgets = {}
    widgets = ProfileWidget.objects.filter(profile=profile).order_by('sort_order')
    for w in widgets:
        visible_widgets[w.widget_type] = w.is_visible

    # Проекты пользователя
    user_projects = list(profile_user.projects.filter(status='published').order_by('-created_at')[:6])

    # Работы по категориям (для правой колонки)
    from core.models import Category
    works_by_category = {}
    for work in all_works:
        cat_name = work.category.name if work.category else 'Другое'
        cat_id = work.category.id if work.category else 0
        key = (cat_id, cat_name)
        if key not in works_by_category:
            works_by_category[key] = []
        works_by_category[key].append(work)
    # Sort by category name
    works_by_category = dict(sorted(works_by_category.items(), key=lambda x: x[0][1]))

    context = {
        'profile_user': profile_user,
        'profile': profile,
        'recent_works': recent_works,
        'published_works': list(all_works),
        'drafted_works': drafted_works,
        'top_work': best_works[0] if best_works else None,
        'best_works': best_works,
        'total_likes': total_likes,
        'total_views': total_views,
        'collections': collections,
        'is_following': is_following,
        'drafts': drafted_works if drafted_works else None,
        'works': list(all_works),
        'works_count': works_count,
        'is_online': is_online,
        'tools_list': tools_list,
        'social_links': social_links,
        'visible_widgets': visible_widgets,
        'user_projects': user_projects,
        'works_by_category': works_by_category,
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def follow_toggle(request, username):
    """Подписка/отписка от пользователя"""
    # Декодируем URL-кодированные символы (например, %20 -> пробел)
    username = unquote(username)
    user = get_object_or_404(User, username=username)

    if user == request.user:
        return redirect('accounts:profile', username=username)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user
    )

    if not created:
        follow.delete()
        # Уменьшаем счетчики
        user.profile.followers_count = max(0, user.profile.followers_count - 1)
        user.profile.save(update_fields=['followers_count'])
        request.user.profile.following_count = max(0, request.user.profile.following_count - 1)
        request.user.profile.save(update_fields=['following_count'])
    else:
        # Увеличиваем счетчики
        user.profile.followers_count += 1
        user.profile.save(update_fields=['followers_count'])
        request.user.profile.following_count += 1
        request.user.profile.save(update_fields=['following_count'])

    return redirect('accounts:profile', username=username)


def followers_list(request, username):
    """Список подписчиков пользователя"""
    username = unquote(username)
    user = get_object_or_404(User, username=username)

    followers = user.followers.select_related('follower__profile').all()

    context = {
        'profile_user': user,
        'followers': followers,
    }
    return render(request, 'accounts/followers_list.html', context)


def following_list(request, username):
    """Список подписок пользователя"""
    username = unquote(username)
    user = get_object_or_404(User, username=username)

    following = user.following.select_related('following__profile').all()

    context = {
        'profile_user': user,
        'following': following,
    }
    return render(request, 'accounts/following_list.html', context)


@login_required
def edit_profile(request):
    """Редактирование профиля"""
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        request.user.first_name = request.POST.get('first_name', '')
        request.user.last_name = request.POST.get('last_name', '')
        request.user.email = request.POST.get('email', request.user.email)
        request.user.bio = request.POST.get('bio', '') if request.POST.get('bio') else request.POST.get('user_bio', '')
        request.user.website = request.POST.get('website', '')
        request.user.location = request.POST.get('location', '')
        request.user.profession = request.POST.get('profession', '')
        request.user.cover_color = request.POST.get('cover_color', '#5a3f8a')
        dob = request.POST.get('date_of_birth', '')
        if dob:
            request.user.date_of_birth = dob
        else:
            request.user.date_of_birth = None
        request.user.show_dob = request.POST.get('show_dob') == 'on'
        if request.POST.get('bio'):
            profile.bio = request.POST.get('bio')

        profile.display_name = request.POST.get('display_name', '')
        profile.tools = request.POST.get('tools', '')
        profile.show_email = request.POST.get('show_email') == 'on'
        profile.show_badges = request.POST.get('show_badges') == 'on'
        profile.status = request.POST.get('status', '').strip()

        # Соцсети — собираем из отдельных полей
        social_links = {}
        for key in ['telegram', 'vk', 'instagram', 'youtube', 'rutube', 'behance', 'github']:
            val = request.POST.get(f'social_{key}', '').strip()
            if val:
                social_links[key] = val
        profile.social_links = json.dumps(social_links, ensure_ascii=False) if social_links else ''

        # Виджеты — видимость
        for widget_type in ['stats', 'skills', 'tools', 'social', 'best_works', 'projects', 'bio']:
            try:
                widget, _ = ProfileWidget.objects.get_or_create(profile=profile, widget_type=widget_type)
                widget.is_visible = f'widget_{widget_type}' in request.POST
                widget.save(update_fields=['is_visible'])
            except Exception:
                pass

        if 'avatar' in request.FILES:
            request.user.avatar = request.FILES['avatar']

        if request.POST.get('avatar_clear') == 'on' and not 'avatar' in request.FILES:
            request.user.avatar = ''

        if 'cover_image' in request.FILES:
            request.user.cover_image = request.FILES['cover_image']

        request.user.save()
        profile.save()
        return redirect('accounts:profile', username=request.user.username)

    # Подготовить соцсети для формы
    social_data = {}
    if profile.social_links:
        try:
            social_data = json.loads(profile.social_links)
        except (json.JSONDecodeError, TypeError):
            pass

    status_choices = [
        ('', '— Не выбрано —'),
        ('Пользователь', 'Пользователь'),
        ('Фрилансер', 'Фрилансер'),
        ('Моушен-дизайнер', 'Моушен-дизайнер'),
        ('Графический дизайнер', 'Графический дизайнер'),
        ('3D моделлер', '3D моделлер'),
        ('3D визуализатор', '3D визуализатор'),
        ('Web-дизайнер', 'Web-дизайнер'),
        ('UI/UX', 'UI/UX'),
        ('Иллюстратор', 'Иллюстратор'),
        ('Гейм-индустрия', 'Гейм-индустрия'),
        ('Видео-монтажер', 'Видео-монтажер'),
        ('Аниматор', 'Аниматор'),
        ('ИИ-технологии', 'ИИ-технологии'),
    ]

    return render(request, 'accounts/edit_profile.html', {
        'profile': profile,
        'social_data': social_data,
        'status_choices': status_choices,
    })


@login_required
@require_POST
def toggle_widget(request, widget_type):
    """AJAX вкл/выкл виджет"""
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'error': 'AJAX only'}, status=400)

    profile, _ = Profile.objects.get_or_create(user=request.user)
    valid_types = [t[0] for t in ProfileWidget.WIDGET_CHOICES]
    if widget_type not in valid_types:
        return JsonResponse({'error': 'Invalid widget type'}, status=400)

    widget, _ = ProfileWidget.objects.get_or_create(profile=profile, widget_type=widget_type)
    widget.is_visible = not widget.is_visible
    widget.save(update_fields=['is_visible'])

    return JsonResponse({'success': True, 'is_visible': widget.is_visible})


@login_required
@require_POST
def reorder_widgets(request):
    """AJAX переупорядочение виджетов"""
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'error': 'AJAX only'}, status=400)

    try:
        data = json.loads(request.body)
        order = data.get('order', [])
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    profile, _ = Profile.objects.get_or_create(user=request.user)
    for idx, widget_type in enumerate(order):
        try:
            widget = ProfileWidget.objects.get(profile=profile, widget_type=widget_type)
            widget.sort_order = idx
            widget.save(update_fields=['sort_order'])
        except ProfileWidget.DoesNotExist:
            pass

    return JsonResponse({'success': True})


@login_required
@require_POST
def give_warning(request, user_id):
    """
    Выдать предупреждение пользователю.
    Только для staff пользователей.
    Нельзя выдать предупреждение самому себе и администратору.
    """
    user = get_object_or_404(User, pk=user_id)

    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    if user == request.user:
        return JsonResponse({'error': 'Нельзя выдать предупреждение самому себе'}, status=400)

    if user.is_staff:
        return JsonResponse({'error': 'Администратору нельзя выдать предупреждение'}, status=400)

    reason = request.POST.get('reason', '').strip()
    work_id = request.POST.get('work_id')
    comment_id = request.POST.get('comment_id')
    is_yellow = request.POST.get('is_yellow', 'on') == 'on'  # По умолчанию желтое

    if not reason:
        return JsonResponse({'error': 'Укажите причину'}, status=400)

    work = None
    if work_id:
        from core.models import Work
        work = get_object_or_404(Work, pk=work_id)

    comment = None
    if comment_id:
        from interactions.models import Comment
        comment = get_object_or_404(Comment, pk=comment_id)

    warning = Warning.objects.create(
        user=user,
        moderator=request.user,
        reason=reason,
        is_yellow=is_yellow,
        work=work,
        comment=comment
    )

    # После сохранения warning_count обновляется автоматически в модели

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'warning_count': user.profile.warning_count,
            'is_banned': user.profile.is_banned
        })

    return redirect('accounts:profile', username=user.username)


@login_required
@require_POST
def remove_warning(request, warning_id):
    """
    Снять предупреждение.
    Только для staff пользователей.
    """
    warning = get_object_or_404(Warning, pk=warning_id)

    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    user = warning.user
    warning.delete()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'warning_count': user.profile.warning_count,
            'is_banned': user.profile.is_banned
        })

    return redirect('accounts:profile', username=user.username)


@login_required
@require_POST
def toggle_ban(request, user_id):
    """
    Забанить/разбанить пользователя.
    Только для staff пользователей.
    """
    user = get_object_or_404(User, pk=user_id)

    if not request.user.is_staff:
        return JsonResponse({'error': 'Требуется права администратора'}, status=403)

    reason = request.POST.get('reason', '').strip()

    if user.profile.is_banned:
        # Разбанить
        user.profile.is_banned = False
        user.profile.banned_at = None
        user.profile.banned_by = None
        user.profile.ban_reason = ''
        user.profile.save(update_fields=['is_banned', 'banned_at', 'banned_by', 'ban_reason'])
    else:
        # Забанить
        if not reason:
            return JsonResponse({'error': 'Укажите причину бана'}, status=400)

        user.profile.is_banned = True
        user.profile.banned_at = timezone.now()
        user.profile.banned_by = request.user
        user.profile.ban_reason = reason
        user.profile.save(update_fields=['is_banned', 'banned_at', 'banned_by', 'ban_reason'])

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'is_banned': user.profile.is_banned
        })

    return redirect('accounts:profile', username=user.username)


@login_required
def favorite_categories(request):
    """
    Управление любимыми категориями пользователя.

    Позволяет пользователю выбирать категории, на которые он хочет подписаться
    для получения уведомлений о новых работах и комментариях.
    """
    from core.models import Category
    from .models import UserFavoriteCategory

    if request.method == 'POST':
        # Получаем список выбранных категорий из POST запроса
        selected_category_ids = request.POST.getlist('categories')
        notify_works = request.POST.getlist('notify_works')
        notify_comments = request.POST.getlist('notify_comments')

        # Удаляем все текущие выбранные категории
        UserFavoriteCategory.objects.filter(user=request.user).delete()

        # Создаем новые записи для выбранных категорий
        for category_id in selected_category_ids:
            if category_id.isdigit():
                category_id = int(category_id)
                UserFavoriteCategory.objects.create(
                    user=request.user,
                    category_id=category_id,
                    notify_new_works=str(category_id) in notify_works,
                    notify_new_comments=str(category_id) in notify_comments
                )

        return redirect('accounts:favorite_categories')

    # Получаем все категории
    categories = Category.objects.all().order_by('name')

    # Получаем выбранные пользователем категории
    user_favorites = UserFavoriteCategory.objects.filter(user=request.user)
    selected_category_ids = set(user_favorites.values_list('category_id', flat=True))

    # Создаем словарь с настройками уведомлений для каждой категории
    favorite_settings = {}
    for fav in user_favorites:
        favorite_settings[fav.category_id] = {
            'notify_works': fav.notify_new_works,
            'notify_comments': fav.notify_new_comments
        }

    context = {
        'categories': categories,
        'selected_category_ids': selected_category_ids,
        'favorite_settings': favorite_settings,
    }

    return render(request, 'accounts/favorite_categories.html', context)


@login_required
def toggle_favorite_category(request, category_id):
    """
    Переключить статус любимой категории (AJAX endpoint).
    """
    from core.models import Category
    from .models import UserFavoriteCategory

    category = get_object_or_404(Category, pk=category_id)

    favorite, created = UserFavoriteCategory.objects.get_or_create(
        user=request.user,
        category=category
    )

    if not created:
        # Если уже была любимой, удаляем (отписываемся)
        favorite.delete()
        is_favorite = False
    else:
        is_favorite = True

    return JsonResponse({
        'success': True,
        'is_favorite': is_favorite,
        'category_name': category.name
    })


@login_required
def profile_test(request):
    """
    Тестовая страница профиля в стиле крафт.
    """
    profile, _ = Profile.objects.get_or_create(user=request.user)
    works = request.user.works.filter(status='published').order_by('-created_at')
    drafted_works = request.user.works.filter(status='draft').order_by('-created_at')
    total_likes = sum(w.likes_count for w in works)
    total_views = sum(w.views_count for w in works)
    top_work = works.first() if works else None
    recent_works = works[:5]

    context = {
        'page_title': 'Профиль (тест)',
        'profile_user': request.user,
        'profile': profile,
        'drafted_works': drafted_works,
        'total_likes': total_likes,
        'total_views': total_views,
        'top_work': top_work,
        'recent_works': recent_works,
        'test_data': {
            'message': 'Тестовая страница профиля',
            'timestamp': timezone.now(),
            'user': request.user.username,
        }
    }
    return render(request, 'accounts/profile_test.html', context)


@login_required
def portfolio_page(request, username=None):
    """
    Страница портфолио пользователя — категории-плитки + проекты.
    """
    if username is None:
        username = request.user.username

    user = get_object_or_404(User, username=username)
    profile, created = Profile.objects.get_or_create(user=user)
    works = user.works.filter(status='published').order_by('-created_at')
    is_owner = (request.user == user)

    # Категории, для которых есть работы
    from core.models import Category, Project

    # Категории, для которых есть работы
    category_cards = []
    categories = Category.objects.filter(works__author=user, works__status='published').distinct()
    for cat in categories:
        cat_works = works.filter(category=cat)
        top_work = cat_works.order_by('-likes_count').first()
        category_cards.append({'category': cat, 'top_work': top_work, 'count': cat_works.count()})

    # Проекты пользователя
    projects = user.projects.filter(status='published').order_by('-created_at')

    # --- Все проекты на сайте, сгруппированные по категориям ---
    project_cat_cards = []
    project_categories = Category.objects.filter(
        projects__status='published'
    ).distinct().order_by('name')
    for cat in project_categories:
        cat_projects = Project.objects.filter(status='published', category=cat).order_by('-created_at')
        if cat_projects.exists():
            project_cat_cards.append({
                'category': cat,
                'projects': list(cat_projects[:6]),
                'count': cat_projects.count(),
            })

    context = {
        'portfolio_user': user,
        'profile': profile,
        'is_owner': is_owner,
        'category_cards': category_cards,
        'projects': projects,
        'project_cat_cards': project_cat_cards,
    }
    return render(request, 'accounts/portfolio.html', context)


def user_projects(request, username=None):
    """Проекты конкретного пользователя"""
    from core.models import Category, Project

    if username is None:
        username = request.user.username

    user = get_object_or_404(User, username=username)
    profile, _ = Profile.objects.get_or_create(user=user)
    is_owner = (request.user == user)

    # Проекты этого пользователя, сгруппированные по категориям
    project_cat_cards = []
    project_categories = Category.objects.filter(
        projects__author=user, projects__status='published'
    ).distinct().order_by('name')
    for cat in project_categories:
        cat_projects = Project.objects.filter(status='published', category=cat, author=user).order_by('-created_at')
        if cat_projects.exists():
            project_cat_cards.append({
                'category': cat,
                'projects': list(cat_projects[:6]),
                'count': cat_projects.count(),
            })

    context = {
        'portfolio_user': user,
        'profile': profile,
        'is_owner': is_owner,
        'project_cat_cards': project_cat_cards,
    }
    return render(request, 'accounts/user_projects.html', context)


@login_required
def users_list(request):
    """Список всех зарегистрированных пользователей"""
    users = User.objects.filter(is_active=True).select_related('profile').order_by(
        '-date_joined'
    )
    query = request.GET.get('q', '')
    if query:
        users = users.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(profile__display_name__icontains=query)
        )
    return render(request, 'accounts/users_list.html', {'users': users, 'query': query})
