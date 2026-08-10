import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS pour les requêtes du Frontend Next.js (port 3001 ou 4028)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Activer la validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Serveur NestJS démarré avec succès sur http://localhost:${port}`);
  console.log(`🔑 Endpoints d'Authentification : http://localhost:${port}/api/v1/auth/login`);
}
bootstrap();
