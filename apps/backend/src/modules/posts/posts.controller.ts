import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../../common/jwt/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  // Task 23: Thêm pagination params
  @Get('postmap')
  findAllForHome(@Query() paginationDto: PaginationDto) {
    return this.postsService.findAllForHome(
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }
  @Get('oldest')
  findAllSortOldest() {
    return this.postsService.findAllSortOldest();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findAllPending() {
    return this.postsService.findAllPending();
  }

  @Get('active')
  findAllActive() {
    return this.postsService.findAllActive();
  }

  @Get('rejected')
  @UseGuards(JwtAuthGuard)
  findAllRejected() {
    return this.postsService.findAllRejected();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.postsService.removePost(id);
  }

  // Task 23: Thêm pagination params
  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.postsService.findByUserId(
      userId,
      paginationDto.page,
      paginationDto.limit,
    );
  }

  @Post('by-ids')
  findByIds(@Body('ids') ids: string[]) {
    return this.postsService.findByIds(ids);
  }

  @Get('counts/province')
  countsByProvince() {
    return this.postsService.countsByProvince();
  }
}
