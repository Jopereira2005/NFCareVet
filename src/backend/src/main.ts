import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NFCareVet API')
    .setDescription(
      'Documentação interativa da API do sistema NFCareVet - Gestão Hospitalar Veterinária e Leito com NFC.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Insira o token JWT gerado nos endpoints de login para autenticar as requisições.',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Autenticação', 'Endpoints de login convencional e autenticação rápida por crachá NFC')
    .addTag('Beira de Leito (Bedside)', 'Consultas rápidas por tag NFC de leito e checagem/aplicação de medicações')
    .addTag('Tags NFC', 'Gestão e provisionamento de tags NFC do leito hospitalar')
    .addTag('Usuários', 'Gerenciamento de colaboradores e permissões (Exclusivo ADMIN)')
    .addTag('Health & Diagnóstico', 'Monitoramento de integridade e testes de autorização RBAC')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'NFCareVet API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Aplicação em execução na porta: ${port}`);
  logger.log(`Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}
bootstrap();

