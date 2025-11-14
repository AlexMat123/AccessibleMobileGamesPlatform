// backend/server.js
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';
import { sequelize } from './config/db.js';
import express from 'express';
import cors from 'cors';
// import sequelize from './config/db.js';
import './models/index.js';
import { seedGames } from './config/seedGames.js';
import gamesRouter from './routes/games.js';
import { createDatabaseIfNotExists } from './config/createDatabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });


const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/games', gamesRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('[Unhandled]', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
});

const PORT = Number(process.env.PORT) || 5000;

async function start() {
    try {
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        // Use a safe sync that creates tables if missing but does not alter existing schemas.
        // This avoids MariaDB driver issues during ALTER operations in dev.
        await sequelize.sync();

        // Populate only if empty

        // await sequelize.sync({ alter: true });
        await seedGames();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
        console.log('Database connected & synced');
    } catch (err) {
        console.error('Startup failed:', err);
        process.exit(1);
    }
}

start();
