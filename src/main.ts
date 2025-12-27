import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정 (Frontend와 통신)
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, "http://localhost:3000"]
    : ["http://localhost:3000"];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global Validation Pipe (DTO 자동 검증)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성 자동 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성 있으면 에러
      transform: true, // 타입 자동 변환
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger API 문서 설정
  const config = new DocumentBuilder()
    .setTitle("AURA Backend API")
    .setDescription("LiveKit 기반 화상 회의 서비스 API")
    .setVersion("1.0")
    .addTag("health", "서버 상태 확인")
    .addTag("room", "방 관리")
    .addTag("token", "토큰 발급")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api-docs`);
}

bootstrap();
