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
      ca: fs.readFileSync("ca_bundle.crt"),
      key: fs.readFileSync("private.key"),
      cert: fs.readFileSync("certificate.crt"),
      rejectUnauthorized:false
    }});

  await app.listen(8443);
}
bootstrap();
