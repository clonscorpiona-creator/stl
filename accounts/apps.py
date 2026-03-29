from django.apps import AppConfig
import os


class AccountsConfig(AppConfig):
    name = 'accounts'

    def ready(self):
        # Создаем админа при первом запуске
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Проверяем, есть ли уже админ
        if not User.objects.filter(is_superuser=True).exists():
            try:
                from accounts.models import Profile
                admin_user = User.objects.create_user(
                    username='admin',
                    email='admin@стл.art',
                    password='StlAdmin2026!',
                    is_staff=True,
                    is_superuser=True
                )
                Profile.objects.create(user=admin_user)
                print(f"Админ создан: admin / StlAdmin2026!")
            except Exception as e:
                print(f"Ошибка создания админа: {e}")
