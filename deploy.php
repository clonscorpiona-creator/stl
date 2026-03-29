<?php
/**
 * Webhook для авто-деплоя STL проекта
 * Разместите этот файл в корне сайта (/var/www/stl/public/deploy.php)
 * и вызовите через браузер: http://77.232.129.41/deploy.php?key=YOUR_SECRET_KEY
 */

$SECRET_KEY = 'stl_deploy_secret_2026'; // Измените на свой ключ!

// Проверка ключа
if (!isset($_GET['key']) || $_GET['key'] !== $SECRET_KEY) {
    http_response_code(403);
    die('Access denied');
}

header('Content-Type: text/plain');

$output = [];
$return_code = 0;

echo "=== STL Deploy ===\n\n";

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
exec('cd /var/www/stl && python manage.py migrate --noinput 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Migrations completed with code $return_code\n";
}
$output = [];

// Collect static
echo "\n3. Collecting static files...\n";
exec('cd /var/www/stl && python manage.py collectstatic --noinput 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Collectstatic completed with code $return_code\n";
}
$output = [];

// Restart Gunicorn
echo "\n4. Restarting Gunicorn...\n";
exec('sudo systemctl restart stl 2>&1', $output, $return_code);
echo implode("\n", $output) . "\n";
if ($return_code !== 0) {
    echo "WARNING: Gunicorn restart completed with code $return_code\n";
}

echo "\n=== Deploy completed at " . date('Y-m-d H:i:s') . " ===\n";
?>
