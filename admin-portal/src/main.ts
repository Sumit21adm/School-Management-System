import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global prefix for admin API
    app.setGlobalPrefix('admin/api');

    // Enable CORS
    app.enableCors({
        origin: ['http://localhost:5174', 'http://localhost:3000'],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    const port = process.env.PORT || 3002;
    await app.listen(port);
    console.log(`🚀 Admin Portal API running on http://localhost:${port}/admin/api`);
}

bootstrap();
