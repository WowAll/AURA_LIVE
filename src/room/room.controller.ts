import { Controller, Post, Body, Get } from "@nestjs/common";
import { RoomService } from "./room.service";
import { randomUUID } from "crypto";

interface TokenRequest {
  roomName: string;
  userName: string;
}

interface TokenResponse {
  token: string;
  url: string;
}

@Controller("api")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * Token 발급 API
   * POST /api/token
   */
  @Post("token")
  async getToken(@Body() body: TokenRequest): Promise<TokenResponse> {
    const { roomName, userName } = body;

    if (!roomName || !userName) {
      throw new Error("roomName and userName are required");
    }

    // Token 생성
    const token = await this.roomService.createToken(roomName, userName);

    return {
      token,
      url: process.env.LIVEKIT_URL || "ws://localhost:7880",
    };
  }

  /**
   * 상태 확인 API
   * GET /api/health
   */
  @Get("health")
  health() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 방 생성 API
   * POST /api/room/create
   */
  @Post("room/create")
  async createRoom(@Body() body: { userName: string }) {
    const roomId = `room-${randomUUID()}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    return {
      roomId,
      roomUrl: `${frontendUrl}/room/${roomId}`,
      userName: body.userName,
    };
  }
}
