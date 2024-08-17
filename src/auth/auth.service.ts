import { PrismaService } from './../prisma.service';
import { Injectable } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  PrismaService: any;
  constructor(private prisma: PrismaService) {}

  async signin(userName: string, email: string) {
    const userEmail = await this.PrismaService.user.findOne(email);
    if (userEmail === email) {
      throw new Error('Email already exist');
      return;
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
