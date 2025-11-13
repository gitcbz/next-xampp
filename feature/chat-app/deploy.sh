#!/bin/bash

echo "🚀 开始部署 ChatHub..."

# 检查Wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler 未安装"
    exit 1
fi

# 检查登录
if ! wrangler whoami &> /dev/null; then
    echo "🔐 请先登录: wrangler login"
    exit 1
fi

# 部署Workers
echo "📦 部署 Workers..."
if [ -d "workers" ]; then
    cd workers
    if [ ! -f "package.json" ]; then
        echo "❌ workers/package.json 不存在"
        exit 1
    fi
    npm install
    wrangler deploy
    cd ..
else
    echo "⚠️  workers 目录不存在，跳过Workers部署"
fi

# 部署Pages
echo "📄 部署 Pages..."
if [ -d "pages" ]; then
    cd pages
    wrangler pages deploy . --project-name chathub-frontend
    cd ..
else
    echo "❌ pages 目录不存在"
    exit 1
fi

echo "✅ 部署完成！"
