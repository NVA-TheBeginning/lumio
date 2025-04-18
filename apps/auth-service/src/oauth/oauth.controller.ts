import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthTokens } from "@/auth/auth.service";
import { OAuthDto } from "./dto/dto.js";
import { OAuthService } from "./oauth.service.js";

@ApiTags("auth")
@Controller("auth/oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate using Google OAuth2 token" })
  google(@Body() dto: OAuthDto): Promise<AuthTokens> {
    return this.oauthService.handleGoogle(dto.token);
  }

  @Post("microsoft")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate using Microsoft OAuth2 token" })
  microsoft(@Body() dto: OAuthDto): Promise<AuthTokens> {
    return this.oauthService.handleMicrosoft(dto.token);
  }
}
