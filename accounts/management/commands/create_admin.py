from django.core.management.base import BaseCommand
from accounts.models import User, Profile


class Command(BaseCommand):
    help = 'Создает пользователя admin с правами суперпользователя'

    def handle(self, *args, **options):
        # Проверяем, есть ли уже админ
        admin = User.objects.filter(is_superuser=True).first()
        if admin:
            self.stdout.write(self.style.WARNING(
                f'Админ уже существует: {admin.username}'
            ))
            return

        # Создаем админа
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@стл.art',
            password='StlAdmin2026!',
            is_staff=True,
            is_superuser=True
        )
        Profile.objects.create(user=admin_user)

        self.stdout.write(self.style.SUCCESS(
            f'Админ создан: {admin_user.username}\n'
            f'Пароль: StlAdmin2026!'
        ))
