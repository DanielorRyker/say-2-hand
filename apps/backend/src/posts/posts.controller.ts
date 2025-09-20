import { Controller, Get, Post, Body, Patch, Param, Delete} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';


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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.postsService.findByUserId(userId);
  }
}
