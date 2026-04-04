from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET

from core.models import Work, Project, ProjectComment, ProjectCommentLike
from .models import Like, Comment, Repost, SavedWork, Notification, CommentLike

User = get_user_model()


@login_required
@require_POST
def like_toggle(request, work_id):
    """Лайк/анлайк работы"""
    work = get_object_or_404(Work, pk=work_id)

    like, created = Like.objects.get_or_create(user=request.user, work=work)

    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        # Создаём уведомление
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='like',
                work=work
            )

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'liked': liked, 'count': work.likes_count})

    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
@require_POST
def comment_create(request, work_id):
    """Создание комментария"""
    work = get_object_or_404(Work, pk=work_id)
    content = request.POST.get('content', '').strip()

    if content:
        parent_id = request.POST.get('parent')
        parent = None
        if parent_id:
            parent = get_object_or_404(Comment, pk=parent_id)

        comment = Comment.objects.create(
            user=request.user,
            work=work,
            content=content,
            parent=parent
        )

        # Создаём уведомление
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='comment',
                work=work,
                comment=comment
            )

    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
@require_POST
def comment_delete(request, comment_id):
    """Удаление комментария"""
    comment = get_object_or_404(Comment, pk=comment_id)

    if comment.user == request.user or request.user.is_staff:
        comment.is_deleted = True
        comment.content = ''
        comment.save()

    return redirect('core:work_detail', username=comment.work.author.username, slug=comment.work.slug)


@login_required
@require_POST
def repost_toggle(request, work_id):
    """Репост/отмена репоста работы"""
    work = get_object_or_404(Work, pk=work_id)

    repost, created = Repost.objects.get_or_create(user=request.user, work=work)

    if not created:
        # Уже есть реост - удаляем (отменяем)
        repost.delete()
        reposted = False
    else:
        # Создаём уведомление
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='repost',
                work=work
            )
        reposted = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'reposted': reposted, 'count': work.reposts_count})

    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
@require_POST
def save_work_toggle(request, work_id):
    """Сохранить/убрать из сохранённых работу"""
    work = get_object_or_404(Work, pk=work_id)
    collection_id = request.POST.get('collection')

    saved, created = SavedWork.objects.get_or_create(user=request.user, work=work)

    if not created:
        # Уже сохранено - удаляем (отменяем)
        saved.delete()
        is_saved = False
    else:
        if collection_id:
            saved.collection_id = collection_id
            saved.save()

        # Создаём уведомление
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='save',
                work=work
            )
        is_saved = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'is_saved': is_saved, 'count': work.saves_count})

    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
@require_POST
def unsave_work(request, work_id):
    """Удалить из сохранённых"""
    work = get_object_or_404(Work, pk=work_id)
    SavedWork.objects.filter(user=request.user, work=work).delete()
    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
def notifications_view(request):
    """
    Просмотр уведомлений с группировкой по категориям.
    Или просмотр конкретных уведомлений по категории и типу.

    Для каждой любимой категории показывает:
    - Новые работы
    - Комментарии
    - Лайки
    - Репосты
    - Сохранения
    - Жалобы
    """
    from accounts.models import UserFavoriteCategory, UserCategoryView
    from core.models import Work, Category

    # Получаем любимые категории пользователя
    category_blocks = []

    if UserFavoriteCategory.user_has_favorites(request.user):
        favorite_category_ids = UserFavoriteCategory.get_user_favorite_category_ids(request.user)
        favorite_settings = UserFavoriteCategory.objects.filter(
            user=request.user,
            category_id__in=favorite_category_ids
        )

        # Получаем все любимые категории
        categories = Category.objects.filter(id__in=favorite_category_ids).order_by('name')

        for category in categories:
            fav = favorite_settings.filter(category_id=category.id).first()
            if not fav:
                continue

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
                work__category=category
            ).select_related('actor', 'work', 'comment')

            comments_count = category_notifications.filter(type='comment').count()
            likes_count = category_notifications.filter(type='like').count()
            reposts_count = category_notifications.filter(type='repost').count()
            saves_count = category_notifications.filter(type='save').count()
            complaints_count = category_notifications.filter(type='complaint').count()

            # Общий счетчик всех уведомлений в категории
            total_count = new_works_count + comments_count + likes_count + reposts_count + saves_count + complaints_count

            # Добавляем категорию всегда (даже если нет уведомлений)
            category_blocks.append({
                'category': category,
                'new_works_count': new_works_count,
                'comments_count': comments_count,
                'likes_count': likes_count,
                'reposts_count': reposts_count,
                'saves_count': saves_count,
                'complaints_count': complaints_count,
                'total_count': total_count,
            })

    # Сортируем: сначала категории с новыми работами, потом по имени
    category_blocks.sort(key=lambda x: (-x['new_works_count'], x['category'].name))

    return render(request, 'interactions/notifications.html', {
        'category_blocks': category_blocks,
    })


