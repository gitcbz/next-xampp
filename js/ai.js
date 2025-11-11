// AI工具箱脚本
class AIToolbox {
    constructor() {
        this.state = {
            currentPlatform: null,
            currentTab: 'chat',
            conversations: [],
            config: {
                openai: { apiKey: '', baseUrl: 'https://api.openai.com/v1', orgId: '', model: 'gpt-3.5-turbo' },
                deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                gemini: { apiKey: '', model: 'gemini-pro' },
                grok: { apiKey: '', baseUrl: 'https://api.x.ai/v1', model: 'grok-beta' },
                claude: { apiKey: '', model: 'claude-3-sonnet-20240229' },
                custom: { apiKey: '', baseUrl: '', model: '' }
            },
            stats: {
                totalRequests: 0,
                totalTokens: 0,
                totalResponseTime: 0,
                successRequests: 0,
                platformUsage: {}
            }
        };

        this.platformConfigs = {
            openai: { name: 'OpenAI', icon: '🧠', defaultModel: 'gpt-3.5-turbo' },
            deepseek: { name: 'DeepSeek', icon: '🔍', defaultModel: 'deepseek-chat' },
            gemini: { name: 'Gemini', icon: '💎', defaultModel: 'gemini-pro' },
            grok: { name: 'Grok', icon: '⚡', defaultModel: 'grok-beta' },
            claude: { name: 'Claude', icon: '🎭', defaultModel: 'claude-3-sonnet-20240229' },
            custom: { name: '自定义', icon: '⚙️', defaultModel: 'custom-model' }
        };

        this.init();
    }

    init() {
        this.loadConfig();
        this.loadConversations();
        this.updateStats();
        this.initEventListeners();
    }

