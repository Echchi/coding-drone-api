import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Coding Drone API')
    .setDescription('코딩 드론 프로젝트 API 명세서')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  document.tags = document.tags?.filter((tag) => tag.name !== 'App');
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
