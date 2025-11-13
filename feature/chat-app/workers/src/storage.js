// Durable Objects存储实现

// 房间存储Durable Object
export class ChatRooms {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }
    
    // 存储键值对
    async put(key, value) {
        await this.state.storage.put(key, value);
    }
    
    // 获取值
    async get(key) {
        return await this.state.storage.get(key);
    }
    
    // 删除键
    async delete(key) {
        await this.state.storage.delete(key);
    }
    
    // 列出所有键
    async list(options = {}) {
        return await this.state.storage.list(options);
    }
    
    // 清空存储
    async clear() {
        await this.state.storage.deleteAll();
    }
}

// 用户存储Durable Object
export class ChatUsers {
    constructor(state, env) {
        this.state = state;
        this.env = env;
    }
    
    async put(key, value) {
        await this.state.storage.put(key, value);
    }
    
    async get(key) {
        return await this.state.storage.get(key);
    }
    
    async delete(key) {
        await this.state.storage.delete(key);
    }
    
    async list(options = {}) {
        return await this.state.storage.list(options);
    }
    
    async clear() {
        await this.state.storage.deleteAll();
    }
}

// 获取存储实例的辅助函数
export function getChatRooms(env) {
    return env.CHAT_ROOMS.idFromName('rooms');
}

export function getChatUsers(env) {
    return env.CHAT_USERS.idFromName('users');
}
