// CORS配置
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // 处理预检请求
        if (request.method === 'OPTIONS') {
            return handleOptions();
        }
        
        // 处理WebSocket升级
        if (url.pathname === '/ws') {
            return handleWebSocket(request);
        }
        
        // API路由
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env, url);
        }
        
        // 健康检查
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                service: 'ChatHub Workers',
                cors: 'enabled'
            }), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
        
        return new Response('ChatHub WebSocket Server', {
            headers: { 
                'Content-Type': 'text/plain',
                ...corsHeaders
            }
        });
    }
};

// 处理预检请求
function handleOptions() {
    return new Response(null, {
        status: 200,
        headers: {
            ...corsHeaders,
            'Access-Control-Allow-Credentials': 'true'
        }
    });
}

// WebSocket处理（不需要CORS头）
async function handleWebSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected websocket', {
            status: 426
        });
    }

    const [client, server] = Object.values(new WebSocketPair());

    const clientId = crypto.randomUUID();

    // 接受并绑定服务器端事件处理器（worker 端使用 server，返回 client 给浏览器）
    server.accept();

    // 发送连接确认给客户端
    try {
        server.send(JSON.stringify({
            type: 'connected',
            clientId: clientId,
            timestamp: new Date().toISOString()
        }));
    } catch (e) {
        console.warn('无法发送初始连接消息', e);
    }

    server.addEventListener('message', (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(server, data, clientId);
        } catch (error) {
            console.error('Message parse error:', error);
        }
    });

    // 按 Cloudflare Workers 的惯例，将 pair[0]（client）作为响应的 webSocket 返回
    return new Response(null, {
        status: 101,
        webSocket: client
    });
}

// API处理（添加CORS头）
async function handleAPI(request, env, url) {
    try {
        switch (url.pathname) {
            case '/api/health':
                return new Response(JSON.stringify({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    onlineUsers: 0,
                    cors: 'enabled'
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
                
            case '/api/stats':
                return new Response(JSON.stringify({
                    onlineUsers: 0,
                    rooms: {
                        general: 0,
                        tech: 0,
                        random: 0,
                        gaming: 0
                    },
                    totalMessages: 0,
                    timestamp: new Date().toISOString(),
                    cors: 'enabled'
                }), {
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
                
            case '/api/messages':
                if (request.method === 'GET') {
                    const room = url.searchParams.get('room') || 'general';
                    return new Response(JSON.stringify({
                        room: room,
                        messages: [],
                        timestamp: new Date().toISOString()
                    }), {
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    });
                }
                break;
                
            default:
                return new Response('Not Found', { 
                    status: 404,
                    headers: corsHeaders
                });
        }
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

function handleMessage(ws, data, clientId) {
    switch (data.type) {
        case 'join':
            console.log(`User ${data.user.username} joined room ${data.room}`);
            ws.send(JSON.stringify({
                type: 'system',
                message: `${data.user.username} 加入了房间`,
                room: data.room,
                timestamp: new Date().toISOString()
            }));
            break;
            
        case 'message':
            console.log(`Message from ${data.user.username}: ${data.text}`);
            ws.send(JSON.stringify({
                type: 'message',
                id: data.id,
                user: data.user,
                text: data.text,
                room: data.room,
                timestamp: new Date().toISOString()
            }));
            break;
            
        case 'typing':
            ws.send(JSON.stringify({
                type: 'typing',
                username: data.user.username,
                room: data.room
            }));
            break;
    }
}
