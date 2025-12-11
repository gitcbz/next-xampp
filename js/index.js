/*
    ©CBZ Studio版权所有
    Version 0.0.2beta Fix1
*/
// 主页脚本
class IndexPage {
    constructor() {
        // 确保Utils存在
        if (typeof Utils === 'undefined') {
            console.error('Utils对象未定义，请确保common.js已正确加载');
            return;
        }
        
        // 支持多个彩蛋代码，对应不同的视频
        this.eggCodes = {
            '20130211': '/files/egg.mp4',  //cbz表示：ヾ(≧▽≦*)o
            '20130219': '/files/egg2.mp4'  //测试使用
        };
        this.lastEggCode = null;
        this.eggTriggerCount = 0;
        this.eggTriggerTimeout = null;
        this.searchInput = null;
        this.searchBtn = null;
        this.searchSuggestions = null;
        
        // 缩放相关属性
        this.scale = 1;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupPage();
            });
        } else {
            this.setupPage();
        }
    }

    setupPage() {
        // 立即初始化背景
        this.initBackground();
        
        // 初始化缩放处理
        this.initScaleHandling();
        
        // 初始化彩蛋统计
        this.initEggStats();
        
        // 然后初始化其他功能
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.initKeyboardEgg();
        this.initSearchEgg();
        this.checkLoginStatus();
        // 检查是否需要根据当前日期自动触发彩蛋（2月11日和2月19日）
        try {
            this.checkAutoTriggerEgg();
        } catch (e) {
            console.warn('自动触发彩蛋检查失败', e);
        }
    }

    // 新增：根据日期自动触发彩蛋（避免在非期望日期触发）
    checkAutoTriggerEgg() {
        try {
            const today = new Date();
            const month = today.getMonth() + 1; // 1-12
            const day = today.getDate();

            if (month === 2 && day === 11 && this.eggCodes['20130211']) {
                const year = today.getFullYear();
                const key = `egg_auto_triggered_20130211_${year}`;
                // 每年仅触发一次（持久化到本地存储，包含年份）
                if (typeof Utils !== 'undefined' && Utils.storage && Utils.storage.get(key)) return;
                this.lastEggCode = '20130211';
                // 稍微延迟，确保页面其他初始化完成
                setTimeout(() => {
                    const modal = document.getElementById('eggModal');
                    if (!modal || !modal.classList.contains('active')) {
                        this.triggerSearchEgg();
                        try { if (typeof Utils !== 'undefined' && Utils.storage) Utils.storage.set(key, true); } catch(e) {}
                    }
                }, 600);
                return;
            }

            if (month === 2 && day === 19 && this.eggCodes['20130219']) {
                const year = today.getFullYear();
                const key = `egg_auto_triggered_20130219_${year}`;
                if (typeof Utils !== 'undefined' && Utils.storage && Utils.storage.get(key)) return;
                this.lastEggCode = '20130219';
                setTimeout(() => {
                    const modal = document.getElementById('eggModal');
                    if (!modal || !modal.classList.contains('active')) {
                        this.triggerSearchEgg();
                        try { if (typeof Utils !== 'undefined' && Utils.storage) Utils.storage.set(key, true); } catch(e) {}
                    }
                }, 600);
                return;
            }
        } catch (e) {
            console.error('checkAutoTriggerEgg error', e);
        }
    }

    // 新增：初始化彩蛋统计
    initEggStats() {
        const eggCount = Utils.storage.get('eggCount') || 0;
        document.getElementById('eggCount').textContent = eggCount;
        document.getElementById('triggerTime').textContent = new Date().toLocaleString('zh-CN');
    }

    initEventListeners() {
        // 添加窗口大小变化监听
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 功能卡片点击事件
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCardClick(e);
            });
        });

        // 功能按钮点击事件
        document.querySelectorAll('.feature-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const card = e.target.closest('.feature-card');
                if (card) {
                    this.handleCardClick({ currentTarget: card });
                }
            });
        });

        // 社交链接点击事件
        document.querySelectorAll('.social-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSocialLink(e);
            });
        });

        // 导航链接点击事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavLink(e);
            });
        });

        // 彩蛋模态框外部点击关闭
        document.getElementById('eggModal').addEventListener('click', (e) => {
            if (e.target.id === 'eggModal') {
                this.closeEggModal();
            }
        });

        // 取消 logo 上任何跳转行为，防止点击图标跳转
        const logoEl = document.getElementById('mainLogo');
        if (logoEl) {
            try {
                // 移除内联 onclick
                logoEl.onclick = null;
                logoEl.removeAttribute && logoEl.removeAttribute('onclick');
            } catch (e) {}
            // 绑定一个阻止传播的空处理，确保不会触发其它全局跳转
            logoEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof Utils !== 'undefined' && Utils.showToast) {
                    Utils.showToast('Logo 已禁用跳转', 'info');
                }
            });
        }

        // ESC键关闭彩蛋模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEggModal();
            }
        });
    }

    // 修复：处理导航链接
    handleNavLink(event) {
        const link = event.target.closest('.nav-link');
        if (!link) return;
        
        const href = link.getAttribute('href') || link.textContent;
        
        switch(href) {
            case '#about':
                this.showAbout();
                break;
            case '#contact':
                this.showContact();
                break;
            default:
                console.log('未知导航链接:', href);
        }
    }

    // 修复：处理卡片点击
    handleCardClick(event) {
        const card = event.currentTarget;
        const title = card.querySelector('.feature-title').textContent;
        
        this.addClickEffect(event);
        this.createParticles(event);
        
        setTimeout(() => {
            this.navigateBasedOnTitle(title);
        }, 500);
    }

    // 修复：基于标题导航
    // 在IndexPage类中找到navigateBasedOnTitle方法，更新为：

