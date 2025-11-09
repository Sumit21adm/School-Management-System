import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API is running on: http://localhost:${port}/api/v1`);
}
bootstrap();

