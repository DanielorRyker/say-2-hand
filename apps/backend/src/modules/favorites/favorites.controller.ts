import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';


@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(@Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(createFavoriteDto);
  }

  @Get()
  findAll() {
    return this.favoritesService.findAll();
  }

  @Get('user/:user_id')
  findAllByUser(@Param('user_id') user_id: string) {
    return this.favoritesService.findAllByUser(user_id);
  }

 

  @Get(':user_id/:post_id')
    async findOne(
      @Param('user_id') user_id: string,
      @Param('post_id') post_id: string,
    ): Promise<boolean> {
      return this.favoritesService.findOne(user_id, post_id);
    }



  @Delete('post/:post_id')
    remove(
      @Param('post_id') post_id: string,
      @Body('user_id') user_id: string,
    ) 
    {
      return this.favoritesService.remove(user_id, post_id);
    }

}
