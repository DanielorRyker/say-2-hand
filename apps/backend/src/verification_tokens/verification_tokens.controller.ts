import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VerificationTokensService } from './verification_tokens.service';
import { CreateVerificationTokenDto } from './dto/create-verification_token.dto';
import { UpdateVerificationTokenDto } from './dto/update-verification_token.dto';

@Controller('verification-tokens')
export class VerificationTokensController {
  constructor(private readonly verificationTokensService: VerificationTokensService) {}

  @Post()
  create(@Body()  createVerificationTokenDto: CreateVerificationTokenDto) {
    return this.verificationTokensService.create(createVerificationTokenDto);
  }

  @Get()
  findAll() {
    return this.verificationTokensService.findAll();
  }
  @Get('findMany/:id')
  findMany(@Param('id') id: string) {
    return this.verificationTokensService.findMany(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.verificationTokensService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVerificationTokenDto: UpdateVerificationTokenDto) {
    return this.verificationTokensService.update(+id, updateVerificationTokenDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.verificationTokensService.remove(id);
  }
}
