import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
    UserRole,
    UserStatus,
    OtpType,
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { OtpService } from './otp.service';
import {
    ConflictException,
    InvalidCredentialsException,
    NotFoundException,
    OtpInvalidException,
    UnauthorizedException,
} from '../../../common/exceptions/business.exception';

import { ConfigService } from '@nestjs/config';
import { generateTokens } from '../utils/token.util';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly otpService: OtpService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async register(dto: RegisterDto) {
        if (dto.password !== dto.confirmPassword) {
            throw new ConflictException('Passwords do not match');
        }

        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                role: UserRole.USER,
                status: UserStatus.PENDING_VERIFICATION
            },
        });

        try {
            await this.otpService.sendOtp({
                email: user.email!,
                type: OtpType.ACCOUNT_VERIFY,
            });
        } catch (error) {
            await this.prisma.user.delete({ where: { id: user.id } });
            throw error;
        }

        // this.eventEmitter.emit('activity.log', {
        //     type: 'USER_REGISTERED',
        //     message: `${user.email} joined the platform`,
        //     metadata: { userId: user.id },
        // });

        return ResponseHelper.created(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            'Registration successful. Please check your email for the verification code.',
        );
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.password) {
            throw new InvalidCredentialsException();
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new InvalidCredentialsException();
        }

        if (user.status === UserStatus.PENDING_VERIFICATION) {
            await this.otpService.sendOtp({
                email: user.email!,
                type: OtpType.ACCOUNT_VERIFY,
            });
            throw new UnauthorizedException(
                'Your account is not verified yet. We have sent a new OTP to your email. Please verify your account to continue.',
            );
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException(
                `Your account is currently ${user.status}. Please contact support.`,
            );
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // this.eventEmitter.emit('activity.log', {
        //     type: 'USER_LOGIN',
        //     message: `${user.email} logged in`,
        //     metadata: { userId: user.id },
        // });

        const payload = { sub: user.id, email: user.email, role: user.role };
        const { accessToken, refreshToken } = generateTokens(
            this.jwtService,
            this.configService,
            payload,
        );

        return ResponseHelper.success(
            {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            },
            'Login successful',
        );
    }

    async refreshToken(dto: RefreshTokenDto) {
        try {
            const decoded = this.jwtService.verify(dto.refreshToken);

            // Verify user exists and is active
            const user = await this.prisma.user.findUnique({
                where: { id: decoded.sub },
            });
            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }

            // Generate a new token pair
            const payload = {
                sub: user.id,
                email: user.email,
                role: user.role
            };
            const { accessToken, refreshToken } = generateTokens(
                this.jwtService,
                this.configService,
                payload,
            );

            return ResponseHelper.success(
                { accessToken, refreshToken },
                'Token refreshed successfully',
            );
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }
}