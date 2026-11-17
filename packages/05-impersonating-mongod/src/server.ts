import { createServer, Socket } from 'node:net';
import { encodeMessage, processBuffer, type OpReplyPayload } from './wire-lib.js';

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = '27017';

const hardcodedOpReplyPayload: OpReplyPayload = {
  _type: 'OP_REPLY',
  responseFlags: 0,
  cursorID: 0n,
  startingFrom: 0,
  numberReturned: 1,
  documents: [
    {
      helloOk: true,
      ismaster: true,
      ok: 1,
      minWireVersion: 0,
      maxWireVersion: 21,
    },
  ],
};

async function handleNewConnection(sock: Socket) {
  const bufHolder = { buf: Buffer.alloc(0) };

  sock.on('data', data => {
    bufHolder.buf = Buffer.concat([bufHolder.buf, Buffer.from(data)]);
    const messages = processBuffer(bufHolder);
    messages.forEach(message => {
      console.dir(message.payload, { depth: null });

      if (message.header.opCode === 2004) {
        const responseBuf = encodeMessage({
          header: {
            requestID: 1,
            responseTo: message.header.requestID,
            opCode: 1,
            messageLength: 0, // will be set by encodeMessage()
          },
          payload: hardcodedOpReplyPayload,
        });

        sock.write(responseBuf);
      }
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