navigateBasedOnTitle(title) {
    switch(title) {
        case '游戏中心':
            this.navigateToGame();
            break;
        case '本地云盘':
            this.navigateToCloud();
            break;
        case '学习中心':
            this.navigateToLearn();
            break;
        case 'AI工具箱':
            this.navigateToAI();
            break;
        case '帖子系统':
            this.navigateToTalk();
            break;
        case '聊天室':
            this.navigateToChat();
            break;
        case '邮件':
            this.navigateToMail();
            break;
        case 'SChat':
        case 'S Chat':
        case 'S-Chat':
            this.navigateToSChat();
            break;
        default:
            console.log('未知标题:', title);
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('未知的功能模块', 'error');
            }
    }
}

// 添加新方法
navigateToTalk() {
    this.navigateWithLoading('talk/index.html', '帖子系统');
}

navigateToChat() {
    // 外部链接需要特殊处理
    if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('正在跳转到聊天室...', 'info');
    }
    
    // 添加页面过渡效果
    const transition = document.createElement('div');
    transition.className = 'page-transition active';
    document.body.appendChild(transition);
    
    // 延迟跳转到外部链接
    setTimeout(() => {
        try {
            window.open('https://chat-pro.cbzstudio.qzz.io', '_blank');
        } catch (error) {
            console.error('跳转失败:', error);
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('跳转失败，请手动访问: chat-pro.cbzstudio.qzz.io', 'error');
            }
        }
        // 移除过渡效果
        setTimeout(() => {
            transition.remove();
        }, 500);
    }, 500);
}

