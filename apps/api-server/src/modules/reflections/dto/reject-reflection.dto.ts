import { IsOptional, IsString, MaxLength } from "class-validator";

export class RejectReflectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}

