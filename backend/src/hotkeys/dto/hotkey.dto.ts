import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateHotkeyDto {
  @IsString()
  coldkeyId!: string;

  @IsString()
  @MinLength(40)
  address!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateHotkeyDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  coldkeyId?: string;
}
