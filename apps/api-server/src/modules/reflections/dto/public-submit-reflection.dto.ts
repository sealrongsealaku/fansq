import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class PublicSubmitReflectionDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  student_name!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  submit_content!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  reflection_type_id!: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @IsInt()
  @Min(1)
  teaching_project_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  is_anonymous?: boolean = false;
}
