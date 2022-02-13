import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import * as Express from 'express'
import * as fs from 'fs';
export class SocketAdapter extends IoAdapter {
  createIOServer(
    port: number,
    options?: ServerOptions & {
      namespace?: string;
      server?: any;
    },
  ) {
    const server = super.createIOServer(port, { ...options, cors: true });
    return server;
  }
}



async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors:true,
    
    httpsOptions: {
      cert: fs.readFileSync('server.crt'),
      key: fs.readFileSync('privatekey.pem'),
      rejectUnauthorized:false
    }});

  await app.listen(443);
}
bootstrap();
