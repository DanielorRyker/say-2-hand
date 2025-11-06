import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
import type { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request): { csrfToken: string } {
    // CSRF token sẽ được tạo bởi csurf middleware
    return { csrfToken: (req as any).csrfToken?.() || '' };
  }
}
