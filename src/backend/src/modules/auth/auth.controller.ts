import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BadgeLoginDto } from './dto/badge-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('badge-login')
  @HttpCode(HttpStatus.OK)
  async badgeLogin(
    @Body() badgeLoginDto: BadgeLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.badgeLogin(badgeLoginDto);
  }
}
