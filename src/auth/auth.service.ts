import { UsersService } from 'src/users/users.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { SigninDto } from './dto/signin.dto';
import { Response, Request } from 'express';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(
    registerDto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
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
      if (user) {
        req.session.user = user;
      }
      const accessToken = await this.getAccessToken(user.id, user.email);
      const refreshToken = await this.getRefreshToken(user.id, user.email);

      res.cookie('jwt-token', accessToken, {
        httpOnly: true, // accessible only by the web server
        secure: true, // https only
        sameSite: 'none', // cross site cookie
        maxAge: 5 * 60 * 1000, // cookie expiry: set to match accessToken (5 min)
      });

      res.cookie('jwt-token-refresh', refreshToken, {
        httpOnly: true, // accessible only by the web server
        secure: true, // https only
        sameSite: 'none', // cross site cookie
        maxAge: 5 * 60 * 1000, // cookie expiry: set to match accessToken (5 min)
      });
      await this.redisService.set('user', user.id);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async signin(body: SigninDto, @Res() res: Response) {
    const { email, password } = body;
    try {
      // const user = await this.userService.findUserByEmail(email);
      const user = await this.validateUser(email, password);
      const payload = {
        sub: user.id,
        fristName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        expiresIn: this.configService.getOrThrow<string>(
          'accessTokenExpiresIn',
        ),
      };
      const accessToken = await this.getAccessToken(payload.sub, payload.email);

      res.cookie('jwt-token', accessToken, {
        httpOnly: true, // accessible only by the web server
        secure: true, // https only
        sameSite: 'none', // cross site cookie
        maxAge: 5 * 60 * 1000, // cookie expiry: set to match accessToken (5 min)
      });

      const refreshToken = await this.getRefreshToken(user.id, user.email);

      res.cookie('jwt-token-refresh', refreshToken, {
        httpOnly: true, // accessible only by the web server
        secure: true, // https only
        sameSite: 'none', // cross site cookie
        maxAge: 24 * 60 * 60 * 1000, // cookie expiry: set to match refreshToken (1d)
      });

      return {
        accessToken,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new Error('User doesnt exist');
    }
    const verified = await argon2.verify(user.password, password);
    if (verified) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid password');
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
      expiresIn: this.configService.getOrThrow<string>('accessTokenExpiresIn'),
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
      expiresIn: this.configService.getOrThrow<string>('refreshTokenExpiresIn'),
      secret: this.configService.getOrThrow('JWT_REFRESH'),
    });
    return token;
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['jwt-token-refresh'] as string;
    try {
      const verified = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow('JWT_REFRESH'),
      });
      if (!verified) {
        res.clearCookie('jwt-token');
        throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
      }
    } catch (error) {
      throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }

    const { email } = this.jwtService.decode(refreshToken) as { email: string };

    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    // create new access token
    const payload = {
      firsName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      id: user.id,
      expiresIn: this.configService.getOrThrow<string>('accessTokenExpiresIn'),
    };
    const accessToken = await this.getAccessToken(payload.id, payload.email);

    res.cookie('jwt-token', accessToken, {
      httpOnly: true, // accessible only by the web server
      secure: true, // https only
      sameSite: 'none', // cross site cookie
      maxAge: 5 * 60 * 1000, // cookie expiry: set to match accessToken (15 minutes)
    });

    return res.json({
      accessToken,
    });
  }
}
