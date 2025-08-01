import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthLogin } from "@/auth/auth.service";
import { OAuthDto } from "./dto/dto.js";
import { OAuthService } from "./oauth.service.js";

@ApiTags("auth")
@Controller("auth/oauth")
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  @Post("google")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate using Google OAuth2 token" })
  @ApiBody({ type: OAuthDto })
  google(@Body() dto: OAuthDto): Promise<AuthLogin> {
    return this.oauthService.handleGoogle(dto.token);
  }

  @Post("microsoft")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate using Microsoft OAuth2 token" })
  @ApiBody({ type: OAuthDto })
  microsoft(@Body() dto: OAuthDto): Promise<AuthLogin> {
    return this.oauthService.handleMicrosoft(dto.token);
  }
}
