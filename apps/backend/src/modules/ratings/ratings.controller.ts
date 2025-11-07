import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @Get()
  findAll() {
    return this.ratingsService.findAll();
  }

@Get('find')
  async findOne(
    @Query('rater_id') rater_id: string,
    @Query('ratee_id') ratee_id: string,
  ) {
    return this.ratingsService.findOneByRaterAndRatee(rater_id, ratee_id);
}


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(id, updateRatingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingsService.remove(+id);
  }
}
