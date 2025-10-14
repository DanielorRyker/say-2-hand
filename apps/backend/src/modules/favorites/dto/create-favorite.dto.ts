
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
  
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;


  @IsNotEmpty()
  @IsMongoId()
  post_id: string;
}
