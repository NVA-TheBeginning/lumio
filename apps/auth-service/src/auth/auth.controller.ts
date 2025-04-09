import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthLogin, AuthService, AuthTokens } from "./auth.service.js";
import { SignInDto, SignUpDto } from "./dto/dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user" })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: "User successfully registered",
  })
  @ApiResponse({ status: 409, description: "Email already in use" })
  async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
    await this.authService.signUp(signUpDto.email, signUpDto.password);
    return { message: "User successfully registered" };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  signIn(@Body() signInDto: SignInDto): Promise<AuthLogin> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate new access/refresh token from validated user" })
  @ApiBody({ type: Object })
  refresh(@Body() user: { id: number; email: string }): Promise<AuthTokens> {
    return this.authService.refreshToken(user.id, user.email);
  }
}
