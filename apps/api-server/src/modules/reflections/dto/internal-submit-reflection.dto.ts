import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class InternalSubmitReflectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  student_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reflection_title?: string;

  @IsString()
  @IsNotEmpty()
  submit_content!: string;

  @IsDateString()
  submit_time!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  submit_channel!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_group_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  source_group_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  raw_message_id?: string;
}
