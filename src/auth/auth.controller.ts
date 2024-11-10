import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Request,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SigninDto } from './dto/signin.dto';
import { RefreshGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signin')
  async signin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signin(signinDto, res);
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, req, res);
  }

  /**
   * Asynchronously refreshes the authentication token.
   *
   * @param {@Request()} req - The Express request object.
   * @param {@Res()} res - The Express response object.
   * @return {Promise<void>} A promise that resolves when the authentication token is refreshed.
   */

  @UseGuards(RefreshGuard)
  @Get('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ): Promise<Response<any, Record<string, any>>> {
    return this.authService.refresh(req, res);
  }

  @Get('')
  async getAuthSession(@Session() session: Record<string, any>) {
    console.log(session);
    return session;
  }
}
