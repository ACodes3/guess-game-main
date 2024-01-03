// server.ts
import net from 'net';

interface Client {
  id: number;
  socket: net.Socket;
  wordToGuess: string;
  attempts: number;
}

const server = net.createServer();
const clients: Client[] = [];
// Unix socket path
//const unixSocketPath = '/tmp/guess_a_word.sock';

server.on('connection', (socket) => {
  console.log('Client connected');

  const initialMessage = Buffer.from('Welcome to Guess a Word! Please enter your password:');
  socket.write(encodeMessage(initialMessage));

  let clientId: number | null = null;

  // Helper function to send messages to a specific client
  function sendMessageToClient(clientId: number, message: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client && client.socket.writable) {
      client.socket.write(encodeMessage(Buffer.from(message)));
    }
  }

  function encodeMessage(message: Buffer): Buffer {
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(message.length, 0);
    return Buffer.concat([lengthBuffer, message]);
  }

  function decodeMessage(data: Buffer): string {
    return data.slice(4).toString('utf8').trim();
  }

  socket.on('data', (data) => {
    const message = decodeMessage(data);
    console.log(`Received from client ${clientId}: ${message}`);

    if (clientId === null) {
      if (message.trim() === 'password123') {
        clientId = Math.floor(Math.random() * 1000) + 1;
        clients.push({ id: clientId, socket, wordToGuess: '', attempts: 0 });
        socket.write(encodeMessage(Buffer.from(`Welcome! Your client ID is ${clientId}`)));
      } else {
        socket.end(encodeMessage(Buffer.from('Wrong password. Disconnecting.')));
      }
    } else {
      if (message === 'getOpponentsList') {
        const opponentsList = clients
          .filter((c) => c.id !== clientId && c.wordToGuess === '')
          .map((c) => c.id);
        socket.write(encodeMessage(Buffer.from(`Opponents available: ${opponentsList.join(', ')}`)));
      } else if (message.startsWith('requestMatch')) {
        const [, opponentId, wordToGuess] = message.split(' ');
        const requestingClient = clients.find((c) => c.id === clientId && c.wordToGuess === '');
        const opponent = clients.find((c) => c.id === parseInt(opponentId) );
      
        if (requestingClient && opponent) {
          // Set the word to guess for the opponent (client B)
          requestingClient.wordToGuess = wordToGuess;
      
          // Send match request and instructions to both clients
          opponent.socket.write(encodeMessage(Buffer.from(`You have a match request from Client ${clientId}. Type 'confirmMatch ${clientId}' to accept.`)));
          socket.write(encodeMessage(Buffer.from(`Match request sent to Client ${opponentId}. You set the word: ${wordToGuess}`)));
        } else {
          if (requestingClient) {
            if (opponent) {
              socket.write(encodeMessage(Buffer.from(`Client ${opponentId} is not available for a match.`)));
            } else {
              socket.write(encodeMessage(Buffer.from(`Invalid or wrong opponent ID: ${opponentId}.`)));
            }
          } else {
            socket.write(encodeMessage(Buffer.from('Invalid client ID.')));
          }
        }
      } else if (message.startsWith('confirmMatch')) {
        const [, opponentId] = message.split(' ');
        const opponent = clients.find((c) => c.id === parseInt(opponentId));
  
        if (opponent) {
          // Mark the clients as in a match
          socket.write(encodeMessage(Buffer.from(`Match confirmed with ${opponentId}. You can now start guessing.`)));
          opponent.socket.write(encodeMessage(Buffer.from(`Match confirmed with Client ${clientId}.`)));
  
          // Set the word to guess for both clients
          const requestingClient = clients.find((c) => c.id === clientId);
          if (requestingClient) {
            const [, , wordToGuess] = message.split(' ');
            requestingClient.wordToGuess = wordToGuess;
          }
        } else {
          socket.write(encodeMessage(Buffer.from(`Invalid or wrong opponent ID or opponent is not available for a match: ${opponentId}.`)));
        }
      
      } else if (message.startsWith('guess')) {
        const [, guessedWord] = message.split(' ');
        const requestingClient = clients.find((c) => c.id === clientId);
    
        if (requestingClient) {
            const opponent = clients.find((c) => c.id !== clientId && c.wordToGuess !== '');
    
            if (opponent) {
                requestingClient.attempts++;
    
                if (guessedWord.toLowerCase() === opponent.wordToGuess.toLowerCase()) {
                    // Guessed correctly
                    socket.write(encodeMessage(Buffer.from(`Congratulations! You guessed the word correctly in ${requestingClient.attempts} attempts. Game over and you won!.`)));
                    opponent.socket.write(encodeMessage(Buffer.from(`Your opponent (Client ${clientId}) guessed the word correctly in ${requestingClient.attempts} attempts. Game over.`)));
    
                    // Reset the game state for both clients
                    requestingClient.wordToGuess = '';
                    opponent.wordToGuess = '';
                    requestingClient.attempts = 0;
                } else {
                    // Incorrect guess
                    socket.write(encodeMessage(Buffer.from(`Incorrect guess. Try again.`)));
                    // Notify the requesting client about opponent's guess in its terminal
                    opponent.socket.write(encodeMessage(Buffer.from(`Your opponent guessed: ${guessedWord}`)));
                }
            } else {
                socket.write(encodeMessage(Buffer.from('No opponent found or opponent has not set a word to guess.')));
            }
        } else {
            socket.write(encodeMessage(Buffer.from('Invalid client ID.')));
        }

      } else if (message.startsWith('giveUp')) {
        // The logic for handling give up
        const requestingClient = clients.find((c) => c.id === clientId);
        const opponent = clients.find((c) => c.id !== clientId && c.wordToGuess !== '');
  
        if (requestingClient && opponent) {
          socket.write(encodeMessage(Buffer.from(`You gave up. The correct word was ${opponent.wordToGuess}. Game over.`)));
          opponent.socket.write(encodeMessage(Buffer.from(`Your opponent (Client ${clientId}) gave up. Game over.`)));
          // Reseting the game state for both clients
          requestingClient.wordToGuess = '';
          opponent.wordToGuess = '';
        } else {
          socket.write(encodeMessage(Buffer.from('Invalid client ID or opponent not found.')));
        }
      } else if (message.startsWith('hint')) {
        const [, opponentId, ...hintWords] = message.split(' ');
        const requestingClient = clients.find((c) => c.id === clientId);
        const opponent = clients.find((c) => c.id === parseInt(opponentId));
    
        if (requestingClient && opponent) {
          const hint = hintWords.join(' '); // Join the hint words into a sentence
          requestingClient.socket.write(encodeMessage(Buffer.from(`Hint request sent to Client ${opponentId}. Waiting for a response...`)));
          opponent.socket.write(encodeMessage(Buffer.from(`Hint request from your opponent (Client ${clientId}): ${hint}. Type 'giveHint ${clientId} <your_hint>' to respond.`)));
        } else {
          socket.write(encodeMessage(Buffer.from('Hint could not be sent.')));
        }

      } else if (message.startsWith('giveHint')) {
        const [, requestingClientId, ...hintResponseWords] = message.split(' ');
        const requestingClient = clients.find((c) => c.id === parseInt(requestingClientId));
    
        if (requestingClient) {
          const hintResponse = hintResponseWords.join(' '); // Join the hint response words into a sentence
          const opponent = clients.find((c) => c.id === requestingClient.id);
          if (opponent) {
            opponent.socket.write(encodeMessage(Buffer.from(`Hint response from Client ${requestingClientId}: ${hintResponse}`)));
            socket.write(encodeMessage(Buffer.from(`Hint response sent to Client ${requestingClientId}`)));
          } else {
            socket.write(encodeMessage(Buffer.from(`Invalid or wrong opponent ID or opponent is not available for a hint response: ${clientId}.`)));
          }
        } else {
          socket.write(encodeMessage(Buffer.from('Invalid or wrong client ID.')));
        }

      } else {
        socket.write(encodeMessage(Buffer.from('Unknown request. Please check your request.')));
      }
    }
  });

  socket.on('end', () => {
    console.log('Client disconnected');
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

const PORT = 3000;
// Listen on both Unix socket and TCP port
//server.listen(unixSocketPath);
server.listen(PORT);
console.log(`Server listening on Unix socket: ${"unixSocketPath"} and TCP port: ${PORT}`);
