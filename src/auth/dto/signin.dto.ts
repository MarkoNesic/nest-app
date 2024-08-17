import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
