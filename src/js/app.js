// 全局变量
let currentUser = null;
let urls = [];
let categories = [];

// DOM元素
const elements = {
    // 认证相关
    authButtons: document.getElementById('auth-buttons'),
    userInfo: document.getElementById('user-info'),
    username: document.getElementById('username'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // 表单相关
    loginForm: document.getElementById('login-form'),
    loginFormElement: document.getElementById('login-form-element'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    
    registerForm: document.getElementById('register-form'),
    registerFormElement: document.getElementById('register-form-element'),
    registerUsername: document.getElementById('register-username'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerError: document.getElementById('register-error'),
    
    // 网址管理相关
    urlManager: document.getElementById('url-manager'),
    addUrlBtn: document.getElementById('add-url-btn'),
    urlForm: document.getElementById('url-form'),
    urlFormElement: document.getElementById('url-form-element'),
    urlId: document.getElementById('url-id'),
    urlName: document.getElementById('url-name'),
    urlLink: document.getElementById('url-link'),
    urlDescription: document.getElementById('url-description'),
    urlCategory: document.getElementById('url-category'),
    cancelUrlBtn: document.getElementById('cancel-url-btn'),
    
    // 筛选相关
    searchInput: document.getElementById('search-input'),
    categoryFilter: document.getElementById('category-filter'),
    
    // 网址列表
    urlList: document.getElementById('url-list')
};

// API基础URL
const API_BASE = '/api';

// 初始化应用
function initApp() {
    // 检查用户登录状态
    checkAuthStatus();
    
    // 绑定事件
    bindEvents();
}

// 检查认证状态
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                currentUser = user;
                showUserInfo();
                loadUrls();
            } else {
                localStorage.removeItem('token');
                showAuthButtons();
            }
        } catch (error) {
            console.error('检查认证状态失败:', error);
            localStorage.removeItem('token');
            showAuthButtons();
        }
    } else {
        showAuthButtons();
    }
}

// 显示认证按钮
function showAuthButtons() {
    elements.authButtons.style.display = 'flex';
    elements.userInfo.style.display = 'none';
    elements.loginForm.style.display = 'none';
    elements.registerForm.style.display = 'none';
    elements.urlManager.style.display = 'none';
}

// 显示用户信息
function showUserInfo() {
    elements.authButtons.style.display = 'none';
    elements.userInfo.style.display = 'flex';
    elements.username.textContent = currentUser.username;
    elements.loginForm.style.display = 'none';
    elements.registerForm.style.display = 'none';
    elements.urlManager.style.display = 'block';
}

// 绑定事件
function bindEvents() {
    // 认证相关事件
    elements.loginBtn.addEventListener('click', () => {
        elements.loginForm.style.display = 'block';
        elements.registerForm.style.display = 'none';
    });
    
    elements.registerBtn.addEventListener('click', () => {
        elements.registerForm.style.display = 'block';
        elements.loginForm.style.display = 'none';
    });
    
    elements.logoutBtn.addEventListener('click', logout);
    
    // 登录表单提交
    elements.loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await login();
    });
    
    // 注册表单提交
    elements.registerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await register();
    });
    
    // 网址管理相关事件
    elements.addUrlBtn.addEventListener('click', showAddUrlForm);
    elements.cancelUrlBtn.addEventListener('click', hideUrlForm);
    elements.urlFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUrl();
    });
    
    // 筛选事件
    elements.searchInput.addEventListener('input', filterUrls);
    elements.categoryFilter.addEventListener('change', filterUrls);
}

// 登录
async function login() {
    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showUserInfo();
            loadUrls();
            elements.loginError.textContent = '';
        } else {
            const error = await response.json();
            elements.loginError.textContent = error.message || '登录失败';
        }
    } catch (error) {
        console.error('登录失败:', error);
        elements.loginError.textContent = '网络错误，请稍后重试';
    }
}

// 注册
async function register() {
    const username = elements.registerUsername.value;
    const email = elements.registerEmail.value;
    const password = elements.registerPassword.value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            showUserInfo();
            loadUrls();
            elements.registerError.textContent = '';
        } else {
            const error = await response.json();
            elements.registerError.textContent = error.message || '注册失败';
        }
    } catch (error) {
        console.error('注册失败:', error);
        elements.registerError.textContent = '网络错误，请稍后重试';
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    showAuthButtons();
}

