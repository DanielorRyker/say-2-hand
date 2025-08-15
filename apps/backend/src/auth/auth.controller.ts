
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}


  @Post('login')
  signIn(@Body() createAuthDto: CreateAuthDto ) {
    return this.authService.signIn(createAuthDto.email,createAuthDto.password_hash);
  }
}
