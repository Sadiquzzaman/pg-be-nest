import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity/user.entity';
import { UserRepository } from './repositories/user.repository';
import { CryptoUtil } from 'src/common/utils/crypto.util';
import { JwtService } from '@nestjs/jwt';
import { UserFilterUtil } from 'src/common/utils/user-filter.util';
import { S3Module } from 'src/s3/s3.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), S3Module, MailModule],
  providers: [
    UserService,
    UserRepository,
    CryptoUtil,
    JwtService,
    UserFilterUtil,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
