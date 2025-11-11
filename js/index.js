// 在IndexPage类中添加缩放处理
class IndexPage {
    constructor() {
        // 确保Utils存在
        if (typeof Utils === 'undefined') {
            console.error('Utils对象未定义，请确保common.js已正确加载');
            return;
        }
        
        this.eggCode = '20130211';
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
        
        // 然后初始化其他功能
        this.initEventListeners();
        this.initKeyboardShortcuts();
        this.initKeyboardEgg();
        this.initSearchEgg();
        this.checkLoginStatus();
    }

    // 新增：初始化缩放处理
    initScaleHandling() {
        // 防止双击缩放
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });

        // 防止 pinch 缩放
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

    // 新增：处理视口变化
    handleViewportChange() {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;
        
        // 检测缩放变化
        const widthRatio = currentWidth / this.viewportWidth;
        const heightRatio = currentHeight / this.viewportHeight;
        
        // 如果缩放变化超过阈值，重新调整布局
        if (Math.abs(widthRatio - 1) > 0.1 || Math.abs(heightRatio - 1) > 0.1) {
            this.adjustForScale();
        }
        
        this.viewportWidth = currentWidth;
        this.viewportHeight = currentHeight;
    }

    // 新增：调整缩放
    adjustForScale() {
        // 重新计算背景元素
        this.adjustBackgroundElements();
        
        // 重新计算卡片布局
        this.adjustCardLayout();
        
        // 重新计算字体大小
        this.adjustFontSizes();
    }

    // 新增：调整背景元素
    adjustBackgroundElements() {
        const bgAnimation = document.querySelector('.bg-animation');
        const geometricBg = document.querySelector('.geometric-bg');
        
        if (bgAnimation) {
            bgAnimation.style.width = window.innerWidth + 'px';
            bgAnimation.style.height = window.innerHeight + 'px';
            
            // 调整动画元素
            Array.from(bgAnimation.children).forEach((span, index) => {
                const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                span.style.transform = `scale(${scale})`;
            });
        }
        
        if (geometricBg) {
            geometricBg.style.width = window.innerWidth + 'px';
            geometricBg.style.height = window.innerHeight + 'px';
            
            // 调整几何形状
            Array.from(geometricBg.children).forEach((shape, index) => {
                const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
                shape.style.transform = `scale(${scale})`;
            });
        }
    }

    // 新增：调整卡片布局
    adjustCardLayout() {
        const cards = document.querySelectorAll('.feature-card');
        const container = document.querySelector('.features-container');
        
        if (cards.length > 0 && container) {
            const containerWidth = container.offsetWidth;
            const cardMinWidth = 280;
            const gap = 40;
            
            // 计算每行可以放置的卡片数量
            let columns = Math.floor((containerWidth + gap) / (cardMinWidth + gap));
            columns = Math.max(1, Math.min(columns, cards.length));
            
            // 调整网格布局
            container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            
            // 调整卡片高度
            const cardHeight = Math.min(400, window.innerHeight * 0.4);
            cards.forEach(card => {
                card.style.height = cardHeight + 'px';
            });
        }
    }

    // 新增：调整字体大小
    adjustFontSizes() {
        const baseWidth = 1920;
        const currentWidth = window.innerWidth;
        const scale = Math.min(currentWidth / baseWidth, 1.5);
        
        // 调整标题字体
        const title = document.querySelector('.main-title');
        if (title) {
            const baseFontSize = 64;
            const newFontSize = Math.max(36, baseFontSize * scale);
            title.style.fontSize = newFontSize + 'px';
        }
        
        // 调整副标题字体
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            const baseFontSize = 24;
            const newFontSize = Math.max(16, baseFontSize * scale);
            subtitle.style.fontSize = newFontSize + 'px';
        }
        
        // 调整卡片标题字体
        document.querySelectorAll('.feature-title').forEach(title => {
            const baseFontSize = 28;
            const newFontSize = Math.max(20, baseFontSize * scale);
            title.style.fontSize = newFontSize + 'px';
        });
        
        // 调整卡片描述字体
        document.querySelectorAll('.feature-description').forEach(desc => {
            const baseFontSize = 16;
            const newFontSize = Math.max(14, baseFontSize * scale);
            desc.style.fontSize = newFontSize + 'px';
        });
    }

    // 修复：处理窗口大小变化
    handleResize() {
        // 防抖处理
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.handleViewportChange();
            this.handleResize();
        }, 100);
    }

    // 修复：初始化背景
    initBackground() {
        this.createBackgroundAnimation();
        this.createGeometricBackground();
        this.ensureBackgroundStyles();
        this.adjustBackgroundElements();
    }

    // 修复：创建背景动画
    createBackgroundAnimation() {
        let bgAnimation = document.querySelector('.bg-animation');
        
        if (!bgAnimation) {
            bgAnimation = document.createElement('div');
            bgAnimation.className = 'bg-animation';
            
            // 确保样式正确应用
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
            
            // 插入到body的开头
            if (document.body.firstChild) {
                document.body.insertBefore(bgAnimation, document.body.firstChild);
            } else {
                document.body.appendChild(bgAnimation);
            }
        }
        
        // 确保有足够的动画元素
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

    // 修复：创建几何背景
    createGeometricBackground() {
        let geometricBg = document.querySelector('.geometric-bg');
        
        if (!geometricBg) {
            geometricBg = document.createElement('div');
            geometricBg.className = 'geometric-bg';
            
            // 确保样式正确应用
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
            
            // 插入到body的开头，在bg-animation之后
            const bgAnimation = document.querySelector('.bg-animation');
            if (bgAnimation && bgAnimation.nextSibling) {
                document.body.insertBefore(geometricBg, bgAnimation.nextSibling);
            } else if (document.body.firstChild) {
                document.body.insertBefore(geometricBg, document.body.firstChild);
            } else {
                document.body.appendChild(geometricBg);
            }
        }
        
        // 确保有足够的几何形状
        while (geometricBg.children.length < 4) {
            this.createGeometricShape(geometricBg, geometricBg.children.length);
        }
    }

    // 新增：创建单个几何形状
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
        
        // 根据视口大小调整尺寸
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

    // 其他方法保持不变...
}
