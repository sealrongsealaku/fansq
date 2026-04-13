import { IsIn } from "class-validator";

export class SetVisibilityDto {
  @IsIn(["hidden", "visible"])
  display_status!: "hidden" | "visible";
}

