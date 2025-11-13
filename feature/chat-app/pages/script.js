// 配置 - 确保URL正确
const config = {
    workersUrl: 'https://chathub-workers.gitcbz.workers.dev',
    pagesUrl: window.location.origin,
    reconnectDelay: 3000,
    typingTimeout: 1000,
    maxMessages: 100
};

// 全局变量
let ws = null;
let currentUser = null;
let currentRoom = 'general';
let selectedAvatar = '😀';
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectInterval = null;

// DOM元素
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messagesContainer');

// 更新连接状态
function updateConnectionStatus(status, text) {
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionStatus = document.getElementById('connectionStatus');
    
    if (connectionIndicator) {
        connectionIndicator.className = `connection-indicator ${status}`;
    }
    
    if (connectionStatus) {
        connectionStatus.textContent = text;
    }
    
    // 更新其他连接状态显示
    const wsStatus = document.getElementById('wsStatus');
    if (wsStatus) {
        wsStatus.textContent = text;
    }
    
    const welcomeStatus = document.getElementById('welcomeStatus');
    if (welcomeStatus) {
        welcomeStatus.textContent = text;
    }
    
    const serverStatus = document.getElementById('serverStatus');
    if (serverStatus) {
        serverStatus.textContent = text === '🟢 已连接' ? '✅ 在线' : '❌ 离线';
    }
}

// WebSocket连接
function connectToServer() {
    if (ws) {
        ws.close();
    }
    
    updateConnectionStatus('connecting', '🟡 连接中...');
    
    // 构建WebSocket URL
    const wsUrl = config.workersUrl.replace('https://', 'wss://') + '/ws';
    
    console.log('🔗 尝试连接WebSocket:', wsUrl);
    
    try {
        ws = new WebSocket(wsUrl);
        
        // 设置连接超时
        const connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                ws.close();
                updateConnectionStatus('disconnected', '🔴 连接超时');
                showNotification('连接失败', '连接超时，请检查网络', 'error');
            }
        }, 10000);
        
        ws.onopen = function() {
            clearTimeout(connectionTimeout);
            console.log('✅ WebSocket连接成功');
            updateConnectionStatus('connected', '🟢 已连接');
            reconnectAttempts = 0;
            
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            
            if (currentUser) {
                sendJoin();
            }
            
            updateConnectionUI(true);
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 收到消息:', data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('❌ 解析消息失败:', error, event.data);
            }
        };
        
        ws.onclose = function(event) {
            clearTimeout(connectionTimeout);
            console.log('❌ WebSocket连接关闭:', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean
            });
            
            updateConnectionStatus('disconnected', '🔴 未连接');
            updateConnectionUI(false);
            
            if (event.code === 1006) {
                showNotification('连接错误', '连接异常关闭', 'error');
            }
            
            // 自动重连
            if (reconnectAttempts < maxReconnectAttempts) {
                scheduleReconnect();
            }
        };
        
        ws.onerror = function(error) {
            clearTimeout(connectionTimeout);
            console.error('❌ WebSocket错误:', error);
            updateConnectionStatus('disconnected', '🔴 连接错误');
            showNotification('连接错误', '无法连接到服务器', 'error');
        };
        
    } catch (error) {
        console.error('❌ 创建WebSocket连接失败:', error);
        updateConnectionStatus('disconnected', '🔴 连接失败');
        showNotification('连接失败', error.message, 'error');
    }
}

// 更新连接UI
function updateConnectionUI(connected) {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.disabled = !connected;
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.disabled = !connected;
        if (connected) {
            messageInput.placeholder = '输入消息...';
        } else {
            messageInput.placeholder = '请先连接服务器...';
        }
    }
}

