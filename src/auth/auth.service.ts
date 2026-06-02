import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ROLE_NAMES } from '../common/constants/rbac.constants';
import {
  extractRolesAndPermissions,
  userWithRolesInclude,
  UserWithRoles,
} from '../common/utils/user-mapper.util';
import { generateRefreshToken, hashToken } from '../common/utils/token.util';
import { JwtPayload } from '../common/types/jwt-payload.type';
import { AuthUser } from '../common/types/auth-user.type';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  private readonly refreshExpiresDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService
  ) {
    this.refreshExpiresDays = parseInt(
      this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS', '7'),
      10,
    );
  }
  private generatePassword(length = 8): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

    let password = '';

    for (let i = 0; i < length; i++) {
      password += chars.charAt(
        Math.floor(Math.random() * chars.length),
      );
    }

    return password;
  }

  async register(dto: RegisterDto, currentUser: AuthUser, deviceInfo?: string, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const roleName = dto.role || ROLE_NAMES.STUDENT;

    const isSuperAdmin = currentUser.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    if (!isSuperAdmin) {
      // Must be an ADMIN, restrict them from creating SUPER_ADMIN or ADMIN
      if (roleName === ROLE_NAMES.SUPER_ADMIN || roleName === ROLE_NAMES.ADMIN) {
        throw new ForbiddenException('Admin cannot create another Admin or Super Admin');
      }
    }
    const generatedPassword = this.generatePassword(8);

    const passwordHash = await bcrypt.hash(
      generatedPassword,
      10,
    );
    const targetRole = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(targetRole
          ? { roles: { create: { roleId: targetRole.id } } }
          : {}),
      },
      include: userWithRolesInclude,
    });
    await this.mailService.sendMail(dto.email, "Welcome Email", `<div>
    <p>Welcome to our platform ${dto.firstName} ${dto.lastName}</p>
    <p>Your email is ${dto.email}</p>
    <p>Your password is ${generatedPassword}</p>
    <p>Your role is ${roleName}</p>
    </div>`)
    return this.issueTokenPair(user, deviceInfo, ipAddress);
  }

  async login(dto: LoginDto, deviceInfo?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: userWithRolesInclude,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user, deviceInfo, ipAddress);
  }

  async refresh(refreshToken: string, deviceInfo?: string, ipAddress?: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: userWithRolesInclude },
      },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.user, deviceInfo, ipAddress);
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  private async issueTokenPair(
    user: UserWithRoles,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const { roles, permissions } = extractRolesAndPermissions(user);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };

    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshExpiresDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        deviceInfo: deviceInfo ?? null,
        ipAddress: ipAddress ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, expiresIn };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clean up old OTPs for this email
    await this.prisma.passwordResetOtp.deleteMany({
      where: { email: dto.email.toLowerCase() },
    });

    // Save new OTP
    await this.prisma.passwordResetOtp.create({
      data: {
        email: dto.email.toLowerCase(),
        otp,
        expiresAt,
      },
    });

    // Send OTP via email
    await this.mailService.sendMail(
      dto.email.toLowerCase(),
      'Password Reset OTP - EduERP',
      `<div>
        <h3>Password Reset Request</h3>
        <p>You requested to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed:</p>
        <h2 style="letter-spacing: 2px; color: #3b82f6; font-size: 28px; font-weight: bold;">${otp}</h2>
        <p>This OTP is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
      </div>`
    );

    return { message: 'OTP sent successfully to your email' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const record = await this.prisma.passwordResetOtp.findFirst({
      where: { email: dto.email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.otp !== dto.otp || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetOtp.findFirst({
      where: { email: dto.email.toLowerCase() },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.otp !== dto.otp || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update user's password
    await this.prisma.user.update({
      where: { email: dto.email.toLowerCase() },
      data: { passwordHash },
    });

    // Clean up OTPs
    await this.prisma.passwordResetOtp.deleteMany({
      where: { email: dto.email.toLowerCase() },
    });

    return { message: 'Password has been reset successfully' };
  }
}
