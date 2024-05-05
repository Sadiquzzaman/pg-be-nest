import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'email-smtp.ap-southeast-1.amazonaws.com',
        port: parseInt(process.env.SMTP_Port),
        secure: true,
        tls: {
          ciphers: 'SSLv3',
        },
        auth: {
          user: 'AKIAUFGVMH6EKOE62L44',
          pass: 'BO5FPtMizm/bjfZAOTGkZgji0Y1b6L8tBxG2zaFQbCSY',
        },
      },

      defaults: {
        from: 'noreply@progress-tracker.vivasoftltd.com',
      },
      preview: true,
      //   template: {
      //     dir: process.cwd() + '/template/',
      //     adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
      //     options: {
      //       strict: true,
      //     },
      //   },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