// 加载网址列表
async function loadUrls() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/urls`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            urls = await response.json();
            updateCategories();
            renderUrls();
        } else {
            console.error('加载网址失败');
        }
    } catch (error) {
        console.error('加载网址失败:', error);
    }
}

// 更新分类列表
function updateCategories() {
    // 提取所有唯一分类
    const uniqueCategories = [...new Set(urls.map(url => url.category).filter(Boolean))];
    categories = uniqueCategories;
    
    // 更新分类筛选下拉框
    elements.categoryFilter.innerHTML = '<option value="">所有分类</option>';
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        elements.categoryFilter.appendChild(option);
    });
}

// 渲染网址列表
function renderUrls(filteredUrls = urls) {
    elements.urlList.innerHTML = '';
    
    if (filteredUrls.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = '暂无收藏的网址';
        elements.urlList.appendChild(emptyState);
        return;
    }
    
    filteredUrls.forEach(url => {
        const urlItem = document.createElement('div');
        urlItem.className = 'url-item';
        urlItem.innerHTML = `
            <h3>${url.name}</h3>
            <a href="${url.url}" target="_blank" class="url-link">${url.url}</a>
            ${url.description ? `<p class="url-description">${url.description}</p>` : ''}
            ${url.category ? `<span class="url-category">${url.category}</span>` : ''}
            <div class="actions">
                <button class="btn secondary" onclick="editUrl('${url.id}')">编辑</button>
                <button class="btn secondary" onclick="deleteUrl('${url.id}')">删除</button>
            </div>
        `;
        elements.urlList.appendChild(urlItem);
    });
}

// 筛选网址
function filterUrls() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const selectedCategory = elements.categoryFilter.value;
    
    const filtered = urls.filter(url => {
        const matchesSearch = url.name.toLowerCase().includes(searchTerm) || 
                            url.url.toLowerCase().includes(searchTerm) ||
                            (url.description && url.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !selectedCategory || url.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    renderUrls(filtered);
}

// 显示添加网址表单
function showAddUrlForm() {
    elements.urlForm.style.display = 'block';
    elements.urlFormElement.reset();
    elements.urlId.value = '';
    elements.urlForm.querySelector('h3').textContent = '添加网址';
}

// 隐藏网址表单
function hideUrlForm() {
    elements.urlForm.style.display = 'none';
}

// 编辑网址
function editUrl(id) {
    const url = urls.find(u => u.id === id);
    if (url) {
        elements.urlId.value = url.id;
        elements.urlName.value = url.name;
        elements.urlLink.value = url.url;
        elements.urlDescription.value = url.description || '';
        elements.urlCategory.value = url.category || '';
        elements.urlForm.style.display = 'block';
        elements.urlForm.querySelector('h3').textContent = '编辑网址';
    }
}

// 保存网址
async function saveUrl() {
    const id = elements.urlId.value;
    const name = elements.urlName.value;
    const url = elements.urlLink.value;
    const description = elements.urlDescription.value;
    const category = elements.urlCategory.value;
    
    const urlData = { name, url, description, category };
    
    try {
        const token = localStorage.getItem('token');
        let response;
        
        if (id) {
            // 更新现有网址
            response = await fetch(`${API_BASE}/urls/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(urlData)
            });
        } else {
            // 创建新网址
            response = await fetch(`${API_BASE}/urls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(urlData)
            });
        }
        
        if (response.ok) {
            hideUrlForm();
            loadUrls();
        } else {
            console.error('保存网址失败');
        }
    } catch (error) {
        console.error('保存网址失败:', error);
    }
}

// 删除网址
async function deleteUrl(id) {
    if (!confirm('确定要删除这个网址吗？')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/urls/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            loadUrls();
        } else {
            console.error('删除网址失败');
        }
    } catch (error) {
        console.error('删除网址失败:', error);
    }
}

// 初始化应用
initApp();