const http = require('http');

function request(path, cookies = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
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
          cookies: res.headers['set-cookie']
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

async function debug() {
  console.log('=== Debug Admin Panel ===\n');

  // Step 1: Login
  console.log('1. Login as admin...');
  const loginResult = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
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
    req.write('email=admin%40stl.local&password=admin123');
    req.end();
  });

  console.log(`   Status: ${loginResult.statusCode}`);
  console.log(`   Cookies: ${loginResult.cookies ? loginResult.cookies.join('; ') : 'none'}`);

  const cookies = loginResult.cookies ? loginResult.cookies.join('; ') : null;

  // Step 2: Get admin page
  console.log('\n2. Get /admin page...');
  const admin = await request('/admin', cookies);
  console.log(`   Status: ${admin.statusCode}`);

  // Check for user in response
  const hasUserMenu = admin.body.includes('user-menu');
  const hasAdminLink = admin.body.includes('Админ-панель');
  const hasDashboard = admin.body.includes('Панель управления');
  const hasUserInLocals = admin.body.includes('username');

  console.log(`   Has user-menu: ${hasUserMenu}`);
  console.log(`   Has admin link: ${hasAdminLink}`);
  console.log(`   Has dashboard: ${hasDashboard}`);
  console.log(`   Has username: ${hasUserInLocals}`);

  // Check header section
  const headerStart = admin.body.indexOf('<header');
  const headerEnd = admin.body.indexOf('</header>') + 9;
  if (headerStart !== -1) {
    const headerSection = admin.body.substring(headerStart, headerEnd);
    console.log('\n=== Header HTML ===');
    console.log(headerSection.substring(0, 500));
  }

  // Step 3: Get main site with admin cookies
  console.log('\n\n3. Get homepage with admin cookies...');
  const home = await request('/', cookies);
  console.log(`   Status: ${home.statusCode}`);

  const homeHasAdminLink = home.body.includes('Админ-панель');
  const homeHasUserMenu = home.body.includes('user-menu');

  console.log(`   Has admin link in main nav: ${homeHasAdminLink}`);
  console.log(`   Has user-menu: ${homeHasUserMenu}`);

  // Check if chat widget is present
  const hasChatWidget = home.body.includes('chat-widget');
  console.log(`   Has chat widget: ${hasChatWidget}`);
}

debug().catch(console.error);
