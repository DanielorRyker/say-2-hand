import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('checkActive/:email')
  inactiveAcount(@Param('email') email: string) {
    return this.usersService.inactiveAcount(email);
  }

  @Get('exist/:email')
  checkMailExists(@Param('email') email: string) {
    return this.usersService.isEmailExist(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('find/:email')
  async getUser(@Param('email') id: string) {
    const user = await this.usersService.findByEmail(id);
    if (!user) {
      return { message: 'User not found' };
    }
    return user;
  }
}
