import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthDto } from './dto/auth.dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegistrationCommand } from './use-cases/registration-use.case';
import { ConfirmationCommand } from './use-cases/confirmation.use-case';
import { EmailConfirmation } from '@prisma/client';
import { EmailResendingCommand } from './use-cases/emailResending.use-case';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from './decorator/request.decorator';
import { GoogleOAuthGuard } from './google/guard/google-oauth.guard';
import { UserModel } from '../users/types/types';
import { Cookies } from './decorator/cookies.decorator';
import { LogoutCommand } from './use-cases/logout.use-case';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './service/auth.service';
import { LoginCommand } from './use-cases/login.use-case';

@Controller('auth')
export class AuthController {
  constructor(
    private commandBus: CommandBus,
    private readonly authService: AuthService,
  ) {}

  @Post('/registration')
  @HttpCode(204)
  async registration(@Body() dto: AuthDto): Promise<boolean> {
    return this.commandBus.execute(new RegistrationCommand(dto));
  }

  @Get()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req: Request) {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Req() req: Request) {
    return this.authService.googleLogin(req);
  }

  @Throttle(5, 10)
  @Post('/registration-confirmation')
  @HttpCode(204)
  async registrationConfirmation(
    @Body('code') code: string,
  ): Promise<EmailConfirmation> {
    return this.commandBus.execute(new ConfirmationCommand(code));
  }

  @Throttle(5, 10)
  @Post('/registration-email-resending')
  @HttpCode(204)
  async registrationEmailResending(
    @Body('email') email: string,
  ): Promise<boolean> {
    return this.commandBus.execute(new EmailResendingCommand(email));
  }

  @UseGuards(LocalAuthGuard)
  @Throttle(5, 10)
  @HttpCode(200)
  @Post('/login')
  async userLogin(
    @User() user: UserModel,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const ip = req.ip;
    const title = req.headers['user-agent'] || 'browser not found';
    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginCommand(ip, title, user),
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: false,
      secure: false,
    });
    return { accessToken: accessToken };
  }

  @Post('/logout')
  @HttpCode(204)
  async userLogout(@Cookies() cookies): Promise<boolean> {
    return this.commandBus.execute(new LogoutCommand(cookies.refreshToken));
  }

  @UseGuards(LocalAuthGuard)
  @Get('/me')
  async getUser(
    @User() user: UserModel,
  ): Promise<{ email: string; login: string; userId: string }> {
    console.log('user', user);
    return { email: user.email, login: user.login, userId: user.id };
  }
}
