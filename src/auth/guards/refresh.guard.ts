import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        throw new HttpException('No token', HttpStatus.UNAUTHORIZED);
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('JWT_REFRESH'),
      });
      request.user = payload; // Attach the payload to the request
      return true;
    } catch (error) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const cookies = request.headers.cookie?.split(';') ?? [];
    const jwtToken = cookies.filter((cookie) =>
      cookie.includes('jwt-token-refresh'),
    );
    const token = jwtToken[0].split('=')[1];
    return token ? token : null;
  }
}