@login_required
def notifications_filtered_view(request, category_slug, notification_type):
    """
    Просмотр конкретных уведомлений по категории и типу.
    """
    from accounts.models import UserFavoriteCategory, UserCategoryView
    from core.models import Category, Work

    category = get_object_or_404(Category, slug=category_slug)

    # Получаем уведомления запрошенного типа для этой категории
    notifications = request.user.notifications.filter(
        type=notification_type,
        work__category=category
    ).select_related('actor', 'work', 'comment').order_by('-created_at')

    # Помечаем как прочитанные только эти уведомления
    notifications.filter(is_read=False).update(is_read=True)

    # Определяем заголовок и иконку по типу
    type_info = {
        'new_work': {'title': 'Новые работы', 'icon': '🎨'},
        'comment': {'title': 'Комментарии', 'icon': '💬'},
        'like': {'title': 'Лайки', 'icon': '❤️'},
        'repost': {'title': 'Репосты', 'icon': '🔁'},
        'save': {'title': 'Сохранения', 'icon': '🔖'},
        'complaint': {'title': 'Жалобы', 'icon': '⚠️'},
    }

    info = type_info.get(notification_type, {'title': 'Уведомления', 'icon': '🔔'})

    # Получаем новые работы если запрошен тип new_work
    works = []
    if notification_type == 'new_work':
        view = UserCategoryView.objects.filter(
            user=request.user,
            category=category
        ).first()

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

        # Обновляем просмотр категории
        UserCategoryView.update_view(request.user, category)

        works = Work.objects.filter(
            status='published',
            category=category
        ).select_related('author', 'category').order_by('-created_at')[:50]

    return render(request, 'interactions/notifications_filtered.html', {
        'category': category,
        'notification_type': notification_type,
        'notifications': notifications,
        'works': works,
        'type_info': info,
    })


@login_required
@require_POST
def comment_like_toggle(request, comment_id):
    """Лайк/анлайк комментария"""
    comment = get_object_or_404(Comment, pk=comment_id)

    like, created = CommentLike.objects.get_or_create(user=request.user, comment=comment)

    if not created:
        like.delete()
        liked = False
    else:
        liked = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'liked': liked, 'count': comment.likes_count})

    return redirect('core:work_detail', username=comment.work.author.username, slug=comment.work.slug)


@login_required
@require_POST
def comment_edit(request, comment_id):
    """Редактирование комментария (автор или staff)"""
    comment = get_object_or_404(Comment, pk=comment_id)

    if comment.user != request.user and not request.user.is_staff:
        return JsonResponse({'error': 'Нет прав'}, status=403)

    content = request.POST.get('content', '').strip()
    if content:
        comment.content = content
        comment.is_edited = True
        from django.utils import timezone
        comment.edited_at = timezone.now()
        comment.save(update_fields=['content', 'is_edited', 'edited_at'])

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'content': comment.content,
            'is_edited': comment.is_edited,
            'edited_at': comment.edited_at.isoformat() if comment.edited_at else None
        })

    return redirect('core:work_detail', username=comment.work.author.username, slug=comment.work.slug)


@login_required
@require_POST
def comment_delete_permanently(request, comment_id):
    """Полное удаление комментария (только автор или админ)"""
    comment = get_object_or_404(Comment, pk=comment_id)

    # Проверка прав: автор комментария или staff
    if request.user != comment.user and not request.user.is_staff:
        return JsonResponse({'error': 'Нет прав'}, status=403)

    comment.delete()

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True})

    return redirect('core:work_detail', username=comment.work.author.username, slug=comment.work.slug)


# ========================
# Project interaction views
# ========================

@login_required
@require_POST
def project_like_toggle(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    from core.models import ProjectLike
    like, created = ProjectLike.objects.get_or_create(user=request.user, project=project)
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'liked': liked, 'count': project.likes_count})
    return redirect('core:project_detail', username=project.author.username, slug=project.slug)


@login_required
@require_POST
def project_comment_create(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    content = request.POST.get('content', '').strip()
    if content:
        parent_id = request.POST.get('parent')
        parent = None
        if parent_id:
            parent = get_object_or_404(ProjectComment, pk=parent_id)
        ProjectComment.objects.create(
            user=request.user,
            project=project,
            content=content,
            parent=parent,
        )
    return redirect('core:project_detail', username=project.author.username, slug=project.slug)


@login_required
@require_POST
def project_comment_edit(request, comment_id):
    comment = get_object_or_404(ProjectComment, pk=comment_id)
    if comment.user != request.user and not request.user.is_staff:
        return JsonResponse({'error': 'Нет прав'}, status=403)
    content = request.POST.get('content', '').strip()
    if content:
        comment.content = content
        comment.is_edited = True
        comment.save(update_fields=['content', 'is_edited'])
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'success': True,
            'content': comment.content,
            'is_edited': comment.is_edited,
        })
    return redirect('core:project_detail', username=comment.project.author.username, slug=comment.project.slug)


@login_required
@require_POST
def project_comment_delete(request, comment_id):
    comment = get_object_or_404(ProjectComment, pk=comment_id)
    if comment.user == request.user or request.user.is_staff:
        comment.is_deleted = True
        comment.content = ''
        comment.save()
    return redirect('core:project_detail', username=comment.project.author.username, slug=comment.project.slug)


@login_required
@require_POST
def project_comment_like_toggle(request, comment_id):
    comment = get_object_or_404(ProjectComment, pk=comment_id)
    like, created = ProjectCommentLike.objects.get_or_create(user=request.user, comment=comment)
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'liked': liked, 'count': comment.likes_count})
    return redirect('core:project_detail', username=comment.project.author.username, slug=comment.project.slug)
