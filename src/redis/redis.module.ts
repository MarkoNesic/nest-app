import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RedisService } from './redis.service';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import redisConfig, { REDIS_CONFIG_KEY } from './config/redis.config';

export const REDIS_MICROSERVICE_KEY = 'REDIS_MICROSERVICE';
export const SESSION_STORE_KEY = 'SESSION_STORE';

const redisMicroserviceFactory = {
  provide: REDIS_MICROSERVICE_KEY,
  useFactory: (configService: ConfigService) => {
    const config =
      configService.get<ConfigType<typeof redisConfig>>(REDIS_CONFIG_KEY);
    return ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: { ...config },
    });
  },
  inject: [ConfigService],
};

const sessionStoreFactory = {
  provide: SESSION_STORE_KEY,
  useFactory: async (configService: ConfigService) => {
    const config =
      configService.get<ConfigType<typeof redisConfig>>(REDIS_CONFIG_KEY);
    const redisClient = createClient(config);
    await redisClient.connect();
    return new RedisStore({ client: redisClient });
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [redisMicroserviceFactory, RedisService, sessionStoreFactory],
  exports: [redisMicroserviceFactory, RedisService, sessionStoreFactory],
})
export class RedisModule {}
