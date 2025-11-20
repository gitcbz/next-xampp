// CBZ帖子系统
class TalkSystem {
    constructor() {
        this.storageKey = 'cbz_talk_posts';
        this.userKey = 'cbz_talk_user';
        this.adminKey = 'cbz_talk_admin';
        this.posts = [];
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.loadPosts();
        this.checkAuth();
    }

    // 数据存储管理
    loadPosts() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.posts = JSON.parse(stored);
        } else {
            this.posts = this.getDefaultPosts();
            this.savePosts();
        }
    }

    savePosts() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
    }

    getDefaultPosts() {
        return [
            {
                id: 1,
                title: '欢迎来到CBZ帖子系统',
                content: '这是一个全新的帖子分享平台，大家可以在这里分享想法、交流经验。欢迎各位用户积极参与讨论！',
                author: 'CBZ Admin',
                avatar: 'CBZ',
                time: new Date().toISOString(),
                tags: ['公告', '欢迎'],
                likes: 5,
                comments: [],
                views: 100,
                pinned: true
            },
            {
                id: 2,
                title: '如何使用帖子系统',
                content: '1. 用户可以浏览所有帖子\n2. 发帖端和管理员端需要密码认证\n3. 支持点赞、评论等互动功能\n4. 管理员可以管理所有帖子',
                author: 'CBZ Admin',
                avatar: 'CBZ',
                time: new Date(Date.now() - 3600000).toISOString(),
                tags: ['教程', '使用指南'],
                likes: 3,
                comments: [],
                views: 50,
                pinned: false
            }
        ];
    }

    // 认证管理
    checkAuth() {
        const userToken = localStorage.getItem(this.userKey);
        const adminToken = localStorage.getItem(this.adminKey);
        
        if (userToken) {
            this.currentUser = JSON.parse(userToken);
        }
        
        if (adminToken) {
            this.isAdmin = true;
        }
    }

    authenticate(password, type = 'user') {
        const userPassword = 'user123'; // 用户密码
        const adminPassword = 'admin123'; // 管理员密码
        
        if (type === 'user' && password === userPassword) {
            const userData = {
                username: 'CBZ User',
                avatar: '用户',
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.userKey, JSON.stringify(userData));
            this.currentUser = userData;
            return { success: true, message: '登录成功' };
        } else if (type === 'admin' && password === adminPassword) {
            localStorage.setItem(this.adminKey, 'true');
            this.isAdmin = true;
            return { success: true, message: '管理员登录成功' };
        } else {
            return { success: false, message: '密码错误' };
        }
    }

    logout(type = 'user') {
        if (type === 'user') {
            localStorage.removeItem(this.userKey);
            this.currentUser = null;
        } else if (type === 'admin') {
            localStorage.removeItem(this.adminKey);
            this.isAdmin = false;
        }
    }

    // 帖子管理
    createPost(postData) {
        const newPost = {
            id: Date.now(),
            title: postData.title,
            content: postData.content,
            author: this.currentUser?.username || '匿名用户',
            avatar: this.currentUser?.avatar || '匿名',
            time: new Date().toISOString(),
            tags: postData.tags || [],
            likes: 0,
            comments: [],
            views: 0,
            pinned: false
        };
        
        this.posts.unshift(newPost);
        this.savePosts();
        return newPost;
    }

    updatePost(postId, updateData) {
        const index = this.posts.findIndex(post => post.id === postId);
        if (index !== -1) {
            this.posts[index] = { ...this.posts[index], ...updateData };
            this.savePosts();
            return this.posts[index];
        }
        return null;
    }

    deletePost(postId) {
        const index = this.posts.findIndex(post => post.id === postId);
        if (index !== -1) {
            const deletedPost = this.posts[index];
            this.posts.splice(index, 1);
            this.savePosts();
            return deletedPost;
        }
        return null;
    }

    getPost(postId) {
        return this.posts.find(post => post.id === postId);
    }

    getPosts(options = {}) {
        let filteredPosts = [...this.posts];
        
        // 搜索过滤
        if (options.search) {
            const searchTerm = options.search.toLowerCase();
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                post.content.toLowerCase().includes(searchTerm) ||
                post.author.toLowerCase().includes(searchTerm)
            );
        }
        
        // 标签过滤
        if (options.tag) {
            filteredPosts = filteredPosts.filter(post => 
                post.tags.includes(options.tag)
            );
        }
        
        // 排序
        if (options.sort === 'latest') {
            filteredPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
        } else if (options.sort === 'popular') {
            filteredPosts.sort((a, b) => b.likes - a.likes);
        }
        
        // 置顶处理
        const pinnedPosts = filteredPosts.filter(post => post.pinned);
        const normalPosts = filteredPosts.filter(post => !post.pinned);
        
        return [...pinnedPosts, ...normalPosts];
    }

    // 互动功能
    likePost(postId) {
        const post = this.getPost(postId);
        if (post) {
            post.likes++;
            this.savePosts();
            return post.likes;
        }
        return 0;
    }

    addComment(postId, commentData) {
        const post = this.getPost(postId);
        if (post) {
            const newComment = {
                id: Date.now(),
                author: this.currentUser?.username || '匿名用户',
                avatar: this.currentUser?.avatar || '匿名',
                content: commentData.content,
                time: new Date().toISOString()
            };
            
            post.comments.push(newComment);
            this.savePosts();
            return newComment;
        }
        return null;
    }

    incrementViews(postId) {
        const post = this.getPost(postId);
        if (post) {
            post.views++;
            this.savePosts();
        }
    }

    // 统计信息
    getStats() {
        const totalPosts = this.posts.length;
        const totalLikes = this.posts.reduce((sum, post) => sum + post.likes, 0);
        const totalComments = this.posts.reduce((sum, post) => sum + post.comments.length, 0);
        const totalViews = this.posts.reduce((sum, post) => sum + post.views, 0);
        
        return {
            totalPosts,
            totalLikes,
            totalComments,
            totalViews
        };
    }

    // 工具方法
    formatTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) {
            return '刚刚';
        } else if (minutes < 60) {
            return `${minutes}分钟前`;
        } else if (hours < 24) {
            return `${hours}小时前`;
        } else if (days < 30) {
            return `${days}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    getAllTags() {
        const tags = new Set();
        this.posts.forEach(post => {
            post.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }
}

// 全局实例
window.TalkSystem = TalkSystem;
window.talkSystem = new TalkSystem();

// 工具函数
window.TalkUtils = {
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <span>${this.getMessageIcon(type)}</span>
            <span>${message}</span>
        `;
        
        const container = document.querySelector('.container') || document.body;
        const firstChild = container.firstChild;
        container.insertBefore(messageDiv, firstChild);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    },
    
    getMessageIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    },
    
    confirmAction(message) {
        return confirm(message);
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
};
