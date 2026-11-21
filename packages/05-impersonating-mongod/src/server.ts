import { createServer, Socket } from 'node:net';
import { encodeMessage, processBuffer, type WireMessage } from './wire-lib.js';

const LISTEN_HOST = '127.0.0.1';
const LISTEN_PORT = '27017';

async function handleNewConnection(sock: Socket) {
  const bufHolder = { buf: Buffer.alloc(0) };

  sock.on('data', data => {
    bufHolder.buf = Buffer.concat([bufHolder.buf, Buffer.from(data)]);
    const messages = processBuffer(bufHolder);
    messages.forEach(message => {
      console.dir(message.payload, { depth: null });
      const response = getResponse(message);
      const responseBuf = encodeMessage(response);
      sock.write(responseBuf);
    });
  })
}

function getResponse(message: WireMessage): WireMessage {
  switch (message.header.opCode) {
    case 2004: {
      return {
        header: {
          requestID: 1,
          responseTo: message.header.requestID,
          opCode: 1,
          messageLength: 0, // will be set by encodeMessage()
        },
        payload: {
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
        },
      };
    }

    default:
      return {
        header: {
          requestID: 1,
          responseTo: message.header.requestID,
          opCode: 2013,
          messageLength: 0,
        },
        payload: {
          _type: 'OP_MSG',
          flagBits: 0,
          sections: [
            {
              sectionKind: 0,
              document: {
                ok: 0,
                errmsg: "no such command: 'atlasVersion'",
                code: 59,
                codeName: 'CommandNotFound'
              }
            }
          ]
        }
      }
  }
}

const server = createServer(handleNewConnection);

server.listen({
  host: LISTEN_HOST,
  port: LISTEN_PORT,
}, () => {
  console.log('Custom mongodb server listening on', `${LISTEN_HOST}:${LISTEN_PORT}`);
});
