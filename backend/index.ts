import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database';
const client = new MongoClient(mongoUri);

async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('enerspectrumSamples');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

async function watchMongoChanges(io: Server) {
  const clientMongo = await connectToMongo();
  const collection = clientMongo.collection('eGauge');
  
  let lastUpdate = new Date();

  setInterval(async () => {
    try {
      // Query for documents newer than last update
      const newDocs = await collection
        .find({ timestamp: { $gt: lastUpdate } })
        .toArray();

      if (newDocs.length > 0) {
        lastUpdate = new Date();
        io.emit('db_update', newDocs);
        console.log('Sent update to clients:', newDocs);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 30000); // Poll every 30 seconds

}

// Update your server initialization
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await watchMongoChanges(io);
});