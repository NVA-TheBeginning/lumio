import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthResult, AuthService } from "./auth.service.js";
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
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthResult> {
    return this.authService.signUp(signUpDto.email, signUpDto.password);
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: SignInDto })
  @ApiResponse({
    status: 200,
    description: "User successfully logged in",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  signIn(@Body() signInDto: SignInDto): Promise<AuthResult> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }
}