    initEventListeners() {
        // 消息输入框
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                messageInput.style.height = 'auto';
                messageInput.style.height = messageInput.scrollHeight + 'px';
            });
        }

        // 配置滑块
        const tempSlider = document.getElementById('temperature');
        const tempValue = document.getElementById('tempValue');
        if (tempSlider && tempValue) {
            tempSlider.addEventListener('input', (e) => {
                tempValue.textContent = e.target.value;
            });
        }

        const topPSlider = document.getElementById('topP');
        const topPValue = document.getElementById('topPValue');
        if (topPSlider && topPValue) {
            topPSlider.addEventListener('input', (e) => {
                topPValue.textContent = e.target.value;
            });
        }
    }

    selectPlatform(platform) {
        // 移除所有选中状态
        document.querySelectorAll('.platform-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // 添加选中状态
        document.querySelector(`[data-platform="${platform}"]`).classList.add('active');
        
        // 隐藏所有配置区域
        document.querySelectorAll('[id$="-config"]').forEach(config => {
            config.style.display = 'none';
        });
        
        // 显示当前平台配置
        const configElement = document.getElementById(`${platform}-config`);
        if (configElement) {
            configElement.style.display = 'block';
        }
        
        // 更新状态
        this.state.currentPlatform = platform;
        this.updateConnectionStatus(true);
        this.updatePlatformDisplay(platform);
        
        // 加载该平台的配置
        this.loadPlatformConfig(platform);
    }

    updatePlatformDisplay(platform) {
        const config = this.platformConfigs[platform];
        document.getElementById('currentPlatformName').textContent = config.name;
    }

    loadPlatformConfig(platform) {
        const config = this.state.config[platform];
        if (!config) return;
        
        // 加载API Key
        const apiKeyInput = document.getElementById(`${platform}-api-key`);
        if (apiKeyInput) {
            apiKeyInput.value = config.apiKey || '';
        }
        
        // 加载其他配置
        Object.keys(config).forEach(key => {
            const input = document.getElementById(`${platform}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
            if (input && config[key]) {
                input.value = config[key];
            }
        });
    }

    saveConfig() {
        if (!this.state.currentPlatform) {
            alert('请先选择一个AI平台');
            return;
        }
        
        const platform = this.state.currentPlatform;
        const config = {};
        
        // 收集该平台的所有配置
        document.querySelectorAll(`[id^="${platform}-"]`).forEach(input => {
            const key = input.id.replace(`${platform}-`, '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            config[key] = input.value;
        });
        
        // 保存到状态
        this.state.config[platform] = { ...this.state.config[platform], ...config };
        
        // 保存到本地存储
        Utils.storage.set(`ai_config_${platform}`, this.state.config[platform]);
        
        // 更新连接状态
        this.updateConnectionStatus(true);
        
        alert(`${this.platformConfigs[platform].name} 配置已保存`);
    }

    async testConnection() {
        if (!this.state.currentPlatform) {
            alert('请先选择一个AI平台');
            return;
        }
        
        const platform = this.state.currentPlatform;
        const config = this.state.config[platform];
        
        if (!config.apiKey) {
            alert('请先配置API密钥');
            return;
        }
        
        try {
            const response = await this.makeAPIRequest('测试连接', platform);
            alert(`${this.platformConfigs[platform].name} 连接成功！`);
        } catch (error) {
            alert(`${this.platformConfigs[platform].name} 连接失败：${error.message}`);
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        if (!this.state.currentPlatform) {
            alert('请先选择AI平台并配置API密钥');
            return;
        }
        
        // 添加用户消息
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // 显示加载状态
        const sendBtn = document.getElementById('sendBtn');
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="loading"></span> 发送中...';
        sendBtn.disabled = true;

        try {
            const response = await this.makeAPIRequest(message, this.state.currentPlatform);
            this.addMessage('assistant', response);
            this.updateStats(true, response.length);
        } catch (error) {
            this.addMessage('assistant', `错误: ${error.message}`);
            this.updateStats(false);
        } finally {
            sendBtn.innerHTML = originalText;
            sendBtn.disabled = false;
        }
    }

    async makeAPIRequest(message, platform) {
        const config = this.state.config[platform];
        const startTime = Date.now();
        
        let requestBody, headers, url;
        
        // 根据不同平台构建请求
        switch (platform) {
            case 'openai':
            case 'deepseek':
            case 'grok':
            case 'custom':
                requestBody = {
                    model: config.model || this.platformConfigs[platform].defaultModel,
                    messages: [{ role: 'user', content: message }],
                    temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
                    max_tokens: parseInt(document.getElementById('maxTokens')?.value || 2000),
                    top_p: parseFloat(document.getElementById('topP')?.value || 1)
                };
                
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                };
                
                if (config.orgId) {
                    headers['OpenAI-Organization'] = config.orgId;
                }
                
                url = config.baseUrl || 'https://api.openai.com/v1/chat/completions';
                break;
                
            case 'gemini':
                requestBody = {
                    contents: [{
                        parts: [{ text: message }]
                    }],
                    generationConfig: {
                        temperature: parseFloat(document.getElementById('temperature')?.value || 0.7),
                        maxOutputTokens: parseInt(document.getElementById('maxTokens')?.value || 2000),
                        topP: parseFloat(document.getElementById('topP')?.value || 1)
                    }
                };
                
                headers = {
                    'Content-Type': 'application/json'
                };
                
                url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`;
                break;
                
            case 'claude':
                requestBody = {
                    model: config.model || this.platformConfigs[platform].defaultModel,
                    max_tokens: parseInt(document.getElementById('maxTokens')?.value || 2000),
                    messages: [{ role: 'user', content: message }],
                    temperature: parseFloat(document.getElementById('temperature')?.value || 0.7)
                };
                
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01'
                };
                
                url = 'https://api.anthropic.com/v1/messages';
                break;
                
            default:
                throw new Error('不支持的平台');
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`API请求失败 ${response.status}: ${errorData}`);
        }
        
        const data = await response.json();
        const responseTime = Date.now() - startTime;
        
        this.state.stats.totalResponseTime += responseTime;
        
        // 解析不同平台的响应格式
        return this.parseResponse(data, platform);
    }

    parseResponse(data, platform) {
        switch (platform) {
            case 'openai':
            case 'deepseek':
            case 'grok':
            case 'custom':
                return data.choices?.[0]?.message?.content || JSON.stringify(data, null, 2);
                
            case 'gemini':
                return data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data, null, 2);
                
            case 'claude':
                return data.content?.[0]?.text || JSON.stringify(data, null, 2);
                
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const timestamp = Utils.formatTime(new Date());
        const platformIcon = this.state.currentPlatform ? this.platformConfigs[this.state.currentPlatform].icon : '🤖';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${role === 'user' ? '👤' : platformIcon}</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-text">${Utils.escapeHtml(content)}</div>
                    <div class="message-actions">
                        <button class="message-action" onclick="aiToolbox.copyMessage(this)">复制</button>
                        <button class="message-action" onclick="aiToolbox.regenerateMessage(this)">重新生成</button>
                    </div>
                </div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 保存对话
        this.saveConversation();
    }

    saveConversation() {
        const messages = Array.from(document.querySelectorAll('.message')).map(msg => ({
            role: msg.classList.contains('user') ? 'user' : 'assistant',
            content: msg.querySelector('.message-text').textContent,
            time: msg.querySelector('.message-time').textContent,
            platform: this.state.currentPlatform
        }));

        if (!this.state.conversations[this.state.currentPlatform]) {
            this.state.conversations[this.state.currentPlatform] = [];
        }
        
        this.state.conversations[this.state.currentPlatform].push({
            id: Utils.generateId(),
            messages: messages,
            timestamp: new Date().toISOString()
        });

        Utils.storage.set('ai_conversations', this.state.conversations);
    }

    loadConfig() {
        Object.keys(this.platformConfigs).forEach(platform => {
            const saved = Utils.storage.get(`ai_config_${platform}`);
            if (saved) {
                this.state.config[platform] = { ...this.state.config[platform], ...saved };
            }
        });
    }

    loadConversations() {
        const saved = Utils.storage.get('ai_conversations');
        if (saved) {
            this.state.conversations = saved;
        }
        this.renderHistory();
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById(`status-${this.state.currentPlatform}`);
        const statusIndicator = document.getElementById('connectionStatus');
        
        if (statusDot) {
            if (connected) {
                statusDot.classList.add('connected');
            } else {
                statusDot.classList.remove('connected');
            }
        }
        
        if (statusIndicator) {
            statusIndicator.className = connected ? 'status-indicator online' : 'status-indicator offline';
        }
    }

    updateStats(success = true, tokenCount = 0) {
        this.state.stats.totalRequests++;
        if (success) {
            this.state.stats.successRequests++;
        }
        this.state.stats.totalTokens += tokenCount;
        
        // 更新平台使用统计
        if (this.state.currentPlatform) {
            if (!this.state.stats.platformUsage[this.state.currentPlatform]) {
                this.state.stats.platformUsage[this.state.currentPlatform] = 0;
            }
            this.state.stats.platformUsage[this.state.currentPlatform]++;
        }

        // 更新显示
        const totalRequestsEl = document.getElementById('totalRequests');
        const totalTokensEl = document.getElementById('totalTokens');
        const avgResponseTimeEl = document.getElementById('avgResponseTime');
        const successRateEl = document.getElementById('successRate');
        
        if (totalRequestsEl) totalRequestsEl.textContent = this.state.stats.totalRequests;
        if (totalTokensEl) totalTokensEl.textContent = this.state.stats.totalTokens;
        if (avgResponseTimeEl) {
            avgResponseTimeEl.textContent = Math.round(this.state.stats.totalResponseTime / this.state.stats.totalRequests) + 'ms';
        }
        if (successRateEl) {
            successRateEl.textContent = Math.round((this.state.stats.successRequests / this.state.stats.totalRequests) * 100) + '%';
        }
    }

    switchTab(tabName) {
        // 隐藏所有面板
        document.querySelectorAll('.workspace-pane').forEach(pane => {
            pane.style.display = 'none';
        });

        // 显示选中的面板
        document.getElementById(tabName + 'Pane').style.display = 'flex';

        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.nav-item').classList.add('active');

        this.state.currentTab = tabName;
    }

    copyMessage(btn) {
        const text = btn.closest('.message-content').querySelector('.message-text').textContent;
        Utils.copyToClipboard(text);
        btn.textContent = '已复制';
        setTimeout(() => btn.textContent = '复制', 2000);
    }

    regenerateMessage(btn) {
        alert('重新生成功能开发中...');
    }

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    }

    exportData() {
        const data = {
            conversations: this.state.conversations,
            config: this.state.config,
            stats: this.state.stats
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-toolbox-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.conversations) this.state.conversations = data.conversations;
                    if (data.config) this.state.config = { ...this.state.config, ...data.config };
                    if (data.stats) this.state.stats = data.stats;
                    
                    this.loadConfig();
                    this.loadConversations();
                    this.updateStats();
                    alert('导入成功');
                } catch (error) {
                    alert('导入失败：' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        Object.keys(this.state.conversations).forEach(platform => {
            this.state.conversations[platform].forEach(conv => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; color: var(--text-secondary);">${Utils.formatDate(conv.timestamp)}</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${this.platformConfigs[platform]?.name || platform}</span>
                    </div>
                    <div style="font-weight: 500; margin-bottom: 4px; color: var(--text-primary);">${Utils.escapeHtml(conv.messages[0]?.content || '').substring(0, 50)}...</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">${Utils.escapeHtml(conv.messages[1]?.content || '').substring(0, 200)}...</div>
                `;
                item.onclick = () => this.loadConversation(platform, conv.id);
                historyList.appendChild(item);
            });
        });
    }

    loadConversation(platform, id) {
        const conv = this.state.conversations[platform]?.find(c => c.id === id);
        if (!conv) return;

        // 切换到该平台
        this.selectPlatform(platform);
        
        // 显示对话内容
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';

        conv.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role}`;
            messageDiv.innerHTML = `
                <div class="message-avatar">${msg.role === 'user' ? '👤' : this.platformConfigs[platform]?.icon}</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="message-text">${Utils.escapeHtml(msg.content)}</div>
                    </div>
                    <div class="message-time">${msg.time}</div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        });

        this.switchTab('chat');
    }

    showSettings() {
        alert('设置功能开发中...');
    }

    attachFile() {
        alert('文件上传功能开发中...');
    }

    processBatch() {
        const input = document.getElementById('batchInput');
        const output = document.getElementById('batchOutput');
        const requests = input.value.split('\n').filter(line => line.trim());
        
        if (requests.length === 0) {
            alert('请输入要处理的请求');
            return;
        }
        
        if (!this.state.currentPlatform) {
            alert('请先选择AI平台');
            return;
        }
        
        output.value = '开始处理...\n';
        
        requests.forEach(async (request, index) => {
            try {
                const response = await this.makeAPIRequest(request, this.state.currentPlatform);
                output.value += `${index + 1}. ${request}\n${response}\n\n`;
            } catch (error) {
                output.value += `${index + 1}. ${request}\n错误: ${error.message}\n\n`;
            }
        });
    }

    clearBatch() {
        document.getElementById('batchInput').value = '';
        document.getElementById('batchOutput').value = '';
    }

    copyBatchResults() {
        const output = document.getElementById('batchOutput');
        Utils.copyToClipboard(output.value);
        alert('结果已复制到剪贴板');
    }

    exportBatchResults() {
        const output = document.getElementById('batchOutput').value;
        const blob = new Blob([output], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-results-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportHistory() {
        this.exportData();
    }

    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.state.conversations = [];
            Utils.storage.remove('ai_conversations');
            this.renderHistory();
            alert('历史记录已清空');
        }
    }
}

// 全局函数绑定
window.aiToolbox = null;

// 初始化AI工具箱
document.addEventListener('DOMContentLoaded', () => {
    window.aiToolbox = new AIToolbox();
    
    // 绑定全局函数
    window.selectPlatform = (platform) => aiToolbox.selectPlatform(platform);
    window.switchTab = (tabName) => aiToolbox.switchTab(tabName);
    window.saveConfig = () => aiToolbox.saveConfig();
    window.testConnection = () => aiToolbox.testConnection();
    window.sendMessage = () => aiToolbox.sendMessage();
    window.toggleSidebar = () => aiToolbox.toggleSidebar();
    window.exportData = () => aiToolbox.exportData();
    window.importData = () => aiToolbox.importData();
    window.showSettings = () => aiToolbox.showSettings();
    window.attachFile = () => aiToolbox.attachFile();
    window.processBatch = () => aiToolbox.processBatch();
    window.clearBatch = () => aiToolbox.clearBatch();
    window.copyBatchResults = () => aiToolbox.copyBatchResults();
    window.exportBatchResults = () => aiToolbox.exportBatchResults();
    window.exportHistory = () => aiToolbox.exportHistory();
    window.clearHistory = () => aiToolbox.clearHistory();
});
