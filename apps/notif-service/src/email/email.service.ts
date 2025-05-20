import { Injectable } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const resend = new Resend(process.env.RESEND_KEY);

    if (!resend.emails) {
      throw new Error("Emails feature is not enabled");
    }

    console.log(`Sending email to ${to} with subject "${subject}"`);
    await resend.emails.send({
      from: "onboarding@resend.dev",
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
