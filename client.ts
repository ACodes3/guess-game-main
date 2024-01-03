import net from 'net';
import os from 'os'; // Import the 'os' module to determine the platform

const client = new net.Socket();

const PORT = 3000;
const HOST = 'localhost';

// Check the platform to determine connection type
const isUnix = os.platform() === 'linux' || os.platform() === 'darwin';
const connectionType = isUnix ? 'unix' : 'tcp';

// Connect based on the determined connection type
if (connectionType === 'unix') {
  const UNIX_SOCKET_PATH = '/tmp/socket'; // Replace with your desired path
  client.connect(UNIX_SOCKET_PATH);
} else {
  client.connect(PORT, HOST);
}

function encodeMessage(message: string): Buffer {
  const messageBuffer = Buffer.from(message, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(messageBuffer.length, 0);
  return Buffer.concat([lengthBuffer, messageBuffer]);
}

function decodeMessage(data: Buffer): string {
  return data.slice(4).toString('utf8').trim();
}

// Handling data from the server
client.on('data', (data) => {
 // const message = data.toString('utf8');
  const message = decodeMessage(data);
  console.log(`Received from server: ${message}`);
});

// Handling user input
process.stdin.on('data', (data) => {
  const userInput = data.toString().trim();
  const messageBuffer = encodeMessage(userInput);
  client.write(messageBuffer);
});

// Handling server disconnect
client.on('close', () => {
  console.log('Connection closed');
});
