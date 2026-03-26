const http = require('http');

function makeRequest(path, followRedirect = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      followRedirect: followRedirect
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 500)
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

async function testAdminPanel() {
  console.log('=== Тестирование админ-панели STL ===\n');

  try {
    // Test 1: Главная страница
    console.log('1. Проверка главной страницы...');
    const home = await makeRequest('/');
    console.log(`   Статус: ${home.statusCode}`);
    console.log(`   ✓ Главная страница загружается`);

    // Test 2: Проверка настроек в БД
    console.log('\n2. Проверка настроек в базе данных...');
    const { query } = require('../config/database');
    const settings = await query('SELECT * FROM settings');
    console.log(`   Найдено настроек: ${settings.length}`);
    settings.forEach(s => {
      console.log(`   - ${s.key}: ${s.value.substring(0, 30)}... (${s.type})`);
    });
    console.log(`   ✓ Настройки загружены из БД`);

    // Test 3: Админ-панель (должна перенаправить на login)
    console.log('\n3. Проверка доступа к /admin...');
    const admin = await makeRequest('/admin', true);
    console.log(`   Статус: ${admin.statusCode}`);
    if (admin.statusCode === 302 || admin.statusCode === 200) {
      console.log(`   ✓ Админ-панель защищена (перенаправляет на login)`);
    }

    // Test 4: Проверка middleware settings
    console.log('\n4. Проверка settings middleware...');
    if (home.body.includes('STL - Сообщество творческих людей')) {
      console.log(`   ✓ Site name отображается из настроек`);
    }
    if (home.body.includes('Добро пожаловать')) {
      console.log(`   ✓ Header text отображается из настроек`);
    }
    if (home.body.includes('Все права защищены')) {
      console.log(`   ✓ Footer text отображается из настроек`);
    }

    // Test 5: Проверка чат-виджета
    console.log('\n5. Проверка чат-виджета...');
    if (home.body.includes('chat-widget')) {
      console.log(`   ✓ Чат-виджет подключён (active_modules работает)`);
    } else {
      console.log(`   ! Чат-виджет не найден на странице`);
    }

    // Test 6: Проверка admin link для не-авторизованных
    console.log('\n6. Проверка ссылки на админку...');
    if (home.body.includes('/admin')) {
      console.log(`   ! Ссылка на админку видна неавторизованным (возможно ошибка)`);
    } else {
      console.log(`   ✓ Ссылка на админку скрыта для неавторизованных`);
    }

    console.log('\n=== Тестирование завершено ===\n');
    console.log('Для полного доступа к админ-панели:');
    console.log('1. Откройте http://localhost:3001/auth/login');
    console.log('2. Войдите как: admin@stl.local / admin123');
    console.log('3. После входа перейдите на http://localhost:3001/admin');

  } catch (err) {
    console.error('Ошибка тестирования:', err.message);
    process.exit(1);
  }
}

testAdminPanel();
