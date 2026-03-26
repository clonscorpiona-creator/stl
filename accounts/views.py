from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Profile, Follow

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
            return redirect('core:feed')
        return render(request, 'accounts/login.html', {'error': 'Неверное имя пользователя или пароль'})

    return render(request, 'accounts/login.html')


@login_required
def logout_view(request):
    """Выход пользователя"""
    logout(request)
    return redirect('core:home')


def profile_view(request, username):
    """Страница профиля пользователя"""
    user = get_object_or_404(User, username=username)
    profile = Profile.objects.filter(user=user).first()
    works = user.works.filter(status='published').order_by('-created_at')
    collections = user.collections.filter(is_public=True).order_by('-created_at')

    is_following = False
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=request.user, following=user).exists()

    context = {
        'profile_user': user,
        'profile': profile,
        'works': works,
        'collections': collections,
        'is_following': is_following,
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def follow_toggle(request, username):
    """Подписка/отписка от пользователя"""
    user = get_object_or_404(User, username=username)

    if user == request.user:
        return redirect('accounts:profile', username=username)

    follow, created = Follow.objects.get_or_create(
        follower=request.user,
        following=user
    )

    if not created:
        follow.delete()

    return redirect('accounts:profile', username=username)


@login_required
def edit_profile(request):
    """Редактирование профиля"""
    profile = Profile.objects.filter(user=request.user).first()

    if request.method == 'POST':
        request.user.first_name = request.POST.get('first_name', '')
        request.user.last_name = request.POST.get('last_name', '')
        request.user.email = request.POST.get('email', request.user.email)

        if profile:
            profile.display_name = request.POST.get('display_name', '')
            profile.bio = request.POST.get('bio', '')
            profile.website = request.POST.get('website', '')
            profile.location = request.POST.get('location', '')
            profile.save()

        if 'avatar' in request.FILES:
            request.user.avatar = request.FILES['avatar']
            request.user.save()

        return redirect('accounts:profile', username=request.user.username)

    return render(request, 'accounts/edit_profile.html', {'profile': profile})
