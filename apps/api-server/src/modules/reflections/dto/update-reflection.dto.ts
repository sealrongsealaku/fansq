import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateReflectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reflection_title?: string;

  @IsOptional()
  @IsString()
  submit_content?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @IsInt()
  @Min(1)
  reflection_type_id?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    return Number(value);
  })
  teaching_project_id?: number | null;

  @IsOptional()
  @IsIn(["hidden", "visible"])
  display_status?: "hidden" | "visible";

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  is_top?: boolean;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
