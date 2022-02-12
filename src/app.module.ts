import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoStreamService } from './video-stream.service';
import { VideoStreamGateway } from './videoStream.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService,VideoStreamGateway,VideoStreamService],
})
export class AppModule {}
