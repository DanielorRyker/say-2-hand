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
import { SkipThrottle } from '@nestjs/throttler';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Admin only
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @SkipThrottle() // Public endpoint, không cần rate limit
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard) // Admin only
  update(@Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Admin only
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  /**
   * API endpoint để gợi ý icon cho danh mục
   */
  @Post('suggest-icon')
  @UseGuards(JwtAuthGuard) // Admin only
  async suggestIcon(@Body('name') name: string) {
    const icon = await this.categoriesService.suggestIcon(name);
    return { icon };
  }
}
