#!/bin/bash

# Render.com startup script for Django + Channels

set -e

echo "=== Starting Django application on Render ==="

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --verbosity 2

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput --verbosity 1

# Create superuser if not exists (optional, for first deploy)
# echo "Creating default superuser..."
# python manage.py shell -c "from accounts.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')"

# Start Daphne server
echo "Starting Daphne ASGI server on port $PORT..."
exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
