import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  public async sendmail(to: string, subject: string, body: string) {
    try {
      await this.mailerService.sendMail({
        to: to,
        from: process.env.EMAIL_FROM,
        subject: subject,
        html: body,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new BadRequestException(error.reason);
    }
  }
}
