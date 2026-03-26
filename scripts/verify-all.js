const http = require('http');

function request(path, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: cookies ? { 'Cookie': cookies } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          location: res.headers.location
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

async function verify() {
  console.log('=== Полная проверка STL сайта ===\n');

  // 1. Главная страница
  console.log('1. Главная страница...');
  const home = await request('/');
  console.log(`   Статус: ${home.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

  // Проверка настроек
  const hasSiteName = home.body.includes('STL - Сообщество творческих людей');
  const hasHeaderText = home.body.includes('Добро пожаловать!');
  const hasFooterText = home.body.includes('Все права защищены');
  console.log(`   Site name: ${hasSiteName ? '✓' : '✗'}`);
  console.log(`   Header text: ${hasHeaderText ? '✓' : '✗'}`);
  console.log(`   Footer text: ${hasFooterText ? '✓' : '✗'}`);

  // Проверка чат-виджета
  const hasChatWidget = home.body.includes('chat-widget');
  console.log(`   Chat widget: ${hasChatWidget ? '✓' : '✗'}`);

  // 2. Страница входа
  console.log('\n2. Страница входа...');
  const login = await request('/auth/login');
  console.log(`   Статус: ${login.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

  // 3. Портфолио
  console.log('\n3. Портфолио...');
  const portfolio = await request('/portfolio');
  console.log(`   Статус: ${portfolio.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

  // 4. Чат (требует авторизации)
  console.log('\n4. Чат (без авторизации)...');
  const chat = await request('/chat');
  console.log(`   Статус: ${chat.statusCode === 302 ? '✓ Redirect (OK)' : '✗ FAIL'}`);

  // 5. Админка (без авторизации)
  console.log('\n5. Админ-панель (без авторизации)...');
  const admin = await request('/admin');
  console.log(`   Статус: ${admin.statusCode === 302 ? '✓ Redirect (OK)' : '✗ FAIL'}`);

  // 6. Вход как админ
  console.log('\n6. Вход как admin@stl.local...');

  // Сначала получаем CSRF токен и cookie
  const loginPage = await request('/auth/login');
  const csrfMatch = loginPage.body.match(/name="_csrf" value="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;
  const loginCookie = loginPage.headers['set-cookie'] ? loginPage.headers['set-cookie'].join('; ') : null;

  const loginPost = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': loginCookie || ''
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie']
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000);
    req.write(`email=admin%40stl.local&password=admin123&_csrf=${csrfToken}`);
    req.end();
  });

  console.log(`   Статус: ${loginPost.statusCode === 302 ? '✓ OK' : '✗ FAIL'}`);
  console.log(`   Redirect: ${loginPost.location || 'none'}`);

  const cookies = loginPost.cookies ? loginPost.cookies.join('; ') : null;
  console.log(`   Cookie получен: ${cookies ? '✓' : '✗'}`);

  // 7. Профиль после входа
  if (cookies) {
    console.log('\n7. Профиль (после входа)...');
    const profile = await request('/profile', cookies);
    console.log(`   Статус: ${profile.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

    // Проверка ссылки на админку
    const hasAdminLink = profile.body.includes('/admin');
    console.log(`   Ссылка на админку: ${hasAdminLink ? '✓' : '✗'}`);
  }

  // 8. Админка после входа
  if (cookies) {
    console.log('\n8. Админ-панель (после входа)...');
    const adminAuth = await request('/admin', cookies);
    console.log(`   Статус: ${adminAuth.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

    const hasDashboard = adminAuth.body.includes('Панель управления');
    console.log(`   Dashboard: ${hasDashboard ? '✓' : '✗'}`);

    const hasSettings = adminAuth.body.includes('Настройки сайта');
    console.log(`   Настройки: ${hasSettings ? '✓' : '✗'}`);
  }

  console.log('\n=== Проверка завершена ===');
  console.log('\nУчётные данные администратора:');
  console.log('  Email: admin@stl.local');
  console.log('  Пароль: admin123');
  console.log('\nURL админ-панели: http://localhost:4000/admin');
}

verify().catch(console.error);
