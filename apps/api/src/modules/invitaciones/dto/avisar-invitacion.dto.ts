import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsUUID, MaxLength } from "class-validator";

/** La app avisa por correo después de invitar a alguien con invitar() en Supabase. */
export class AvisarInvitacionDto {
  @ApiProperty({ example: "ana@ejemplo.com" })
  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ type: [String], description: "Inventarios a los que se lo invitó" })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID("all", { each: true })
  inventarios: string[];
}
