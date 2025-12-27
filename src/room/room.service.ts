import { Injectable } from "@nestjs/common";
import { AccessToken } from "livekit-server-sdk";

@Injectable()
export class RoomService {
  /**
   * LiveKit Token 생성
   * @param roomName 방 이름
   * @param userName 사용자 이름
   * @returns JWT Token
   */
  async createToken(roomName: string, userName: string): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    console.log("Creating token:", {
      roomName,
      userName,
      apiKey,
      hasSecret: !!apiSecret,
    });

    if (!apiKey || !apiSecret) {
      console.error("Missing API credentials!");
      throw new Error("LiveKit API Key or Secret not configured");
    }

    // AccessToken 생성
    const token = new AccessToken(apiKey, apiSecret, {
      identity: userName,
    });

    // 방 접근 권한 부여
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true, // 영상/음성 전송 가능
      canSubscribe: true, // 다른 사람 영상/음성 받기 가능
      canPublishData: true, // 데이터 전송 가능
    });

    // JWT 문자열로 반환
    const jwt = await token.toJwt();
    console.log("Token created:", jwt.substring(0, 50) + "...");
    return jwt;
  }
}