// 安排重连
function scheduleReconnect() {
    if (reconnectInterval) return;
    
    reconnectAttempts++;
    const delay = config.reconnectDelay * Math.min(reconnectAttempts, 3);
    
    console.log(`🔄 ${delay/1000}秒后尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
    
    reconnectInterval = setTimeout(() => {
        connectToServer();
        reconnectInterval = null;
    }, delay);
}

// 测试连接
async function testConnection() {
    console.log('🔍 测试服务器连接...');
    
    try {
        const response = await fetch(`${config.workersUrl}/health`);
        const data = await response.json();
        
        console.log('✅ HTTP连接正常:', data);
        updateConnectionStatus('connected', '🟢 已连接');
        
        // 测试WebSocket
        connectToServer();
        
    } catch (error) {
        console.error('❌ HTTP连接失败:', error);
        updateConnectionStatus('disconnected', '🔴 连接失败');
        showNotification('连接测试', '无法连接到服务器', 'error');
    }
}

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const room = document.getElementById('room').value;
    
    if (!username) {
        showNotification('错误', '请输入用户名', 'error');
        return;
    }
    
    // 显示加载状态
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    
    // 创建用户对象
    currentUser = {
        id: Date.now().toString(),
        username: username,
        avatar: selectedAvatar,
        room: room
    };
    
    // 连接服务器
    connectToServer();
    
    // 延迟显示聊天界面
    setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            showChatScreen();
        } else {
            // 恢复登录按钮
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            showNotification('登录失败', '连接服务器失败', 'error');
        }
    }, 5000);
}

// 显示聊天界面
function showChatScreen() {
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');
    
    // 更新用户信息
    document.getElementById('userAvatar').textContent = currentUser.avatar;
    document.getElementById('displayUsername').textContent = currentUser.username;
    document.getElementById('currentRoom').textContent = getRoomDisplayName(currentUser.room);
    
    // 设置当前房间
    currentRoom = currentUser.room;
    switchRoom(currentRoom);
    
    // 保存用户信息
    localStorage.setItem('chatUser', JSON.stringify(currentUser));
    
    // 恢复登录按钮
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    loginBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    
    showNotification('登录成功', `欢迎 ${currentUser.username}！`, 'success');
}

// 显示通知
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification fade-in';
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成，初始化应用...');
    
    // 确保CSS变量已定义
    if (!getComputedStyle(document.documentElement).getPropertyValue('--background-color')) {
        console.log('🎨 设置默认CSS变量');
        document.documentElement.style.setProperty('--background-color', '#36393F');
        document.documentElement.style.setProperty('--surface-color', '#2F3136');
        document.documentElement.style.setProperty('--text-primary', '#FFFFFF');
        document.documentElement.style.setProperty('--text-secondary', '#B9BBBE');
    }
    
    // 初始化事件监听器
    initializeEventListeners();
    generateEmojiPicker();
    checkExistingSession();
    loadSettings();
    
    // 测试连接
    setTimeout(testConnection, 1000);
});

// 初始化事件监听器
function initializeEventListeners() {
    console.log('🎧 初始化事件监听器...');
    
    // 登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ 登录表单事件监听器已添加');
    }
    
    // 头像选择
    document.querySelectorAll('.avatar-option').forEach(avatar => {
        avatar.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            this.classList.add('selected');
            selectedAvatar = this.dataset.avatar;
            console.log('🎭 选择头像:', selectedAvatar);
        });
    });
    
    // 房间切换
    document.querySelectorAll('.room-item').forEach(room => {
        room.addEventListener('click', function() {
            if (currentUser) {
                switchRoom(this.dataset.room);
            } else {
                showNotification('提示', '请先登录', 'warning');
            }
        });
    });
    
    // 消息输入
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            
            if (this.value.trim() && ws && ws.readyState === WebSocket.OPEN) {
                sendTyping();
                
                clearTimeout(window.typingTimeout);
                window.typingTimeout = setTimeout(() => {
                    sendStopTyping();
                }, config.typingTimeout);
            }
        });
        
        console.log('✅ 消息输入事件监听器已添加');
    }
    
    // 退出按钮
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('✅ 退出按钮事件监听器已添加');
    }
    
    // 发送按钮
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        console.log('✅ 发送按钮事件监听器已添加');
    }
    
    // 点击外部关闭弹窗
    document.addEventListener('click', function(e) {
        const emojiPicker = document.getElementById('emojiPicker');
        const settingsModal = document.getElementById('settingsModal');
        
        if (emojiPicker && !e.target.closest('.emoji-picker') && !e.target.closest('.input-btn')) {
            emojiPicker.classList.remove('show');
        }
        
        if (settingsModal && !e.target.closest('.modal-content') && !e.target.closest('.action-btn')) {
            settingsModal.classList.add('hidden');
        }
    });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && ws && ws.readyState !== WebSocket.OPEN) {
            console.log('🔄 页面重新可见，尝试重连...');
            connectToServer();
        }
    });
    
    // 窗口大小变化
    window.addEventListener('resize', function() {
        if (messagesContainer) {
            scrollToBottom();
        }
    });
    
    console.log('✅ 所有事件监听器初始化完成');
}

// 生成表情选择器
function generateEmojiPicker() {
    console.log('😊 生成表情选择器...');
    
    const emojiPicker = document.getElementById('emojiPicker');
    if (!emojiPicker) {
        console.warn('⚠️ 表情选择器容器未找到');
        return;
    }
    
    const emojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
        '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
        '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
        '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
        '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
        '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
        '🤖', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
        '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍',
        '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
        '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏'
    ];
    
    emojiPicker.innerHTML = '';
    
    emojis.forEach(emoji => {
        const item = document.createElement('span');
        item.className = 'emoji-item';
        item.textContent = emoji;
        item.onclick = () => insertEmoji(emoji);
        emojiPicker.appendChild(item);
    });
    
    console.log('✅ 表情选择器生成完成');
}

// 插入表情
function insertEmoji(emoji) {
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
        
        // 触发input事件
        messageInput.dispatchEvent(new Event('input'));
    }
}

// 检查现有会话
function checkExistingSession() {
    console.log('🔍 检查现有会话...');
    
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('🔄 发现保存的用户会话:', currentUser);
            
            // 自动重新连接
            setTimeout(() => {
                connectToServer();
            }, 1000);
            
        } catch (error) {
            console.error('❌ 解析用户会话失败:', error);
            localStorage.removeItem('chatUser');
        }
    }
}

// 加载设置
function loadSettings() {
    console.log('⚙️ 加载用户设置...');
    
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            applySettings(settings);
            console.log('✅ 设置加载完成:', settings);
        } catch (error) {
            console.error('❌ 解析设置失败:', error);
        }
    }
}

// 应用设置
function applySettings(settings) {
    // 声音设置
    const soundEnabled = document.getElementById('soundEnabled');
    if (soundEnabled) {
        soundEnabled.checked = settings.soundEnabled !== false;
    }
    
    // 通知设置
    const notificationEnabled = document.getElementById('notificationEnabled');
    if (notificationEnabled) {
        notificationEnabled.checked = settings.notificationEnabled === true;
        if (settings.notificationEnabled && 'Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    // 自动重连设置
    const autoReconnect = document.getElementById('autoReconnect');
    if (autoReconnect) {
        autoReconnect.checked = settings.autoReconnect !== false;
    }
    
    // 消息动画设置
    const messageAnimation = document.getElementById('messageAnimation');
    if (messageAnimation) {
        messageAnimation.checked = settings.messageAnimation !== false;
    }
    
    // 主题设置
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = settings.theme || 'auto';
        applyTheme(settings.theme || 'auto');
    }
}

// 应用主题
function applyTheme(theme) {
    const root = document.documentElement;
    
    switch (theme) {
        case 'light':
            root.style.setProperty('--background-color', '#FFFFFF');
            root.style.setProperty('--surface-color', '#F2F3F5');
            root.style.setProperty('--text-primary', '#2E3338');
            root.style.setProperty('--text-secondary', '#747F8D');
            root.style.setProperty('--border-color', '#E3E5E8');
            break;
        case 'dark':
            root.style.setProperty('--background-color', '#36393F');
            root.style.setProperty('--surface-color', '#2F3136');
            root.style.setProperty('--text-primary', '#FFFFFF');
            root.style.setProperty('--text-secondary', '#B9BBBE');
            root.style.setProperty('--border-color', '#202225');
            break;
        case 'auto':
        default:
            // 使用系统偏好
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                applyTheme('dark');
            } else {
                applyTheme('light');
            }
            break;
    }
}

// 切换表情选择器
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    if (emojiPicker) {
        emojiPicker.classList.toggle('show');
    }
}

// 切换用户列表
function toggleUserList() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// 检查连接
function checkConnection() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        showNotification('连接状态', 'WebSocket连接正常', 'success');
    } else {
        showNotification('连接状态', '正在重新连接...', 'info');
        connectToServer();
    }
}

// 切换设置
function toggleSettings() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.toggle('hidden');
    }
}

// 保存设置
function saveSettings() {
    const settings = {
        soundEnabled: document.getElementById('soundEnabled')?.checked !== false,
        notificationEnabled: document.getElementById('notificationEnabled')?.checked === true,
        autoReconnect: document.getElementById('autoReconnect')?.checked !== false,
        messageAnimation: document.getElementById('messageAnimation')?.checked !== false,
        theme: document.getElementById('themeSelect')?.value || 'auto'
    };
    
    localStorage.setItem('chatSettings', JSON.stringify(settings));
    applySettings(settings);
    toggleSettings();
    showNotification('设置', '设置已保存', 'success');
}

// 退出登录
function logout() {
    console.log('🚪 用户退出登录...');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'leave',
            room: currentRoom
        }));
        ws.close();
    }
    
    localStorage.removeItem('chatUser');
    currentUser = null;
    currentRoom = 'general';
    
    // 显示登录界面
    if (loginScreen) {
        loginScreen.classList.remove('hidden');
    }
    if (chatScreen) {
        chatScreen.classList.add('hidden');
    }
    
    // 重置表单
    if (loginForm) {
        loginForm.reset();
    }
    
    // 清除重连定时器
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
    }
    
    showNotification('退出', '您已成功退出', 'info');
}

// 获取房间显示名称
function getRoomDisplayName(roomId) {
    const roomNames = {
        general: '综合讨论',
        tech: '技术交流',
        random: '随机聊天',
        gaming: '游戏讨论'
    };
    return roomNames[roomId] || roomId;
}

// 获取房间描述
function getRoomDescription(roomId) {
    const descriptions = {
        general: '欢迎来到综合讨论室，畅所欲言！',
        tech: '技术交流，分享编程经验和新技术。',
        random: '随机聊天，认识新朋友。',
        gaming: '游戏讨论，分享游戏心得。'
    };
    return descriptions[roomId] || '';
}

// 切换房间
function switchRoom(roomId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        showNotification('错误', '请先连接服务器', 'error');
        return;
    }
    
    console.log('🔄 切换房间:', roomId);
    
    // 离开当前房间
    if (currentRoom !== roomId) {
        ws.send(JSON.stringify({
            type: 'leave',
            room: currentRoom
        }));
    }
    
    // 加入新房间
    currentRoom = roomId;
    currentUser.room = roomId;
    
    ws.send(JSON.stringify({
        type: 'join',
        user: currentUser,
        room: currentRoom
    }));
    
    // 更新UI
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-room="${roomId}"]`)?.classList.add('active');
    
    const roomTitle = document.getElementById('roomTitle');
    if (roomTitle) {
        roomTitle.textContent = '# ' + getRoomDisplayName(roomId);
    }
    
    const currentRoomElement = document.getElementById('currentRoom');
    if (currentRoomElement) {
        currentRoomElement.textContent = getRoomDisplayName(roomId);
    }
    
    const roomDescription = document.getElementById('roomDescription');
    if (roomDescription) {
        roomDescription.textContent = getRoomDescription(roomId);
    }
    
    // 清空消息容器
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>欢迎来到 ${getRoomDisplayName(roomId)}</h3>
                <p>${getRoomDescription(roomId)}</p>
                <p>连接状态: <span id="welcomeStatus">${document.getElementById('connectionStatus')?.textContent || '连接中...'}</span></p>
            </div>
        `;
    }
}

// 滚动到底部
function scrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// HTML转义
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 发送消息
function sendMessage() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        showNotification('错误', '未连接到服务器', 'error');
        return;
    }
    
    if (!messageInput) {
        console.error('❌ 消息输入框未找到');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) {
        return;
    }
    
    const messageData = {
        type: 'message',
        id: Date.now().toString(),
        text: message,
        timestamp: new Date().toISOString()
    };
    
    console.log('📤 发送消息:', messageData);
    ws.send(JSON.stringify(messageData));
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // 发送停止输入状态
    sendStopTyping();
}

// 发送正在输入状态
function sendTyping() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'typing',
            room: currentRoom
        }));
    }
}

// 发送停止输入状态
function sendStopTyping() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'stopTyping',
            room: currentRoom
        }));
    }
}

// 显示消息
function displayMessage(data) {
    if (!messagesContainer) {
        console.error('❌ 消息容器未找到');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(data.timestamp).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const isOwnMessage = data.user.id === currentUser.id;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${data.user.avatar}</div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${escapeHtml(data.user.username)}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-text">${escapeHtml(data.text)}</div>
        </div>
    `;
    
    if (isOwnMessage) {
        messageDiv.style.flexDirection = 'row-reverse';
        messageDiv.querySelector('.message-content').style.textAlign = 'right';
    }
    
    // 移除欢迎消息
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    
    // 播放通知声音
    if (!isOwnMessage && document.getElementById('soundEnabled')?.checked !== false) {
        playNotificationSound();
    }
    
    // 桌面通知
    if (!isOwnMessage && document.getElementById('notificationEnabled')?.checked && document.hidden) {
        showDesktopNotification(data.user.username, data.text);
    }
}

