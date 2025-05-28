import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class EmailService {
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const resend = new Resend(process.env.RESEND_KEY);
    const isEmailEnabled = process.env.ENABLE_EMAILS === "true";

    if (!(resend.emails || isEmailEnabled)) {
      return;
    }

    console.log(`Sending email to ${to} with subject "${subject}"`);
    await sleep(3000);
    await resend.emails.send({
      from: "lumio@jayllyz.fr",
      to,
      subject,
      html: body,
    });
  }

  async createdStudentAccount(email: string, password: string): Promise<void> {
    const subject = "Welcome to Lumio";
    const body = `Your account has been created successfully. Your password is: ${password}`;
    await this.sendEmail(email, subject, body);
  }
}
