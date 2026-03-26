const http = require('http');

const BASE_URL = 'http://localhost:4000';

async function testChat() {
  console.log('=== Тестирование чата ===\n');

  // 1. Получаем страницу логина и CSRF токен
  console.log('1. Получение CSRF токена...');
  const loginPage = await getPage('/auth/login');
  const csrfMatch = loginPage.body.match(/name="_csrf" value="([^"]+)"/);
  const csrfToken = csrfMatch ? csrfMatch[1] : null;

  // Собираем все куки
  let allCookies = [];
  if (loginPage.headers['set-cookie']) {
    allCookies = allCookies.concat(loginPage.headers['set-cookie']);
  }

  console.log(`   CSRF токен: ${csrfToken ? '✓' : '✗'}`);
  console.log(`   Cookie: ${allCookies.length > 0 ? '✓' : '✗'}`);

  // 2. Логинимся
  console.log('\n2. Вход как admin...');
  const loginResult = await postForm('/auth/login',
    `email=admin%40stl.local&password=admin123&_csrf=${csrfToken}`,
    allCookies
  );

  // Собираем куки после логина
  if (loginResult.headers['set-cookie']) {
    allCookies = allCookies.concat(loginResult.headers['set-cookie']);
  }

  console.log(`   Статус: ${loginResult.statusCode === 302 ? '✓ OK' : '✗ FAIL'}`);
  console.log(`   Redirect: ${loginResult.headers.location || 'none'}`);
  console.log(`   Total cookies: ${allCookies.length}`);

  const cookieString = allCookies.join('; ');
  console.log(`   Cookie string: ${cookieString.substring(0, 50)}...`);

  // 3. Получаем страницу чата
  console.log('\n3. Загрузка страницы чата...');
  const chatPage = await getPage('/chat', cookieString);
  console.log(`   Статус: ${chatPage.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

  const hasSocketIO = chatPage.body.includes('/socket.io/socket.io.js');
  const hasChatClient = chatPage.body.includes('/js/chat-client.js');
  const hasChannels = chatPage.body.includes('channel-list');

  console.log(`   Socket.IO: ${hasSocketIO ? '✓' : '✗'}`);
  console.log(`   Chat client: ${hasChatClient ? '✓' : '✗'}`);
  console.log(`   Channels: ${hasChannels ? '✓' : '✗'}`);

  // 4. Тестируем API сообщений
  console.log('\n4. Тест API сообщений...');
  const messagesResult = await getPage('/chat/api/1/messages', cookieString);
  console.log(`   Статус: ${messagesResult.statusCode}`);
  console.log(`   Статус: ${messagesResult.statusCode === 200 ? '✓ OK' : '✗ FAIL'}`);

  try {
    const messages = JSON.parse(messagesResult.body);
    console.log(`   Формат: ${messages.success ? '✓ OK' : '✗ FAIL'}`);
    console.log(`   Сообщений: ${messages.messages ? messages.messages.length : 0}`);
  } catch (e) {
    console.log(`   Парсинг: ✗ FAIL (${e.message})`);
    console.log(`   Body preview: ${messagesResult.body.substring(0, 100)}`);
  }

  // 5. Отправка сообщения через API
  console.log('\n5. Отправка сообщения через API...');
  const messageData = `content=Тестовое сообщение ${Date.now()}`;
  const sendMessageResult = await postForm('/chat/api/1/messages', messageData, cookieString);
  console.log(`   Статус: ${sendMessageResult.statusCode}`);

  try {
    const response = JSON.parse(sendMessageResult.body);
    console.log(`   Успех: ${response.success ? '✓' : '✗'}`);
    if (response.message) {
      console.log(`   Сообщение: "${response.message.content}"`);
    }
  } catch (e) {
    console.log(`   Парсинг: ${e.message}`);
    console.log(`   Body preview: ${sendMessageResult.body.substring(0, 100)}`);
  }

  // 6. Проверяем новое сообщение
  console.log('\n6. Проверка новых сообщений...');
  const messagesResult2 = await getPage('/chat/api/1/messages', cookieString);
  try {
    const messages = JSON.parse(messagesResult2.body);
    console.log(`   Сообщений: ${messages.messages ? messages.messages.length : 0}`);
    if (messages.messages && messages.messages.length > 0) {
      const lastMsg = messages.messages[messages.messages.length - 1];
      console.log(`   Последнее: "${lastMsg.content}" от ${lastMsg.author}`);
    }
  } catch (e) {
    console.log(`   Парсинг: ${e.message}`);
  }

  console.log('\n=== Тестирование завершено ===');
}

// Helper functions
function getPage(path, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'GET',
      headers: cookie ? { 'Cookie': cookie } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

function postForm(path, postData, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie || ''
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.write(postData);
    req.end();
  });
}

testChat().catch(console.error);
