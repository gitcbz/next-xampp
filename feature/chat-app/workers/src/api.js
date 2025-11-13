// API处理逻辑
import { getChatRooms, getChatUsers } from './storage.js';

export async function handleAPI(request, env, url) {
    const method = request.method;
    
    switch (url.pathname) {
        case '/api/health':
            return handleHealth(env);
            
        case '/api/stats':
            return handleStats(env);
            
        case '/api/rooms':
            if (method === 'GET') {
                return handleGetRooms(env);
            }
            break;
            
        case '/api/messages':
            if (method === 'GET') {
                return handleGetMessages(url, env);
            }
            break;
            
        default:
            return new Response(JSON.stringify({
                error: 'API endpoint not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}

// 健康检查
async function handleHealth(env) {
    const chatUsers = getChatUsers(env);
    const onlineCount = await chatUsers.list();
    
    return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        onlineUsers: onlineCount.keys.length,
        service: 'ChatHub API'
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

// 统计信息
async function handleStats(env) {
    const chatRooms = getChatRooms(env);
    const chatUsers = getChatUsers(env);
    
    const onlineUsers = await chatUsers.list();
    const roomStats = {};
    
    // 统计每个房间的用户数
    const roomKeys = await chatRooms.list();
    for (const key of roomKeys.keys) {
        const room = key.name.split(':')[0];
        roomStats[room] = (roomStats[room] || 0) + 1;
    }
    
    return new Response(JSON.stringify({
        onlineUsers: onlineUsers.keys.length,
        rooms: roomStats,
        totalRooms: Object.keys(roomStats).length,
        timestamp: new Date().toISOString()
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 获取房间列表
async function handleGetRooms(env) {
    const rooms = [
        { id: 'general', name: '综合讨论', description: '自由讨论各种话题' },
        { id: 'tech', name: '技术交流', description: '分享技术经验和知识' },
        { id: 'random', name: '随机聊天', description: '轻松愉快的聊天环境' },
        { id: 'gaming', name: '游戏讨论', description: '游戏相关话题讨论' }
    ];
    
    const chatRooms = getChatRooms(env);
    const roomKeys = await chatRooms.list();
    
    // 添加用户数量
    for (const room of rooms) {
        const userCount = roomKeys.keys.filter(key => 
            key.name.startsWith(`${room.id}:`)
        ).length;
        room.userCount = userCount;
    }
    
    return new Response(JSON.stringify(rooms), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 获取消息历史（简化版本）
async function handleGetMessages(url, env) {
    const room = url.searchParams.get('room') || 'general';
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    
    // 这里可以实现消息历史存储和检索
    // 简化版本返回空数组
    return new Response(JSON.stringify({
        room: room,
        messages: [],
        timestamp: new Date().toISOString()
    }), {
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
