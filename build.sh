#!/usr/bin/env bash
# Build script for Render

# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput --clear

# Run migrations
python manage.py migrate --noinput

# Create superuser if not exists (optional)
# python manage.py shell -c "from accounts.models import User; User.objects.filter(is_superuser=True).exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')"
