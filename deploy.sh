#!/bin/bash
# Скрипт деплоя для STL проекта
cd /var/www/stl

# Pull latest changes
git pull origin master

# Apply migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Restart Gunicorn
systemctl restart stl

echo "Deploy completed at $(date)"