// 显示系统消息
function displaySystemMessage(message) {
    if (!messagesContainer) {
        console.error('❌ 消息容器未找到');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// 更新用户列表
function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) {
        console.error('❌ 用户列表容器未找到');
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <div class="user-item-avatar">${user.avatar}</div>
            <span class="user-item-name">${escapeHtml(user.username)}</span>
        `;
        usersList.appendChild(userDiv);
    });
    
    // 更新在线人数
    const onlineCount = document.getElementById('onlineCount');
    if (onlineCount) {
        onlineCount.textContent = users.length;
    }
}

// 显示正在输入指示器
function showTypingIndicator(username) {
    if (!messagesContainer) return;
    
    let indicator = messagesContainer.querySelector('.typing-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            ${escapeHtml(username)} 正在输入
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
    }
    scrollToBottom();
}

// 隐藏正在输入指示器
function hideTypingIndicator() {
    if (!messagesContainer) return;
    
    const indicator = messagesContainer.querySelector('.typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// 播放通知声音
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.error('播放声音失败:', error);
    }
}

// 显示桌面通知
function showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💬</text></svg>',
            tag: 'chat-message'
        });
    }
}

// 处理WebSocket消息
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'connected':
            console.log('🔗 服务器确认连接:', data.clientId);
            break;
            
        case 'message':
            displayMessage(data);
            break;
            
        case 'system':
            displaySystemMessage(data.message);
            break;
            
        case 'userList':
            updateUsersList(data.users);
            break;
            
        case 'typing':
            showTypingIndicator(data.username);
            break;
            
        case 'stopTyping':
            hideTypingIndicator();
            break;
            
        case 'error':
            console.error('❌ 服务器错误:', data.message);
            showNotification('错误', data.message, 'error');
            break;
            
        default:
            console.warn('⚠️ 未知消息类型:', data.type);
    }
}

// 发送加入房间消息
function sendJoin() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('❌ WebSocket未连接，无法发送join消息');
        return;
    }
    
    const joinMessage = {
        type: 'join',
        user: currentUser,
        room: currentUser.room
    };
    
    console.log('📤 发送join消息:', joinMessage);
    ws.send(JSON.stringify(joinMessage));
}
