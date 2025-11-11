import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { sequelize } from './config/db.js';
import './models/index.js'; // Important: registers User and Game models
import authRoutes from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true }); // Creates/updates `users` and `games`
        console.log('Models synced');
        app.listen(PORT, () => console.log(`Server on port ${PORT}`));
    } catch (err) {
        console.error('Startup failed:', err);
        process.exit(1);
    }
}

start();