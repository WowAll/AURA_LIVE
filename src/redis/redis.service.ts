import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly client: Redis;
    private readonly ROOM_PREFIX = "room:";
    private readonly ROOM_TTL = 60 * 60 * 24; // 24시간

    constructor() {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        this.client = new Redis(redisUrl);

        this.client.on("connect", () => {
            console.log("✅ Redis connected");
        });

        this.client.on("error", (err) => {
            console.error("❌ Redis error:", err);
        });
    }

    async onModuleDestroy() {
        await this.client.quit();
    }

    /**
     * 방 메타데이터 저장
     */
    async saveRoom(roomId: string, metadata: Record<string, any>): Promise<void> {
        const key = this.ROOM_PREFIX + roomId;
        await this.client.setex(key, this.ROOM_TTL, JSON.stringify(metadata));
        console.log(`Room saved to Redis: ${roomId}`);
    }

    /**
     * 방 메타데이터 조회
     */
    async getRoom(roomId: string): Promise<Record<string, any> | null> {
        const key = this.ROOM_PREFIX + roomId;
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * 방 삭제
     */
    async deleteRoom(roomId: string): Promise<void> {
        const key = this.ROOM_PREFIX + roomId;
        await this.client.del(key);
        console.log(`Room deleted from Redis: ${roomId}`);
    }

    /**
     * 모든 방 목록 조회
     */
    async getAllRooms(): Promise<Record<string, any>[]> {
        const keys = await this.client.keys(this.ROOM_PREFIX + "*");
        if (keys.length === 0) return [];

        const rooms: Record<string, any>[] = [];
        for (const key of keys) {
            const data = await this.client.get(key);
            if (data) {
                rooms.push(JSON.parse(data));
            }
        }
        return rooms;
    }

    /**
     * 방 TTL 갱신
     */
    async refreshRoomTTL(roomId: string): Promise<void> {
        const key = this.ROOM_PREFIX + roomId;
        await this.client.expire(key, this.ROOM_TTL);
    }

    /**
     * Redis 연결 상태 확인
     */
    async ping(): Promise<string> {
        return this.client.ping();
    }
}
