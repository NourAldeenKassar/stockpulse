import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLlmDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  llmGatewayUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  llmGatewayKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  finnhubKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  llmPremiumGatewayUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  llmPremiumKey?: string;
}
