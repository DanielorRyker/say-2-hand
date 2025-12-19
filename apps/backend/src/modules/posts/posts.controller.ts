import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto, GeoSearchPostDto } from './dto/search-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get('postmap')
  findAllForHome() {
    return this.postsService.findAllForHome();
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
  findAllPending() {
    return this.postsService.findAllPending();
  }

  @Get('active')
  findAllActive() {
    return this.postsService.findAllActive();
  }

  @Get('rejected')
  findAllRejected() {
    return this.postsService.findAllRejected();
  }

  // ...existing code...

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.postsService.findByUserId(userId);
  }

  @Post('by-ids')
  findByIds(@Body('ids') ids: string[]) {
    return this.postsService.findByIds(ids);
  }

  @Get('counts/province')
  countsByProvince() {
    return this.postsService.countsByProvince();
  }

  @Get('search')
  searchPosts(@Query() searchDto: SearchPostDto, @Req() req) {
    // Log params thực tế nhận được
    console.log('[GET /posts/search] Query params:', req.query);
    try {
      return this.postsService.searchPosts(searchDto);
    } catch (err) {
      // Log lỗi validate nếu có
      console.error('[GET /posts/search] ERROR:', err?.message, err?.stack);
      throw err;
    }
  }

  @Get('search/nearby')
  geoSearchPosts(@Query() geoSearchDto: GeoSearchPostDto) {
    return this.postsService.geoSearchPosts(geoSearchDto);
  }

  @Post(':id/generate-tags')
  autoGenerateTags(@Param('id') id: string) {
    return this.postsService.autoGenerateTags(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.removePost(id);
  }

  // Đặt @Get(':id') CUỐI CÙNG để tránh conflict với các route tĩnh
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }
}
