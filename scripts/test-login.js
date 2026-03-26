const http = require('http');

function makeRequest(path, method = 'GET', body = null, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data.substring(0, 1000),
          setCookie: res.headers['set-cookie']
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testLogin() {
  console.log('=== Тестирование входа и админ-панели ===\n');

  try {
    // Шаг 1: Получить cookie сессии
    console.log('1. Получение страницы login...');
    const loginPage = await makeRequest('/auth/login');
    console.log(`   Статус: ${loginPage.statusCode}`);
    let cookies = loginPage.setCookie ? loginPage.setCookie.join('; ') : null;
    console.log(`   Cookie получен: ${cookies ? 'да' : 'нет'}`);

    // Шаг 2: Войти как админ
    console.log('\n2. Вход как admin@stl.local / admin123...');
    const loginResult = await makeRequest(
      '/auth/login',
      'POST',
      'email=admin%40stl.local&password=admin123',
      cookies
    );
    console.log(`   Статус: ${loginResult.statusCode}`);
    console.log(`   Redirect: ${loginResult.headers.location || 'нет'}`);

    // Получить новые cookie после входа
    const newCookies = loginResult.setCookie || cookies;
    console.log(`   Новый cookie: ${newCookies ? 'да' : 'нет'}`);

    // Шаг 3: Проверить профиль
    console.log('\n3. Проверка /profile...');
    const profile = await makeRequest('/profile', 'GET', null, newCookies);
    console.log(`   Статус: ${profile.statusCode}`);
    if (profile.statusCode === 200) {
      console.log(`   ✓ Вход успешен`);
    }

    // Шаг 4: Проверить админку
    console.log('\n4. Проверка /admin...');
    const admin = await makeRequest('/admin', 'GET', null, newCookies);
    console.log(`   Статус: ${admin.statusCode}`);
    if (admin.statusCode === 200) {
      console.log(`   ✓ Админ-панель доступна`);
      if (admin.body.includes('Панель управления')) {
        console.log(`   ✓ Dashboard загружается`);
      }
    } else if (admin.statusCode === 302) {
      console.log(`   ! Перенаправление на ${admin.headers.location}`);
    }

    console.log('\n=== Тестирование завершено ===');

  } catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
  }
}

testLogin();
