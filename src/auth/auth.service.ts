import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { RefreshTokenDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signin(password: string, email: string) {
    try {
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const valid = await argon2.verify(user.password, password);
      if (!valid) {
        throw new Error('Invalid password');
      }

      return {
        access_token: await this.getAccessToken(user.id, user.email),
        refresh_token: await this.getRefreshToken(user.id, user.email),
      };
    } catch (error) {
      console.error(error);
    }
  }

  async hashPassword(password: string) {
    const hashed = await argon2.hash(password);
    return hashed;
  }

  async getAccessToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret: this.configService.getOrThrow('JWT_SECRET'),
    });
    return token;
  }

  async getRefreshToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
      secret: this.configService.getOrThrow('JWT_REFRESH'),
    });
    return token;
  }

  async register(registerDto: RegisterDto) {
    try {
      const userExist = await this.userService.findUserByEmail(
        registerDto.email,
      );
      if (userExist) {
        throw new Error('User already exist');
      }
      const user = await this.userService.createUser({
        ...registerDto,
        password: await this.hashPassword(registerDto.password),
      });
      delete user.password;
      return {
        access_token: await this.getAccessToken(user.id, user.email),
        refresh_token: await this.getRefreshToken(user.id, user.email),
        user,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async refresh1(refreshTokenDto: RefreshTokenDto) {
    const verified = await this.jwtService.verifyAsync(
      refreshTokenDto.refreshToken,
      {
        secret: this.configService.getOrThrow('JWT_REFRESH'),
      },
    );
    if (!verified) {
    }
  }
  async refresh(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies['jwt-token-refresh']) {
      console.log("no jwt-token-refresh")
      return res.status(401).json({ message: UNAUTHORIZED });
    }
}