// 更新performSearch方法
performSearch(query) {
    const searchMap = {
        '游戏': 'game',
        '游戏中心': 'game',
        '云盘': 'cloud',
        '本地云盘': 'cloud',
        '学习': 'learn',
        '学习中心': 'learn',
        'ai': 'ai',
        '人工智能': 'ai',
        'ai工具箱': 'ai',
        '帖子': 'talk',
        '帖子系统': 'talk',
        '聊天': 'chat',
        '聊天室': 'chat',
        '邮件': 'mail',
        'mail': 'mail',
        'schat': 'schat',
        's chat': 'schat',
        's-chat': 'schat'
    };

    const target = searchMap[query.toLowerCase()];
    if (target) {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(`正在跳转到${query}...`, 'info');
        }
        setTimeout(() => {
            switch(target) {
                case 'game':
                    this.navigateToGame();
                    break;
                case 'cloud':
                    this.navigateToCloud();
                    break;
                case 'learn':
                    this.navigateToLearn();
                    break;
                case 'ai':
                    this.navigateToAI();
                    break;
                case 'talk':
                    this.navigateToTalk();
                    break;
                case 'chat':
                    this.navigateToChat();
                    break;
                case 'mail':
                    this.navigateToMail();
                    break;
                case 'schat':
                    this.navigateToSChat();
                    break;
            }
        }, 1000);
    } else {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(`未找到"${query}"相关功能`, 'warning');
        }
    }
}


    // 修复：导航到游戏中心
    navigateToGame() {
        this.navigateWithLoading('game/index.html', '游戏中心');
    }

    // 修复：导航到云盘
    navigateToCloud() {
        this.navigateWithLoading('cloud/index.html', '本地云盘');
    }

    // 修复：导航到学习中心
    navigateToLearn() {
        this.navigateWithLoading('learn/index.html', '学习中心');
    }

    // 修复：导航到AI工具箱
    navigateToAI() {
        this.navigateWithLoading('ai/index.html', 'AI工具箱');
    }

    // 新增：导航到邮箱（外部站点）
    navigateToMail() {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('正在打开邮箱...', 'info');
        }

        const transition = document.createElement('div');
        transition.className = 'page-transition active';
        document.body.appendChild(transition);

        setTimeout(() => {
            try {
                window.open('https://mail.cbzstudio.qzz.io', '_blank');
            } catch (error) {
                console.error('打开邮箱失败:', error);
                if (typeof Utils !== 'undefined' && Utils.showToast) {
                    Utils.showToast('打开邮箱失败，请手动访问: mail.cbzstudio.qzz.io', 'error');
                }
            }

            setTimeout(() => transition.remove(), 500);
        }, 200);
    }

    // 新增：导航到 SChat（外部站点）
    navigateToSChat() {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('正在打开 SChat...', 'info');
        }

        const transition = document.createElement('div');
        transition.className = 'page-transition active';
        document.body.appendChild(transition);

        setTimeout(() => {
            try {
                window.open('https://chat2.cbzstudio.qzz.io', '_blank');
            } catch (error) {
                console.error('打开 SChat 失败:', error);
                if (typeof Utils !== 'undefined' && Utils.showToast) {
                    Utils.showToast('打开 SChat 失败，请手动访问: chat2.cbzstudio.qzz.io', 'error');
                }
            }

            setTimeout(() => transition.remove(), 500);
        }, 200);
    }

    // 修复：带加载效果的导航
    navigateWithLoading(url, moduleName) {
        // 显示加载提示
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(`正在跳转到${moduleName}...`, 'info');
        }
        
        // 添加页面过渡效果
        const transition = document.createElement('div');
        transition.className = 'page-transition active';
        document.body.appendChild(transition);
        
        // 延迟跳转
        setTimeout(() => {
            try {
                window.location.href = url;
            } catch (error) {
                console.error('跳转失败:', error);
                if (typeof Utils !== 'undefined' && Utils.showToast) {
                    Utils.showToast('跳转失败，请重试', 'error');
                }
                // 移除过渡效果
                transition.remove();
            }
        }, 200);
    }

    // 修复：处理社交链接
    handleSocialLink(event) {
        const link = event.currentTarget;
        const platform = link.textContent.trim();
        
        const socialUrls = {
            '📧': 'mailto:gitcbz@outlook.com',
            '💬': '#',
            '🐦': '#',
            '📷': '#'
        };
        
        const url = socialUrls[link.textContent] || '#';
        
        if (url.startsWith('#')) {
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('社交链接开发中...', 'info');
            }
        } else {
            window.open(url, '_blank');
        }
    }

    // 修复：搜索框彩蛋初始化
    initSearchEgg() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchSuggestions = document.getElementById('searchSuggestions');

        if (this.searchInput) {
            // 输入事件
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            // 回车事件
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearchSubmit(e.target.value);
                }
            });

            // 焦点事件
            this.searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });

            // 失焦事件
            this.searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSearchSuggestions();
                }, 200);
            });
        }

        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => {
                this.handleSearchSubmit(this.searchInput.value);
            });
        }

        // 搜索建议点击事件
        if (this.searchSuggestions) {
            this.searchSuggestions.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-item')) {
                    this.searchInput.value = e.target.textContent;
                    this.handleSearchSubmit(e.target.textContent);
                    this.hideSearchSuggestions();
                }
            });
        }
    }

    // 修复：处理搜索输入
    handleSearchInput(value) {
        // 检查是否输入了彩蛋代码（支持多个）
        if (this.eggCodes[value]) {
            this.lastEggCode = value;
            const searchBox = document.querySelector('.search-box');
            if (searchBox) {
                searchBox.classList.add('egg-triggered');
                setTimeout(() => {
                    searchBox.classList.remove('egg-triggered');
                }, 2000);
            }
        }

        // 显示搜索建议
        this.showSearchSuggestions();
    }

    // 修复：处理搜索提交
    handleSearchSubmit(value) {
        const trimmedValue = value.trim();
        
        // 检查彩蛋代码（支持多个）
        if (this.eggCodes[trimmedValue]) {
            this.lastEggCode = trimmedValue;
            this.triggerSearchEgg();
            return;
        }

        // 处理正常搜索
        if (trimmedValue) {
            this.performSearch(trimmedValue);
        }
        
        this.hideSearchSuggestions();
    }

    // 修复：执行搜索
    performSearch(query) {
        const searchMap = {
            '游戏': 'game',
            '游戏中心': 'game',
            '云盘': 'cloud',
            '本地云盘': 'cloud',
            '学习': 'learn',
            '学习中心': 'learn',
            'ai': 'ai',
            '人工智能': 'ai',
            'ai工具箱': 'ai',
            '邮件': 'mail',
            'mail': 'mail',
            'schat': 'schat',
            's chat': 'schat',
            's-chat': 'schat'
        };

        const target = searchMap[query.toLowerCase()];
        if (target) {
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast(`正在跳转到${query}...`, 'info');
            }
            setTimeout(() => {
                switch(target) {
                    case 'game':
                        this.navigateToGame();
                        break;
                    case 'cloud':
                        this.navigateToCloud();
                        break;
                    case 'learn':
                        this.navigateToLearn();
                        break;
                    case 'ai':
                        this.navigateToAI();
                        break;
                    case 'chat':
                        this.navigateToChat();
                        break;
                    case 'mail':
                        this.navigateToMail();
                        break;
                    case 'schat':
                        this.navigateToSChat();
                        break;
                }
            }, 200);
        } else {
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast(`未找到"${query}"相关功能`, 'warning');
            }
        }
    }

    // 修复：键盘快捷键
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 检查是否在输入框中
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'g':
                        e.preventDefault();
                        this.navigateToGame();
                        break;
                    case 'c':
                        e.preventDefault();
                        this.navigateToCloud();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.navigateToLearn();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.navigateToAI();
                        break;
                }
            }
        });
    }

    // 修复：触发搜索框彩蛋
    triggerSearchEgg() {
        // 显示彩蛋触发提示
        this.showEggTriggerHint();
        
        // 添加搜索框特效
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.classList.add('egg-triggered');
            this.createSearchEggParticles(searchBox);
        }
        
        // 延迟显示彩蛋模态框（在 showEggModal 中会根据 lastEggCode 选择视频）
        setTimeout(() => {
            this.showEggModal();
        }, 2000);
    }

    // 新增：显示彩蛋模态框
    showEggModal() {
        const modal = document.getElementById('eggModal');
        if (modal) {
            // 更新统计信息
            const eggCount = Utils.storage.get('eggCount') || 0;
            Utils.storage.set('eggCount', eggCount + 1);
            document.getElementById('eggCount').textContent = eggCount + 1;
            document.getElementById('triggerTime').textContent = new Date().toLocaleString('zh-CN');
            
            // 显示模态框并锁定页面滚动，添加 body 类用于样式控制
            modal.classList.add('active');
            document.body.classList.add('egg-open');
            try { document.body.style.overflow = 'hidden'; } catch (e) {}

            // 初始化视频
            this.initEggVideo();

            // 播放触发音效
            this.playEggTriggerSound();
        }
    }

    // 新增：关闭彩蛋模态框
    closeEggModal() {
        const modal = document.getElementById('eggModal');
        if (modal) {
            modal.classList.remove('active');

            // 恢复页面滚动
            document.body.classList.remove('egg-open');
            try { document.body.style.overflow = ''; } catch (e) {}

            // 暂停视频
            const video = document.getElementById('eggVideo');
            if (video) {
                video.pause();
            }
        }
    }

    // 新增：初始化彩蛋视频
    initEggVideo() {
        const video = document.getElementById('eggVideo');
        if (video) {
            // 根据 lastEggCode 动态设置视频源
            try {
                if (this.lastEggCode && this.eggCodes[this.lastEggCode]) {
                    // 直接设置 video.src 会替换所有 <source>，然后 load()
                    video.src = this.eggCodes[this.lastEggCode];
                    video.load();
                }
            } catch (e) {
                console.warn('设置彩蛋视频源失败，使用默认源', e);
            }
            // 重置视频
            video.currentTime = 0;
            
            // 尝试自动播放
            video.play().catch(error => {
                console.log('视频自动播放失败:', error);
            });
            
            // 监听视频结束
            video.addEventListener('ended', () => {
                // 视频结束后重新播放
                setTimeout(() => {
                    video.currentTime = 0;
                    video.play().catch(() => {});
                }, 2000);
            });
        }
    }

    // 修复：显示关于信息
    showAbout() {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('CBZ Studio - Code the world.', 'info');
        }
    }

    // 修复：显示联系方式
    showContact() {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('联系我们：gitcbz@outlook.com.com', 'info');
        }
    }

    // 其他方法保持不变...
    initScaleHandling() {
        // 保留双击防缩放，但不要阻止多指/gesture 缩放（允许用户缩放以提高可访问性）
        // 仅在 touchend 中处理双击防缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // 监听视口变化
        this.handleViewportChange();
        
        // 监听设备方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportChange();
            }, 100);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleViewportChange() {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        
        const widthRatio = currentWidth / this.viewportWidth;
        const heightRatio = currentHeight / this.viewportHeight;
        
        if (Math.abs(widthRatio - 1) > 0.1 || Math.abs(heightRatio - 1) > 0.1) {
            this.adjustForScale();
        }
        
        this.viewportWidth = currentWidth;
        this.viewportHeight = currentHeight;
    }

    adjustForScale() {
        this.adjustBackgroundElements();
        this.adjustCardLayout();
        this.adjustFontSizes();
    }

    adjustBackgroundElements() {
        const bgAnimation = document.querySelector('.bg-animation');
        const geometricBg = document.querySelector('.geometric-bg');
        
        if (bgAnimation) {
            bgAnimation.style.width = window.innerWidth + 'px';
            bgAnimation.style.height = window.innerHeight + 'px';
            
            Array.from(bgAnimation.children).forEach((span, index) => {
                const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                span.style.transform = `scale(${scale})`;
            });
        }
        
        if (geometricBg) {
            geometricBg.style.width = window.innerWidth + 'px';
            geometricBg.style.height = window.innerHeight + 'px';
            
            Array.from(geometricBg.children).forEach((shape, index) => {
                const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                shape.style.transform = `scale(${scale})`;
            });
        }
    }

    adjustCardLayout() {
        const cards = document.querySelectorAll('.feature-card');
        const container = document.querySelector('.features-container');
        
        if (cards.length > 0 && container) {
            const containerWidth = container.offsetWidth();
            const cardMinWidth = 280;
            const gap = 40;
            
            let columns = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
            columns = Math.max(1, Math.min(columns, cards.length));
            
            container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            
            const cardHeight = Math.min(400, window.innerHeight * 0.4);
            cards.forEach(card => {
                card.style.height = cardHeight + 'px';
            });
        }
    }

    adjustFontSizes() {
        const baseWidth = 1920;
        const currentWidth = window.innerWidth;
        const scale = Math.min(currentWidth / baseWidth, 1.5);
        
        const title = document.querySelector('.main-title');
        if (title) {
            const baseFontSize = 64;
            const newFontSize = Math.max(36, baseFontSize * scale);
            title.style.fontSize = newFontSize + 'px';
        }
        
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            const baseFontSize = 24;
            const newFontSize = Math.max(16, baseFontSize * scale);
            subtitle.style.fontSize = newFontSize + 'px';
        }
        
        document.querySelectorAll('.feature-title').forEach(title => {
            const baseFontSize = 28;
            const newFontSize = Math.max(20, baseFontSize * scale);
            title.style.fontSize = newFontSize + 'px';
        });
        
        document.querySelectorAll('.feature-description').forEach(desc => {
            const baseFontSize = 16;
            const newFontSize = Math.max(14, baseFontSize * scale);
            desc.style.fontSize = newFontSize + 'px';
        });
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.handleViewportChange();
            this.handleResize();
        }, 100);
    }

    initBackground() {
        this.createBackgroundAnimation();
        this.createGeometricBackground();
        this.ensureBackgroundStyles();
        this.adjustBackgroundElements();
    }

    createBackgroundAnimation() {
        let bgAnimation = document.querySelector('.bg-animation');
        
        if (!bgAnimation) {
            bgAnimation = document.createElement('div');
            bgAnimation.className = 'bg-animation';
            
            bgAnimation.style.cssText = `
                position: fixed !important;
                width: ${window.innerWidth}px !important;
                height: ${window.innerHeight}px !important;
                top: 0 !important;
                left: 0 !important;
                z-index: -1 !important;
                opacity: 0.3 !important;
                pointer-events: none !important;
                overflow: hidden !important;
            `;
            
            if (document.body.firstChild) {
                document.body.insertBefore(bgAnimation, document.body.firstChild);
            } else {
                document.body.appendChild(bgAnimation);
            }
        }
        
        while (bgAnimation.children.length < 10) {
            const span = document.createElement('span');
            const size = Math.random() * 30 + 10;
            const duration = Math.random() * 15 + 10;
            
            span.style.cssText = `
                position: absolute !important;
                display: block !important;
                width: ${size}px !important;
                height: ${size}px !important;
                background: rgba(255, 255, 255, 0.2) !important;
                animation: move ${duration}s linear infinite !important;
                bottom: -150px !important;
                left: ${Math.random() * 100}% !important;
                border-radius: ${Math.random() * 50}% !important;
            `;
            
            bgAnimation.appendChild(span);
        }
    }

    createGeometricBackground() {
        let geometricBg = document.querySelector('.geometric-bg');
        
        if (!geometricBg) {
            geometricBg = document.createElement('div');
            geometricBg.className = 'geometric-bg';
            
            geometricBg.style.cssText = `
                position: fixed !important;
                width: ${window.innerWidth}px !important;
                height: ${window.innerHeight}px !important;
                top: 0 !important;
                left: 0 !important;
                z-index: -1 !important;
                overflow: hidden !important;
                pointer-events: none !important;
            `;
            
            const bgAnimation = document.querySelector('.bg-animation');
            if (bgAnimation && bgAnimation.nextSibling) {
                document.body.insertBefore(geometricBg, bgAnimation.nextSibling);
            } else if (document.body.firstChild) {
                document.body.insertBefore(geometricBg, document.body.firstChild);
            } else {
                document.body.appendChild(geometricBg);
            }
        }
        
        while (geometricBg.children.length < 4) {
            this.createGeometricShape(geometricBg, geometricBg.children.length);
        }
    }

    createGeometricShape(container, index) {
        const shape = document.createElement('div');
        shape.className = 'geo-shape';
        
        const configs = [
            {
                top: '10%',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                delay: '0s'
            },
            {
                top: '60%',
                left: '80%',
                width: '200px',
                height: '200px',
                background: 'linear-gradient(45deg, #f9ca24, #f0932b)',
                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                delay: '5s'
            },
            {
                top: '30%',
                left: '70%',
                width: '150px',
                height: '150px',
                background: 'linear-gradient(45deg, #6c5ce7, #a29bfe)',
                borderRadius: '50%',
                delay: '10s'
            },
            {
                top: '70%',
                left: '20%',
                width: '250px',
                height: '250px',
                background: 'linear-gradient(45deg, #00b894, #00cec9)',
                clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
                delay: '15s'
            }
        ];
        
        const config = configs[index % configs.length];
        
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        const adjustedWidth = parseInt(config.width) * scale;
        const adjustedHeight = parseInt(config.height) * scale;
        
        shape.style.cssText = `
            position: absolute !important;
            top: ${config.top} !important;
            left: ${config.left} !important;
            width: ${adjustedWidth}px !important;
            height: ${adjustedHeight}px !important;
            background: ${config.background} !important;
            ${config.clipPath ? `clip-path: ${config.clipPath} !important;` : ''}
            ${config.borderRadius ? `border-radius: ${config.borderRadius} !important;` : ''}
            opacity: 0.1 !important;
            animation: float 20s infinite ease-in-out !important;
            animation-delay: ${config.delay} !important;
            pointer-events: none !important;
            transform: scale(${scale}) !important;
        `;
        
        container.appendChild(shape);
    }

    ensureBackgroundStyles() {
        if (!document.querySelector('#backgroundKeyframes')) {
            const style = document.createElement('style');
            style.id = 'backgroundKeyframes';
            style.textContent = `
                @keyframes move {
                    0% { 
                        transform: translateY(0) rotate(0deg); 
                        opacity: 1; 
                        border-radius: 0; 
                    }
                    100% { 
                        transform: translateY(-100vh) rotate(720deg); 
                        opacity: 0; 
                        border-radius: 50%; 
                    }
                }
                
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0) rotate(0deg); 
                    }
                    33% { 
                        transform: translateY(-20px) rotate(120deg); 
                    }
                    66% { 
                        transform: translateY(10px) rotate(240deg); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    addClickEffect(event) {
        const card = event.currentTarget;
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = '';
        }, 200);
    }

    createParticles(event) {
        const colors = ['#00d2ff', '#3a7bd5', '#667eea', '#764ba2'];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.position = 'fixed';
            particle.style.left = event.clientX + 'px';
            particle.style.top = event.clientY + 'px';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 100 + Math.random() * 100;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;
            
            particle.style.animation = `particleAnimation 1s ease-out forwards`;
            particle.style.setProperty('--x', x + 'px');
            particle.style.setProperty('--y', y + 'px');
            
            if (!document.querySelector('#particleStyles')) {
                const style = document.createElement('style');
                style.id = 'particleStyles';
                style.textContent = `
                    @keyframes particleAnimation {
                        0% { transform: translate(0, 0) scale(1); opacity: 1; }
                        100% { transform: translate(var(--x), var(--y)) scale(0); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    showEggTriggerHint() {
        let hint = document.querySelector('.egg-trigger-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'egg-trigger-hint';
            hint.innerHTML = `
                <span class="emoji">🎉</span>
                <div>恭喜！你发现了隐藏彩蛋！</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">正在打开彩蛋...</div>
            `;
            document.body.appendChild(hint);
        }
        
        hint.classList.add('show');
        this.playEggTriggerSound();
        
        // 3秒后自动隐藏
        setTimeout(() => {
            hint.classList.remove('show');
        }, 3000);
    }

    createSearchEggParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: searchEggParticle ${Math.random() * 2 + 1}s ease-out forwards;
            `;
            
            if (!document.querySelector('#searchEggParticleStyles')) {
                const style = document.createElement('style');
                style.id = 'searchEggParticleStyles';
                style.textContent = `
                    @keyframes searchEggParticle {
                        0% {
                            transform: translate(0, 0) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(${(Math.random() - 0.5) * 200}px, ${(Math.random() - 0.5) * 200}px) scale(0);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }

    playEggTriggerSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.1);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + index * 0.1 + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.5);
                
                oscillator.start(audioContext.currentTime + index * 0.1);
                oscillator.stop(audioContext.currentTime + index * 0.1 + 0.5);
            });
        } catch (e) {
            console.log('音效播放失败:', e);
        }
    }

    showSearchSuggestions() {
        if (this.searchSuggestions && this.searchInput.value.trim()) {
            this.searchSuggestions.classList.add('show');
        }
    }

    hideSearchSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.classList.remove('show');
        }
    }

    initKeyboardEgg() {
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;
        
        document.addEventListener('keydown', (e) => {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.showEggModal();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
    }

    checkLoginStatus() {
        if (typeof Utils !== 'undefined' && Utils.storage) {
            const currentUser = Utils.storage.get('currentUser');
            const rememberedUser = Utils.storage.get('rememberedUser');
            
            if (currentUser || rememberedUser) {
                console.log('用户已登录:', currentUser?.username || rememberedUser?.username);
            }
        }
    }
}

// 全局导航函数 - 确保在任何情况下都能工作
window.navigateToGame = function() {
    if (window.indexPage) {
        window.indexPage.navigateToGame();
    } else {
        window.location.href = 'game/index.html';
    }
};

// 自动在页面加载后实例化 IndexPage，确保全局方法可用
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (!window.indexPage) window.indexPage = new IndexPage();
    } catch (e) {
        console.error('IndexPage 初始化失败:', e);
    }
});

