import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {AuthService, AuthTokens} from "./auth.service.js";
import {RefreshTokenDto, SignInDto, SignUpDto} from "./dto/dto.js";

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
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthTokens> {
    return this.authService.signUp(signUpDto.email, signUpDto.password);
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
  signIn(@Body() signInDto: SignInDto): Promise<AuthTokens> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiBody({ type: RefreshTokenDto })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.authService.refresh(dto.refreshToken);
  }
}
