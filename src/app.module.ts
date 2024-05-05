import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventLogsModule } from './event-logs/event-logs.module';
import { MilestoneModule } from './milestone/milestone.module';
import { S3Module } from './s3/s3.module';
import { TargetModule } from './target/target.module';
import { TaskModule } from './task/task.module';
import { TrackerModule } from './tracker/tracker.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD') ?? '',
        database: configService.get('DATABASE_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DATABASE_SYNCRONIZE'),
        logging: !!configService.get('DATABASE_LOGGING'),
        autoLoadEntities: false,
      }),
    }),
    MulterModule.register({
      dest: './common/interceptors/file-interceptor',
    }),
    AuthModule,
    UserModule,
    WorkspaceModule,
    TrackerModule,
    EventLogsModule,
    MilestoneModule,
    TaskModule,
    TargetModule,
    S3Module,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
