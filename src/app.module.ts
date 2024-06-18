import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'
import { TasksModule } from './tasks/tasks.module';
import { ConfigModule, ConfigService} from '@nestjs/config';
import { TypeOrmConfigService } from './type-orm-config.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
    TasksModule,
  ],
})
export class AppModule {}
