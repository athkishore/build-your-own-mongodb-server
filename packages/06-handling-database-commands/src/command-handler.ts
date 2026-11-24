import { OpMsgPayload, OpMsgPayloadSection, WireMessage } from "./wire-lib";

export function getResponse(message: WireMessage): WireMessage {
  const { header, payload: requestPayload } = message;
  const { opCode, requestID } = header;

  const responseHeader = {
    messageLength: 0, // will be set by the encoder
    requestID: 1, // TODO: Unhardcode - maintain state for each connection
    responseTo: requestID,
    opCode: opCode === 2004 ? 1 : 2013, // Handle only OP_QUERY and OP_MSG
  }

  switch (opCode) {
    case 2004: {
      return {
        header: responseHeader,
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

    case 2013: {
      const responsePayload = getOpMsgResponsePayload(requestPayload as OpMsgPayload);
      return {
        header: responseHeader,
        payload: responsePayload,
      };
    }

    default:
      return {
        header: responseHeader,
        payload: {
          _type: 'OP_MSG',
          flagBits: 0,
          sections: [
            {
              sectionKind: 0,
              document: {
                ok: 0,
                code: 17,
                codeName: 'ProtocolError'
              }
            }
          ]
        }
      }
  }
}

function getOpMsgResponsePayload(payload: OpMsgPayload): OpMsgPayload {
  const { sections } = payload;
  
  const commandBody = (sections[0] as Extract<OpMsgPayloadSection, { sectionKind: 0 }>).document;
  const command = Object.keys(commandBody)[0];

  switch (command) {
    case 'ping':
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: { ok: 1 },
          },
        ],
      };

    case 'hello':
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              ok: 1,
              minWireVersion: 0,
              maxWireVersion: 21,          
            }
          }
        ]
      }
    
    default:
      return {
        _type: 'OP_MSG',
        flagBits: 0,
        sections: [
          {
            sectionKind: 0,
            document: {
              ok: 0,
              code: 59,
              codeName: 'CommandNotFound',
            },
          },
        ],
      };
  }
}