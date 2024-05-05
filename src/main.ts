import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { WrapResponseInterceptor } from './common/interceptors/wrap-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  //global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // exception factory for custom validation error message as key value pair
      // exceptionFactory: (validationErrors: ValidationError[] = []) => {
      //   const response_data = {};
      //   validationErrors.filter(function (values) {
      //     response_data[values.property] = Object.keys(values.constraints).map(
      //       (k) => values.constraints[k],
      //     );
      //   });
      //   return new BadRequestException(response_data);
      // },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Progress Tracker')
    .setDescription('Progress Tracker API DOC')
    .setVersion('1.0')
    .addTag('ProgressTracker')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('apidoc', app, document);

  //use custom made global handlers to use in app
  app.useGlobalInterceptors(new WrapResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
