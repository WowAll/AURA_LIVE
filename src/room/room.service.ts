import { Injectable, InternalServerErrorException, Inject } from "@nestjs/common";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { RoomMetadata } from "./dto/create-room.dto";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class RoomService {
  private roomClient: RoomServiceClient;

  constructor(
    @Inject(RedisService) private readonly redisService: RedisService
  ) {
    const livekitUrl = process.env.LIVEKIT_URL || "ws://localhost:7880";
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn("LiveKit credentials not configured");
    }

    this.roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  }

  /**
   * LiveKit 서버에 방 생성
   */
  async createRoomOnLiveKit(roomId: string, maxParticipants: number = 10) {
    try {
      const room = await this.roomClient.createRoom({
        name: roomId,
        emptyTimeout: 300, // 5분 동안 비어있으면 자동 삭제
        maxParticipants,
      });

      console.log("Room created on LiveKit:", {
        name: room.name,
        sid: room.sid,
        maxParticipants: room.maxParticipants,
      });

      return room;
    } catch (error) {
      console.error("Failed to create room on LiveKit:", error);
      throw new InternalServerErrorException(
        `Failed to create room: ${error.message}`
      );
    }
  }

  /**
   * 방 메타데이터 저장 (Redis)
   */
  async saveRoomMetadata(metadata: RoomMetadata): Promise<void> {
    await this.redisService.saveRoom(metadata.roomId, metadata);
  }

  /**
   * 방 메타데이터 조회 (Redis)
   */
  async getRoomMetadata(roomId: string): Promise<RoomMetadata | null> {
    const data = await this.redisService.getRoom(roomId);
    return data as RoomMetadata | null;
  }

  /**
   * 모든 방 목록 조회 (Redis)
   */
  async getAllRooms(): Promise<RoomMetadata[]> {
    const rooms = await this.redisService.getAllRooms();
    return rooms as RoomMetadata[];
  }


  /**
   * LiveKit Token 생성
   */
  async createToken(roomId: string, userName: string): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    console.log("Creating token:", {
      roomId,
      userName,
      apiKey,
      hasSecret: !!apiSecret,
    });

    if (!apiKey || !apiSecret) {
      console.error("Missing API credentials!");
      throw new InternalServerErrorException(
        "LiveKit API Key or Secret not configured"
      );
    }

    try {
      // AccessToken 생성
      const token = new AccessToken(apiKey, apiSecret, {
        identity: userName,
      });

      // 방 접근 권한 부여
      token.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      // JWT 문자열로 반환
      const jwt = await token.toJwt();
      console.log("Token created:", jwt.substring(0, 50) + "...");
      return jwt;
    } catch (error) {
      console.error("Failed to create token:", error);
      throw new InternalServerErrorException(
        `Failed to create token: ${error.message}`
      );
    }
  }
}
