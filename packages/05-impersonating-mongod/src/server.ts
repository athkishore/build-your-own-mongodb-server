import { createServer, Socket } from 'node:net';
import { processBuffer } from './wire-lib.js';

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = '27017';

async function handleNewConnection(sock: Socket) {
  const bufHolder = { buf: Buffer.alloc(0) };

  sock.on('data', data => {
    bufHolder.buf = Buffer.concat([bufHolder.buf, Buffer.from(data)]);
    const messages = processBuffer(bufHolder);
    messages.forEach(message => {
      console.dir(message.payload, { depth: null });
    })
  })
}

const server = createServer(handleNewConnection);

server.listen({
  host: LISTEN_HOST,
  port: LISTEN_PORT,
}, () => {
  console.log('Custom mongodb server listening on', `${LISTEN_HOST}:${LISTEN_PORT}`);
});
