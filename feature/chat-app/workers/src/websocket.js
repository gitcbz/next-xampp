// WebSocket处理逻辑
import { getChatRooms, getChatUsers } from './storage.js';

// WebSocket升级处理
export async function handleWebSocket(request, env) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // 生成唯一客户端ID
    const clientId = crypto.randomUUID();
    server.serializeAttachment(() => ({ clientId }));
    
    // 设置WebSocket处理器
    server.accept();
    
    // 发送连接确认
    server.send(JSON.stringify({
        type: 'connected',
        clientId: clientId,
        timestamp: new Date().toISOString()
    }));
    
    return new Response(null, {
        status: 101,
        webSocket: server,
    });
}

// 处理WebSocket消息
export async function handleWebSocketMessage(ws, data, env) {
    const attachment = ws.deserializeAttachment();
    const clientId = attachment.clientId;
    
    switch (data.type) {
        case 'join':
            await handleJoin(clientId, data, env);
            break;
        case 'message':
            await handleMessage(clientId, data, env);
            break;
        case 'typing':
            await handleTyping(clientId, data, env);
            break;
        case 'stopTyping':
            await handleStopTyping(clientId, data, env);
            break;
        case 'leave':
            await handleLeave(clientId, data, env);
            break;
        default:
            console.warn('Unknown message type:', data.type);
    }
}

// 处理加入房间
async function handleJoin(clientId, data, env) {
    const { user, room } = data;
    const chatRooms = getChatRooms(env);
    const chatUsers = getChatUsers(env);
    
    // 存储用户信息
    await chatUsers.put(clientId, JSON.stringify({
        user: user,
        room: room,
        joinedAt: new Date().toISOString()
    }));
    
    // 添加到房间
    await chatRooms.put(`${room}:${clientId}`, JSON.stringify(user));
    
    // 发送系统消息
    const systemMessage = {
        type: 'system',
        message: `${user.username} 加入了房间`,
        room: room,
        timestamp: new Date().toISOString()
    };
    
    await broadcastToRoom(room, systemMessage, env, clientId);
    
    // 发送用户列表
    await sendUserList(room, env);
    
    // 发送欢迎消息
    const welcomeMessage = {
        type: 'message',
        id: 'welcome-' + Date.now(),
        user: { id: 'bot', username: '系统', avatar: '🤖' },
        text: `欢迎来到 ${getRoomDisplayName(room)} 房间！`,
        room: room,
        timestamp: new Date().toISOString()
    };
    
    await sendToClient(clientId, welcomeMessage, env);
}

// 处理消息
async function handleMessage(clientId, data, env) {
    const chatUsers = getChatUsers(env);
    const userInfo = await chatUsers.get(clientId);
    
    if (!userInfo) {
        console.error('User not found:', clientId);
        return;
    }
    
    const user = JSON.parse(userInfo);
    
    const message = {
        type: 'message',
        id: data.id || Date.now().toString(),
        user: user.user,
        text: data.text,
        room: user.room,
        timestamp: new Date().toISOString()
    };
    
    await broadcastToRoom(user.room, message, env);
}

// 处理正在输入
async function handleTyping(clientId, data, env) {
    const chatUsers = getChatUsers(env);
    const userInfo = await chatUsers.get(clientId);
    
    if (!userInfo) return;
    
    const user = JSON.parse(userInfo);
    
    const typingMessage = {
        type: 'typing',
        username: user.user.username,
        room: user.room
    };
    
    await broadcastToRoom(user.room, typingMessage, env, clientId);
}

// 处理停止输入
async function handleStopTyping(clientId, data, env) {
    const chatUsers = getChatUsers(env);
    const userInfo = await chatUsers.get(clientId);
    
    if (!userInfo) return;
    
    const user = JSON.parse(userInfo);
    
    const stopTypingMessage = {
        type: 'stopTyping',
        username: user.user.username,
        room: user.room
    };
    
    await broadcastToRoom(user.room, stopTypingMessage, env, clientId);
}

// 处理离开房间
async function handleLeave(clientId, data, env) {
    await handleWebSocketClose(null, env, clientId);
}

// 处理WebSocket关闭
export async function handleWebSocketClose(ws, env, clientId = null) {
    if (!clientId && ws) {
        const attachment = ws.deserializeAttachment();
        clientId = attachment.clientId;
    }
    
    if (!clientId) return;
    
    const chatRooms = getChatRooms(env);
    const chatUsers = getChatUsers(env);
    
    const userInfo = await chatUsers.get(clientId);
    if (!userInfo) return;
    
    const user = JSON.parse(userInfo);
    
    // 从房间移除用户
    await chatRooms.delete(`${user.room}:${clientId}`);
    await chatUsers.delete(clientId);
    
    // 发送离开消息
    const systemMessage = {
        type: 'system',
        message: `${user.user.username} 离开了房间`,
        room: user.room,
        timestamp: new Date().toISOString()
    };
    
    await broadcastToRoom(user.room, systemMessage, env);
    
    // 发送更新后的用户列表
    await sendUserList(user.room, env);
}

// 广播消息到房间
async function broadcastToRoom(room, message, env, excludeClientId = null) {
    const chatRooms = getChatRooms(env);
    const chatUsers = getChatUsers(env);
    
    // 获取房间所有用户
    const roomKeys = await chatRooms.list({
        prefix: `${room}:`
    });
    
    const messageStr = JSON.stringify(message);
    const promises = [];
    
    for (const key of roomKeys.keys) {
        const clientId = key.name.replace(`${room}:`, '');
        
        if (clientId !== excludeClientId) {
            promises.push(sendToClient(clientId, message, env));
        }
    }
    
    await Promise.all(promises);
}

// 发送消息给特定客户端
async function sendToClient(clientId, message, env) {
    // 这里需要实现实际的WebSocket发送逻辑
    // 在Cloudflare Workers中，我们需要维护WebSocket连接映射
    console.log(`Sending to ${clientId}:`, JSON.stringify(message));
}

// 发送用户列表
async function sendUserList(room, env) {
    const chatRooms = getChatRooms(env);
    
    // 获取房间所有用户
    const roomKeys = await chatRooms.list({
        prefix: `${room}:`
    });
    
    const users = [];
    for (const key of roomKeys.keys) {
        const userData = await chatRooms.get(key.name);
        if (userData) {
            users.push(JSON.parse(userData));
        }
    }
    
    const userListMessage = {
        type: 'userList',
        users: users,
        room: room,
        timestamp: new Date().toISOString()
    };
    
    await broadcastToRoom(room, userListMessage, env);
}

// 获取房间显示名称
function getRoomDisplayName(room) {
    const roomNames = {
        general: '综合讨论',
        tech: '技术交流',
        random: '随机聊天',
        gaming: '游戏讨论'
    };
    return roomNames[room] || room;
}
