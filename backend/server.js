import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { sequelize } from './config/db.js';
import './models/index.js';
import './models/User.js';
import './models/Games.js';
import { seedGames } from './config/seedGames.js';
import { createDatabaseIfNotExists } from './config/createDatabase.js';
import libraryRoutes from './routes/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());
// Public API routes
app.use('/api', libraryRoutes);

const PORT = Number(process.env.PORT) || 5000;

async function start() {
    try {
        // Ensure the database exists before connecting
        await createDatabaseIfNotExists();

        await sequelize.authenticate();
        // Use a safe sync that creates tables if missing but does not alter existing schemas.
        // This avoids MariaDB driver issues during ALTER operations in dev.
        await sequelize.sync();

        // Populate only if empty
        await seedGames();

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
        console.log('Database connected & synced');
    } catch (err) {
        console.error('Startup failed:', err);
        process.exit(1);
    }
}

start();
