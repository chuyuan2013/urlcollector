// Cloudflare Workers API
import { createHmac } from 'crypto';

// 生成JWT令牌
function generateToken(userId) {
  const secret = ENV.JWT_SECRET || 'default-secret-key';
  const payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7天过期
  };
  
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${header}.${encodedPayload}.${signature}`;
}

// 验证JWT令牌
function verifyToken(token) {
  try {
    const secret = ENV.JWT_SECRET || 'default-secret-key';
    const [header, payload, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(atob(payload));
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decodedPayload.sub;
  } catch (error) {
    return null;
  }
}

// 哈希密码
function hashPassword(password) {
  const secret = ENV.JWT_SECRET || 'default-secret-key';
  return createHmac('sha256', secret)
    .update(password)
    .digest('hex');
}

// 生成唯一ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 处理CORS
function handleCORS(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  return headers;
}

// 验证请求中的令牌
async function authenticateRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  if (!userId) {
    return null;
  }
  
  const user = await USERS.get(`user:${userId}`);
  if (!user) {
    return null;
  }
  
  return JSON.parse(user);
}

// API路由处理
async function handleRequest(request) {
  const headers = handleCORS(request);
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 认证相关路由
  if (path.startsWith('/api/auth/')) {
    if (path === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, headers);
    } else if (path === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, headers);
    } else if (path === '/api/auth/me' && request.method === 'GET') {
      return handleGetMe(request, headers);
    }
  }
  
  // 网址管理路由
  if (path.startsWith('/api/urls')) {
    const user = await authenticateRequest(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/api/urls' && request.method === 'GET') {
      return handleGetUrls(request, headers, user);
    } else if (path === '/api/urls' && request.method === 'POST') {
      return handleCreateUrl(request, headers, user);
    } else if (path.match(/\/api\/urls\/([^/]+)/) && request.method === 'PUT') {
      const id = path.split('/').pop();
      return handleUpdateUrl(request, headers, user, id);
    } else if (path.match(/\/api\/urls\/([^/]+)/) && request.method === 'DELETE') {
      const id = path.split('/').pop();
      return handleDeleteUrl(request, headers, user, id);
    }
  }
  
  // 静态文件服务
  if (path.startsWith('/src/')) {
    return await serveStaticFile(path);
  }
  
  // 根路径返回index.html
  if (path === '/' || path === '/index.html') {
    const indexHtml = await fetch('index.html');
    return new Response(await indexHtml.text(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

// 处理用户注册
async function handleRegister(request, headers) {
  try {
    const data = await request.json();
    const { username, email, password } = data;
    
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 检查邮箱是否已存在
    const existingUser = await USERS.get(`email:${email}`);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 创建新用户
    const userId = generateId();
    const hashedPassword = hashPassword(password);
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword
    };
    
    // 存储用户信息
    await USERS.put(`user:${userId}`, JSON.stringify(user));
    await USERS.put(`email:${email}`, userId);
    
    // 生成令牌
    const token = generateToken(userId);
    
    return new Response(JSON.stringify({ user, token }), {
      status: 201,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 处理用户登录
async function handleLogin(request, headers) {
  try {
    const data = await request.json();
    const { email, password } = data;
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 查找用户
    const userId = await USERS.get(`email:${email}`);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    const userJson = await USERS.get(`user:${userId}`);
    if (!userJson) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    const user = JSON.parse(userJson);
    const hashedPassword = hashPassword(password);
    
    if (user.password !== hashedPassword) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 生成令牌
    const token = generateToken(userId);
    
    // 移除密码字段
    const { password: _, ...userWithoutPassword } = user;
    
    return new Response(JSON.stringify({ user: userWithoutPassword, token }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 获取当前用户信息
async function handleGetMe(request, headers) {
  const user = await authenticateRequest(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  
  // 移除密码字段
  const { password: _, ...userWithoutPassword } = user;
  
  return new Response(JSON.stringify(userWithoutPassword), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// 获取用户的网址列表
async function handleGetUrls(request, headers, user) {
  try {
    const urls = [];
    let cursor = null;
    
    // 遍历用户的所有网址
    do {
      const list = await URLS.list({
        prefix: `url:${user.id}:`,
        cursor
      });
      
      for (const key of list.keys) {
        const urlJson = await URLS.get(key.name);
        if (urlJson) {
          urls.push(JSON.parse(urlJson));
        }
      }
      
      cursor = list.cursor;
    } while (cursor);
    
    return new Response(JSON.stringify(urls), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 创建新网址
async function handleCreateUrl(request, headers, user) {
  try {
    const data = await request.json();
    const { name, url, description, category } = data;
    
    if (!name || !url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 创建新网址
    const urlId = generateId();
    const newUrl = {
      id: urlId,
      userId: user.id,
      name,
      url,
      description: description || '',
      category: category || '',
      createdAt: new Date().toISOString()
    };
    
    // 存储网址
    await URLS.put(`url:${user.id}:${urlId}`, JSON.stringify(newUrl));
    
    return new Response(JSON.stringify(newUrl), {
      status: 201,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 更新网址
async function handleUpdateUrl(request, headers, user, id) {
  try {
    const data = await request.json();
    const { name, url, description, category } = data;
    
    if (!name || !url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 查找网址
    const urlJson = await URLS.get(`url:${user.id}:${id}`);
    if (!urlJson) {
      return new Response(JSON.stringify({ error: 'URL not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 更新网址
    const existingUrl = JSON.parse(urlJson);
    const updatedUrl = {
      ...existingUrl,
      name,
      url,
      description: description || '',
      category: category || ''
    };
    
    // 存储更新后的网址
    await URLS.put(`url:${user.id}:${id}`, JSON.stringify(updatedUrl));
    
    return new Response(JSON.stringify(updatedUrl), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 删除网址
async function handleDeleteUrl(request, headers, user, id) {
  try {
    // 查找网址
    const urlJson = await URLS.get(`url:${user.id}:${id}`);
    if (!urlJson) {
      return new Response(JSON.stringify({ error: 'URL not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // 删除网址
    await URLS.delete(`url:${user.id}:${id}`);
    
    return new Response(JSON.stringify({ message: 'URL deleted successfully' }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}

// 静态文件服务
async function serveStaticFile(path) {
  try {
    const response = await fetch(path.substring(1)); // 移除开头的斜杠
    if (response.ok) {
      const contentType = getContentType(path);
      return new Response(await response.arrayBuffer(), {
        headers: { 'Content-Type': contentType }
      });
    }
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}

// 获取文件内容类型
function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

// 导出处理函数
export default { fetch: handleRequest };