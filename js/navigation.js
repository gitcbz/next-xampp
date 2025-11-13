// 通用导航脚本
const Navigation = {
    // 安全跳转函数
    safeNavigate(url, moduleName = '') {
        try {
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
                window.location.href = url;
            }, 300);
        } catch (error) {
            console.error('跳转失败:', error);
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('跳转失败，请重试', 'error');
            }
        }
    },
    
    // 返回主页
    goHome() {
        this.safeNavigate('../index.html', '主页');
    },
    
    // 跳转到游戏中心
    goToGame() {
        this.safeNavigate('game/index.html', '游戏中心');
    },
    
    // 跳转到云盘
    goToCloud() {
        this.safeNavigate('cloud/index.html', '本地云盘');
    },
    
    // 跳转到学习中心
    goToLearn() {
        this.safeNavigate('learn/index.html', '学习中心');
    },
    
    // 跳转到AI工具箱
    goToAI() {
        this.safeNavigate('ai/index.html', 'AI工具箱');
    },
    
    // 跳转到登录页面
    goToLogin() {
        this.safeNavigate('login.html', '登录页面');
    },
    
    // 跳转到彩蛋页面
    goToEgg() {
        this.safeNavigate('egg.html', '彩蛋页面');
    },
    
    // 初始化返回按钮
    initBackButton() {
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goHome();
            });
        }
    },
    
    // 初始化所有导航
    init() {
        this.initBackButton();
        
        // 初始化所有带有data-navigate属性的元素
        document.querySelectorAll('[data-navigate]').forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                const target = element.getAttribute('data-navigate');
                switch(target) {
                    case 'home':
                        this.goHome();
                        break;
                    case 'game':
                        this.goToGame();
                        break;
                    case 'cloud':
                        this.goToCloud();
                        break;
                    case 'learn':
                        this.goToLearn();
                        break;
                    case 'ai':
                        this.goToAI();
                        break;
                    case 'login':
                        this.goToLogin();
                        break;
                    case 'egg':
                        this.goToEgg();
                        break;
                    default:
                        console.warn('未知的导航目标:', target);
                }
            });
        });
    }
};

// 导出导航对象
window.Navigation = Navigation;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
});
