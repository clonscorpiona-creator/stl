from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from core.models import Work
from .models import Like, Comment, Repost, SavedWork, Notification

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
def repost_create(request, work_id):
    """Создание репоста"""
    work = get_object_or_404(Work, pk=work_id)

    repost, created = Repost.objects.get_or_create(user=request.user, work=work)

    if created:
        # Создаём уведомление
        if work.author != request.user:
            Notification.objects.create(
                recipient=work.author,
                actor=request.user,
                type='repost',
                work=work
            )

    return redirect('core:work_detail', username=work.author.username, slug=work.slug)


@login_required
@require_POST
def save_work(request, work_id):
    """Сохранить работу"""
    work = get_object_or_404(Work, pk=work_id)
    collection_id = request.POST.get('collection')

    saved, created = SavedWork.objects.get_or_create(user=request.user, work=work)

    if created:
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
    """Просмотр уведомлений"""
    notifications = request.user.notifications.select_related(
        'actor', 'work', 'comment'
    ).order_by('-created_at')[:50]

    # Помечаем как прочитанные
    request.user.notifications.filter(is_read=False).update(is_read=True)

    return render(request, 'interactions/notifications.html', {'notifications': notifications})
