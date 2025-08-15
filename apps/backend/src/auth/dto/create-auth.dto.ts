import { IsNotEmpty } from "class-validator"

export class CreateAuthDto {
    @IsNotEmpty()
    email: string
    @IsNotEmpty()
    password_hash:string
}
