import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PasswordResetsService } from './password_resets.service';
import { CreatePasswordResetDto } from './dto/create-password_reset.dto';
import { UpdatePasswordResetDto } from './dto/update-password_reset.dto';

@Controller('password-resets')
export class PasswordResetsController {
  constructor(private readonly passwordResetsService: PasswordResetsService) {}

  @Post()
  create(@Body() createPasswordResetDto: CreatePasswordResetDto) {
    return this.passwordResetsService.create(createPasswordResetDto);
  }

  @Get()
  findAll() {
    return this.passwordResetsService.findAll();
  }
  @Get('findMany/:id')
  findMany(@Param('id') id: string) {
    return this.passwordResetsService.findMany(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.passwordResetsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePasswordResetDto: UpdatePasswordResetDto,
  ) {
    return this.passwordResetsService.update(id, updatePasswordResetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.passwordResetsService.remove(id);
  }
}
