// 合并的通用工具（包含基础 Utils 与增强模块）
// 以下内容来源于项目工具集合，确保在服务端和本地环境下都可用

// 基础 Utils 定义（如果已存在则保留）
const Utils = window.Utils || {
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 复制到剪贴板
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('复制成功');
                this.showToast('复制成功');
            }).catch(err => {
                console.error('复制失败:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    },

    // 备用复制方法
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('复制成功');
        } catch (err) {
            console.error('复制失败:', err);
            this.showToast('复制失败');
        }
        
        document.body.removeChild(textArea);
    },

    // 显示提示消息
    showToast(message, type = 'info') {
        // 移除现有提示
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // 添加样式（仅添加一次）
        if (!document.querySelector('#toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: white;
                    font-size: 14px;
                    z-index: 10000;
                    animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                .toast-info { background: #3498db; }
                .toast-success { background: #2ecc71; }
                .toast-error { background: #e74c3c; }
                .toast-warning { background: #f39c12; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    },

    // 生成随机ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // 格式化时间
    formatTime(date) {
        try {
            return new Date(date).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '';
        }
    },

    // 格式化日期
    formatDate(date) {
        try {
            return new Date(date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return '';
        }
    },

    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // 本地存储
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('存储失败:', e);
                return false;
            }
        },

        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('读取失败:', e);
                return null;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('删除失败:', e);
                return false;
            }
        },

        // 检查存储可用性
        isAvailable() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        }
    },

    // 检测设备类型
    detectDevice() {
        const userAgent = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    },

    // 检测浏览器
    detectBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) return 'IE';
        return 'Unknown';
    },

    // 检测网络状态
    isOnline() {
        return navigator.onLine;
    },

    // 加载字体
    loadFont(fontFamily, src) {
        const font = new FontFace(fontFamily, `url(${src})`);
        font.load().then(() => {
            document.fonts.add(font);
            console.log(`字体 ${fontFamily} 加载成功`);
        }).catch(err => {
            console.error(`字体 ${fontFamily} 加载失败:`, err);
        });
    }
};

// 增强模块：网络检测、页面加载器、错误处理、性能监控、主题与国际化
Utils.network = {
    checkConnection() {
        if (!navigator.onLine) {
            Utils.showToast('网络连接已断开', 'error');
            return false;
        }
        return true;
    },

    async testConnection() {
        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
            return true;
        } catch (error) {
            return false;
        }
    }
};

Utils.pageLoader = {
    show() {
        if (document.getElementById('pageLoader')) return;
        const loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        loader.appendChild(spinner);
        document.body.appendChild(loader);
        loader.offsetHeight;
        loader.style.opacity = '1';
    },
    hide() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }
};

Utils.errorHandler = {
    handle(error, context = '') {
        console.error(`Error in ${context}:`, error);
        if (error && (error.name === 'NetworkError' || (error.message && error.message.includes('fetch')))) {
            Utils.showToast('网络连接失败，请检查网络设置', 'error');
        } else if (error && error.name === 'TypeError') {
            Utils.showToast('操作失败，请重试', 'error');
        } else {
            Utils.showToast('发生未知错误，请联系管理员', 'error');
        }
        this.logError(error, context);
    },
    logError(error, context) {
        const errorLog = {
            message: error?.message || String(error),
            stack: error?.stack || null,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        console.log('Error logged:', errorLog);
    }
};

Utils.performance = {
    measurePageLoad() {
        window.addEventListener('load', () => {
            try {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData?.loadEventEnd - perfData?.loadEventStart || 0;
                console.log(`Page load time: ${loadTime}ms`);
                console.log(`Welcome to CBZ STUDIO\n`);
                console.log(`Hello Devloper`);
            } catch (e) {
                // ignore
            }
        });
    },
    measureFunction(name, fn) {
        return function(...args) {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();
            console.log(`${name} took ${end - start}ms`);
            return result;
        };
    }
};

Utils.theme = {
    current: 'light',
    set(theme) {
        if (theme === 'dark') document.body.classList.add('dark-theme'); else document.body.classList.remove('dark-theme');
        this.current = theme;
        Utils.storage.set('theme', theme);
    },
    toggle() { this.set(this.current === 'light' ? 'dark' : 'light'); },
    init() { const savedTheme = Utils.storage.get('theme') || 'light'; this.set(savedTheme); }
};

Utils.i18n = {
    current: 'zh-CN',
    translations: {
        'zh-CN': { loading: '加载中...', error: '错误', success: '成功', networkError: '网络错误', retry: '重试', cancel: '取消', confirm: '确认' },
        'en-US': { loading: 'Loading...', error: 'Error', success: 'Success', networkError: 'Network Error', retry: 'Retry', cancel: 'Cancel', confirm: 'Confirm' }
    },
    t(key) { return this.translations[this.current][key] || key; },
    setLang(lang) { this.current = lang; Utils.storage.set('language', lang); },
    init() { const savedLang = Utils.storage.get('language') || 'zh-CN'; this.setLang(savedLang); }
};

// 初始化增强功能
document.addEventListener('DOMContentLoaded', () => {
    try {
        Utils.theme.init();
        Utils.i18n.init();
        Utils.performance.measurePageLoad();
        window.addEventListener('online', () => Utils.showToast('网络已连接', 'success'));
        window.addEventListener('offline', () => Utils.showToast('网络已断开', 'error'));
        window.addEventListener('error', (e) => { Utils.errorHandler.handle(e.error || e, 'Global Error'); });
        window.addEventListener('unhandledrejection', (e) => { Utils.errorHandler.handle(e.reason || e, 'Unhandled Promise Rejection'); });
        Utils.pageLoader.hide();
    } catch (e) {
        // 防御性处理，避免阻断其他脚本
        console.error('Utils init error', e);
    }
});

// 可选：显示页面加载器（仅在需要时）
// Utils.pageLoader.show();

// 导出到全局
window.Utils = Utils;
