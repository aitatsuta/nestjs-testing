import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
    
    createTypeOrmOptions(): TypeOrmModuleOptions {
        const configService = new ConfigService();
        return {
            type: 'postgres',
            host: configService.get('DATABASE_HOST', 'localhost'),
            port: Number(configService.get('DATABASE_PORT', 5432)),
            username: configService.get('DATABASE_USERNAME', 'root'),
            password: configService.get('DATABASE_PASSWORD', 'secret'),
            database: configService.get('DATABASE_NAME', 'mydb-dev'),
            autoLoadEntities: true,
            synchronize: true,
        };
    }

}