window.navigateToCloud = function() {
    if (window.indexPage) {
        window.indexPage.navigateToCloud();
    } else {
        window.location.href = 'cloud/index.html';
    }
};

window.navigateToLearn = function() {
    if (window.indexPage) {
        window.indexPage.navigateToLearn();
    } else {
        window.location.href = 'learn/index.html';
    }
};

window.navigateToAI = function() {
    if (window.indexPage) {
        window.indexPage.navigateToAI();
    } else {
        window.location.href = 'ai/index.html';
    }
};

window.navigateToMail = function() {
    if (window.indexPage) {
        window.indexPage.navigateToMail();
    } else {
        try { window.open('https://mail.cbzstudio.qzz.io', '_blank'); } catch(e) { window.location.href = 'https://mail.cbzstudio.qzz.io'; }
    }
};

window.navigateToSChat = function() {
    if (window.indexPage) {
        window.indexPage.navigateToSChat();
    } else {
        try { window.open('https://chat2.cbzstudio.qzz.io', '_blank'); } catch(e) { window.location.href = 'https://chat2.cbzstudio.qzz.io'; }
    }
};

// 全局彩蛋函数
window.closeEggModal = function() {
    if (window.indexPage) {
        window.indexPage.closeEggModal();
    }
};

// 关于和联系方式函数
function showAbout() {
    if (window.indexPage) {
        window.indexPage.showAbout();
    } else if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('CBZ Studio - 创新科技，引领未来', 'info');
    }
}

