import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { AlertChannel, AlertType } from '@prisma/client';

export class CreateAlertDto {
  @IsEnum(AlertType)
  type!: AlertType;

  @IsEnum(AlertChannel)
  channel!: AlertChannel;

  @IsNumber()
  threshold!: number;

  @IsString()
  destination!: string;

  @IsOptional()
  @IsString()
  hotkeyId?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  enabled?: boolean;
}
