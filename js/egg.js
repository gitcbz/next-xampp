// 彩蛋页面脚本
class EggPage {
    constructor() {
        this.init();
    }

    init() {
        this.initEventListeners();
        this.createConfetti();
        this.initVideo();
    }

    initEventListeners() {
        // 视频控制按钮
        document.getElementById('playBtn')?.addEventListener('click', () => {
            this.playVideo();
        });

        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.pauseVideo();
        });

        document.getElementById('muteBtn')?.addEventListener('click', () => {
            this.toggleMute();
        });

        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // 视频结束事件
        const video = document.getElementById('eggVideo');
        if (video) {
            video.addEventListener('ended', () => {
                this.onVideoEnded();
            });

            video.addEventListener('play', () => {
                this.updatePlayButton(true);
            });

            video.addEventListener('pause', () => {
                this.updatePlayButton(false);
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }

    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d', '#6bcf7f'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 100);
        }
    }

    initVideo() {
        const video = document.getElementById('eggVideo');
        if (video) {
            // 设置视频属性
            video.controls = false;
            video.autoplay = true;
            video.loop = false;
            video.muted = false;

            // 监听视频加载
            video.addEventListener('loadeddata', () => {
                console.log('视频加载完成');
            });

            // 监听视频错误
            video.addEventListener('error', (e) => {
                console.error('视频加载错误:', e);
                this.showVideoError();
            });
        }
    }

    playVideo() {
        const video = document.getElementById('eggVideo');
        if (video) {
            video.play();
        }
    }

    pauseVideo() {
        const video = document.getElementById('eggVideo');
        if (video) {
            video.pause();
        }
    }

    toggleMute() {
        const video = document.getElementById('eggVideo');
        const muteBtn = document.getElementById('muteBtn');
        if (video && muteBtn) {
            video.muted = !video.muted;
            muteBtn.textContent = video.muted ? '🔇' : '🔊';
        }
    }

    toggleFullscreen() {
        const video = document.getElementById('eggVideo');
        if (video) {
            if (!document.fullscreenElement) {
                video.requestFullscreen().catch(err => {
                    console.error('无法进入全屏模式:', err);
                });
            } else {
                document.exitFullscreen();
            }
        }
    }

    updatePlayButton(isPlaying) {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = isPlaying ? '⏸️ 暂停' : '▶️ 播放';
        }
    }

    onVideoEnded() {
        // 视频结束后的处理
        this.createConfetti();
        this.showMessage('🎉 感谢观看！');
        
        // 3秒后重新播放
        setTimeout(() => {
            const video = document.getElementById('eggVideo');
            if (video) {
                video.currentTime = 0;
                video.play();
            }
        }, 3000);
    }

    handleKeyPress(e) {
        const video = document.getElementById('eggVideo');
        if (!video) return;

        switch(e.key) {
            case ' ':
                e.preventDefault();
                if (video.paused) {
                    this.playVideo();
                } else {
                    this.pauseVideo();
                }
                break;
            case 'ArrowRight':
                video.currentTime = Math.min(video.currentTime + 10, video.duration);
                break;
            case 'ArrowLeft':
                video.currentTime = Math.max(video.currentTime - 10, 0);
                break;
            case 'ArrowUp':
                video.volume = Math.min(video.volume + 0.1, 1);
                break;
            case 'ArrowDown':
                video.volume = Math.max(video.volume - 0.1, 0);
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'm':
            case 'M':
                this.toggleMute();
                break;
        }
    }

    showVideoError() {
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div style="color: white; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🎬</div>
                    <h3>视频加载失败</h3>
                    <p>请检查视频文件是否存在</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.3); border-radius: 20px; color: white; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }

    showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 24px;
            z-index: 1000;
            animation: fadeIn 0.5s ease;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                messageDiv.remove();
            }, 500);
        }, 2000);
    }
}

// 添加淡出动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 初始化彩蛋页面
document.addEventListener('DOMContentLoaded', () => {
    new EggPage();
});