function showContact() {
    if (window.indexPage) {
        window.indexPage.showContact();
    } else if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('联系我们：support@cbzstudio.qzz.io', 'info');
    }
}

// 初始化主页
(function() {
    // 确保Utils已加载
    if (typeof Utils === 'undefined') {
        console.error('Utils对象未定义，请检查common.js是否正确加载');
        // 仍然尝试初始化基本功能
        window.indexPage = new IndexPage();
        return;
    }
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.indexPage = new IndexPage();
            
            // 确保全局函数可用
            window.navigateToGame = () => window.indexPage.navigateToGame();
            window.navigateToCloud = () => window.indexPage.navigateToCloud();
            window.navigateToLearn = () => window.indexPage.navigateToLearn();
            window.navigateToAI = () => window.indexPage.navigateToAI();
                window.navigateToMail = () => window.indexPage.navigateToMail();
                window.navigateToSChat = () => window.indexPage.navigateToSChat();
            window.closeEggModal = () => window.indexPage.closeEggModal();
        });
    } else {
        window.indexPage = new IndexPage();
        
        // 确保全局函数可用
        window.navigateToGame = () => window.indexPage.navigateToGame();
        window.navigateToCloud = () => window.indexPage.navigateToCloud();
        window.navigateToLearn = () => window.indexPage.navigateToLearn();
        window.navigateToAI = () => window.indexPage.navigateToAI();
    window.navigateToTalk = () => window.indexPage.navigateToTalk();
    window.navigateToChat = () => window.indexPage.navigateToChat();
    window.navigateToMail = () => window.indexPage.navigateToMail();
    window.navigateToSChat = () => window.indexPage.navigateToSChat();
        window.closeEggModal = () => window.indexPage.closeEggModal();
    }
})();
