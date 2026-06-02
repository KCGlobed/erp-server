import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSION_NAMES } from '../common/constants/rbac.constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user.type';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBearerAuth()
  @RequirePermissions(PERMISSION_NAMES.CREATE_USERS)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (SUPER_ADMIN or ADMIN)' })
  @ApiResponse({ status: 201, type: AuthTokensResponseDto })
  register(
    @Body() dto: RegisterDto, 
    @Req() req: { ip?: string; headers: Record<string, string> },
    @CurrentUser() user: AuthUser
  ) {
    return this.authService.register(
      dto,
      user,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  login(@Body() dto: LoginDto, @Req() req: { ip?: string; headers: Record<string, string> }) {
    return this.authService.login(dto, req.headers['user-agent'], req.ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token (RTR) and issue new token pair' })
  @ApiResponse({ status: 200, type: AuthTokensResponseDto })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: { ip?: string; headers: Record<string, string> },
  ) {
    return this.authService.refresh(
      dto.refreshToken,
      req.headers['user-agent'],
      req.ip,
    );
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request OTP to reset password' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({ status: 200, description: 'Password reset' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
