// 登录页面脚本
class LoginPage {
    constructor() {
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15分钟
        this.init();
    }

    init() {
        this.initEventListeners();
        this.checkRememberedUser();
        this.checkLoginAttempts();
        this.initFormValidation();
    }

    initEventListeners() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 密码显示/隐藏切换
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        // 社交登录按钮
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                this.handleSocialLogin(provider);
            });
        });

        // 忘记密码链接
        const forgotLink = document.querySelector('.forgot-link');
        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // 注册链接
        const signupLink = document.querySelector('.signup-link a');
        if (signupLink) {
            signupLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        // 输入框焦点效果
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });
    }

    initFormValidation() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                this.validateUsername();
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword();
            });
        }
    }

    validateUsername() {
        const username = document.getElementById('username').value;
        const usernameError = document.getElementById('usernameError');
        
        if (!username) {
            this.showFieldError('username', '请输入用户名');
            return false;
        }
        
        if (username.length < 3) {
            this.showFieldError('username', '用户名至少3个字符');
            return false;
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showFieldError('username', '用户名只能包含字母、数字和下划线');
            return false;
        }
        
        this.clearFieldError('username');
        return true;
    }

    validatePassword() {
        const password = document.getElementById('password').value;
        
        if (!password) {
            this.showFieldError('password', '请输入密码');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', '密码至少6个字符');
            return false;
        }
        
        this.clearFieldError('password');
        return true;
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (!errorElement) {
            const error = document.createElement('div');
            error.id = `${fieldId}Error`;
            error.className = 'field-error';
            error.textContent = message;
            field.parentNode.appendChild(error);
        } else {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        field.classList.add('error');
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        field.classList.remove('error');
    }

    checkLoginAttempts() {
        const attempts = Utils.storage.get('loginAttempts') || { count: 0, timestamp: 0 };
        const now = Date.now();
        
        if (attempts.count >= this.maxLoginAttempts) {
            const timeDiff = now - attempts.timestamp;
            if (timeDiff < this.lockoutDuration) {
                const remainingTime = Math.ceil((this.lockoutDuration - timeDiff) / 60000);
                this.showError(`登录尝试次数过多，请${remainingTime}分钟后再试`);
                this.disableLoginForm(true);
                return;
            } else {
                // 重置尝试次数
                Utils.storage.remove('loginAttempts');
            }
        }
    }

    disableLoginForm(disable) {
        const loginBtn = document.getElementById('loginBtn');
        const inputs = document.querySelectorAll('.form-input');
        
        if (loginBtn) {
            loginBtn.disabled = disable;
        }
        
        inputs.forEach(input => {
            input.disabled = disable;
        });
    }

    handleLogin() {
        // 验证表单
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();
        
        if (!isUsernameValid || !isPasswordValid) {
            return;
        }

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // 显示加载状态
        this.showLoading(true);

        // 模拟登录请求
        setTimeout(() => {
            if (this.validateCredentials(username, password)) {
                this.handleLoginSuccess(username, remember);
            } else {
                this.handleLoginError();
            }
        }, 1500);
    }

    validateCredentials(username, password) {
        // 这里应该是实际的验证逻辑
        const validUsers = {
            'Administrators': 'Gitcbz/xampp-html',
            'test': 'test123'
        };
        return validUsers[username.toLowerCase()] === password;
    }

    handleLoginSuccess(username, remember) {
        // 重置登录尝试次数
        Utils.storage.remove('loginAttempts');
        
        // 保存登录状态
        const userData = {
            username: username,
            loginTime: new Date().toISOString(),
            remember: remember,
            sessionId: Utils.generateId()
        };

        if (remember) {
            Utils.storage.set('rememberedUser', userData);
        } else {
            Utils.storage.set('currentUser', userData);
        }

        // 显示成功消息
        this.showSuccess('登录成功！正在跳转...');

        // 跳转到主页
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
    }

    handleLoginError() {
        // 记录失败尝试
        const attempts = Utils.storage.get('loginAttempts') || { count: 0, timestamp: Date.now() };
        attempts.count++;
        attempts.timestamp = Date.now();
        Utils.storage.set('loginAttempts', attempts);
        
        this.showLoading(false);
        this.showError('用户名或密码错误');
        
        // 检查是否需要锁定
        if (attempts.count >= this.maxLoginAttempts) {
            this.disableLoginForm(true);
            this.showError(`登录尝试次数过多，请${this.lockoutDuration / 60000}分钟后再试`);
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const togglePassword = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            togglePassword.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            togglePassword.textContent = '👁️';
        }
    }

    handleSocialLogin(provider) {
        this.showInfo(`正在使用 ${provider} 登录...`);
        
        // 模拟社交登录
        setTimeout(() => {
            const userData = {
                username: `${provider}_user`,
                loginTime: new Date().toISOString(),
                provider: provider,
                sessionId: Utils.generateId()
            };
            
            Utils.storage.set('currentUser', userData);
            this.showSuccess(`${provider} 登录成功！正在跳转...`);
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        }, 1500);
    }

    handleForgotPassword() {
        const username = document.getElementById('username').value.trim();
        
        if (!username) {
            this.showError('请先输入用户名');
            return;
        }
        this.showInfo(`重置密码功能开发中...`);
    }

    handleSignup() {
        Utils.showToast('注册功能开发中...', 'info');
        // 这里可以跳转到注册页面
        // window.location.href = 'register.html';
    }

    checkRememberedUser() {
        const rememberedUser = Utils.storage.get('rememberedUser');
        if (rememberedUser && rememberedUser.remember) {
            document.getElementById('username').value = rememberedUser.username;
            document.getElementById('remember').checked = true;
        }
    }

    showLoading(show) {
        const loginBtn = document.getElementById('loginBtn');
        if (show) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="loading"></span> 登录中...';
        } else {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }

    showError(message) {
        this.hideAllMessages();
        const errorEl = document.getElementById('errorMessage');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    showSuccess(message) {
        this.hideAllMessages();
        const successEl = document.getElementById('successMessage');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
        }
    }

    showInfo(message) {
        this.hideAllMessages();
        const infoEl = document.getElementById('infoMessage');
        if (infoEl) {
            infoEl.textContent = message;
            infoEl.style.display = 'block';
        }
    }

    hideAllMessages() {
        const messages = ['errorMessage', 'successMessage', 'infoMessage'];
        messages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
}

// 初始化登录页面
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});
