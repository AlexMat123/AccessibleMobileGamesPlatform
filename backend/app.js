import express from 'express';
import cors from 'cors';
import libraryRoutes from './routes/library.js';

// Construct the Express app without starting the server.
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', libraryRoutes);

export default app;

