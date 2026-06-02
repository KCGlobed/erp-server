import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }
    async sendMail(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                html,
            });
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }
}
