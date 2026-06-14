import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateColdkeyDto {
  @IsString()
  @MinLength(40)
  address!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateColdkeyDto {
  @IsOptional()
  @IsString()
  label?: string;
}
