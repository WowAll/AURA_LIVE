import { Module } from "@nestjs/common";
import { RoomModule } from "./room/room.module";
import { RedisModule } from "./redis/redis.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [RedisModule, RoomModule],
  controllers: [HealthController],
})
export class AppModule { }
