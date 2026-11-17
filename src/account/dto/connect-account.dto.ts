import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ConnectAccountDto {
  @IsString()
  @MinLength(1)
  apiKey!: string;

  @IsString()
  @MinLength(1)
  apiSecret!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  label?: string;
}
