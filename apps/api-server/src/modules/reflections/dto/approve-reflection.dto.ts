import { IsIn, IsOptional } from "class-validator";

export class ApproveReflectionDto {
  @IsOptional()
  @IsIn(["hidden", "visible"])
  display_status?: "hidden" | "visible";
}

