import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    
    return this.usersService.create(createUserDto);
  }

  // @Get()
  // findAll() {
  //   return this.usersService.findAll();
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch()
  update( @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update( updateUserDto);
  }

 @Delete(':id')
   remove(@Param('id') id: string) {
  return  this.usersService.remove(id);
}

 @Get('checkActive/:email')
inactiveAcount(@Param('email') email: string) {
  return this.usersService.inactiveAcount(email);
}


  // @Get('find/:id')
  // async findUser(@Param('id') id: string) {
  //   const user = await this.usersService.findByUserId(id);
  //   if (!user) {
  //     return { message: 'User not found' };
  //   }
  //   return user;
  // }

}
