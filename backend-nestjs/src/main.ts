import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS : autoriser le frontend Vercel en production, localhost en développement
  const allowedOrigins = [
    // Développement local
    'http://localhost:3000',
    'http://localhost:4028',
    // Production Vercel — remplacer par l'URL réelle après déploiement
    process.env.FRONTEND_URL,
    // Accepte tous les sous-domaines vercel.app (previews incluses)
    /\.vercel\.app$/,
  ].filter(Boolean); // Retire les valeurs undefined si FRONTEND_URL n'est pas défini

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Serveur NestJS démarré avec succès sur http://0.0.0.0:${port}`);
  console.log(`🔑 Endpoints d'Authentification : http://0.0.0.0:${port}/api/v1/auth/login`);
}
bootstrap();
