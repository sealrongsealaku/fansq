import { Transform } from "class-transformer";
import { IsBoolean } from "class-validator";

export class UpdatePublicDisplaySettingDto {
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  show_view_count!: boolean;
}
