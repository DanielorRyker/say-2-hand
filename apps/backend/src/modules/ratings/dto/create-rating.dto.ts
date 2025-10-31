
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsMongoId()
  @IsNotEmpty()
  rater_id: string;

  @IsMongoId()
  @IsNotEmpty()
  ratee_id: string;

  @IsMongoId()
  @IsNotEmpty()
  transaction_id: string;

  @IsMongoId()
  @IsNotEmpty()
  post_id: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

