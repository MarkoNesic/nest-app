import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from './auth/auth.module';
import { ErrorInterceptor } from './error.interceptor';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AppLoggerMiddleware } from './logger.middleware';
import { UsersModule } from './users/users.module';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SessionMiddleware } from './session.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    FileUploadModule,
    MulterModule.register({ dest: './uploads' }),
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
