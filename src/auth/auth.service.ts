import { UsersService } from 'src/users/users.service';
import { Injectable, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
// import { RefreshTokenDto } from './dto/refresh.dto';
import { SigninDto } from './dto/signin.dto';
import { Response, Request } from 'express';
import { ACCOUNT_NOT_FOUND, UNAUTHORIZED } from 'src/constrains';

// import { UNAUTHORIZED } from 'src/constrains';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
        maxAge: 5 * 60 * 1000, // cookie expiry: set to match accessToken (5 min)
      });

      return {
        accessToken,
        // access_token: accessToken,
        // refresh_token: refreshToken,
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
      expiresIn: this.configService.getOrThrow<string>('refreshTokenExpiresIn'),
      secret: this.configService.getOrThrow('JWT_REFRESH'),
    });
    return token;
  }

  async refresh(req: Request, res: Response) {
    const cookies = req.cookies;
    if (!cookies['jwt-token-refresh']) {
      console.log('no jwt-token-refresh');
      return res.status(401).json({ message: UNAUTHORIZED });
    }

    const refreshToken = cookies['jwt-token-refresh'] as string;
    console.log('refreshToken from cookies is:', refreshToken);
    const verified = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
    });
    console.log('refresh token is verified:', verified);

    if (!verified) {
      return res.status(401).json({ message: UNAUTHORIZED });
    }

    const { email } = this.jwtService.decode(refreshToken) as { email: string };

    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: ACCOUNT_NOT_FOUND });
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

//singin
// const valid = await argon2.verify(user.password, password);
// if (!valid) {
//   throw new Error('Invalid password');
// }
// const userIsValidated = await this.validateUser(email, password);
// if (!userIsValidated) {
//   return null;
// }
//
