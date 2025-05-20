import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { CreateMultipleStudentAccountsDto } from "./dto/email.dto";
import { EmailService } from "./email.service";

@Controller("email")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("create-students")
  @ApiOperation({ summary: "Send welcome emails to student accounts" })
  @ApiResponse({
    status: 200,
    description: "Welcome emails sent successfully for all accounts.",
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @ApiBody({
    type: CreateMultipleStudentAccountsDto,
    description: "Array of student account details to create and send emails to",
  })
  async createMultipleStudentAccounts(
    @Body() createMultipleStudentAccountsDto: CreateMultipleStudentAccountsDto,
  ): Promise<void> {
    await Promise.all(
      createMultipleStudentAccountsDto.users.map((user) =>
        this.emailService.createdStudentAccount(user.email, user.password),
      ),
    );
  }
}
