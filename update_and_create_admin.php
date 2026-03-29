<?php
/**
 * Скрипт для обновления кода и создания админа
 * Вызов: http://77.232.129.41/update_and_create_admin.php?key=stl_deploy_secret_2026
 */

$SECRET_KEY = 'stl_deploy_secret_2026';

if (!isset($_GET['key']) || $_GET['key'] !== $SECRET_KEY) {
    http_response_code(403);
    die('Access denied');
}

header('Content-Type: text/plain; charset=utf-8');
$output = [];
$return_code = 0;

echo "=== STL Update & Create Admin ===\n\n";

// Git pull
echo "1. Git pull...\n";
exec('cd /var/www/stl && git pull origin master 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "ERROR: Git pull failed with code $return_code\n";
}
$output = [];

// Migrations
echo "\n2. Running migrations...\n";
exec('cd /var/www/stl && /var/www/stl/venv/bin/python manage.py migrate --noinput 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Migrations completed with code $return_code\n";
}
$output = [];

// Create admin
echo "\n3. Creating admin user...\n";
exec('cd /var/www/stl && /var/www/stl/venv/bin/python manage.py shell -c "from accounts.models import User; admin = User.objects.filter(is_superuser=True).first();
if not admin:
    from accounts.models import Profile
    admin_user = User.objects.create_user(username=\'admin\', email=\'admin@stl.art\', password=\'StlAdmin2026!\', is_staff=True, is_superuser=True)
    Profile.objects.create(user=admin_user)
    print(f\'Admin created: {admin_user.username}\')
else:
    print(f\'Admin exists: {admin.username}\')
" 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Create admin completed with code $return_code\n";
}

// Restart Gunicorn
echo "\n4. Restarting Gunicorn...\n";
exec('sudo systemctl restart stl 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Gunicorn restart completed with code $return_code\n";
}

echo "\n=== Update completed at " . date('Y-m-d H:i:s') . " ===\n";
echo "\nAdmin credentials:\n";
echo "Username: admin\n";
echo "Password: StlAdmin2026!\n";
?>
