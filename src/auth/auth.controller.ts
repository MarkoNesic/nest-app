import { Body, Controller, Post, Res, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Response, Request as ExpressRequest } from 'express';
import { RegisterDto } from './dto/register.dto';
// import { RefreshTokenDto } from './dto/refresh.dto';

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
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Asynchronously refreshes the authentication token.
   *
   * @param {@Request()} req - The Express request object.
   * @param {@Res()} res - The Express response object.
   * @return {Promise<void>} A promise that resolves when the authentication token is refreshed.
   */
  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ): Promise<Response<any, Record<string, any>>> {
    return this.authService.refresh(req, res);
  }
}
