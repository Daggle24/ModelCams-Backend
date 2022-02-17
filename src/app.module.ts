import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoStreamService } from './video-stream.service';
import { VideoStreamGateway } from './videoStream.gateway';
import { ConfigModule } from '@nestjs/config';
import configuration from 'config/configuration';
@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `${process.cwd()}/config/${process.env.NODE_ENV}.env`,
    load:[configuration]
  })],
  controllers: [AppController],
  providers: [AppService,VideoStreamGateway,VideoStreamService],
})
export class AppModule {
  
}
