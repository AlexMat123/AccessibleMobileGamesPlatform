import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, sequelize } from './db.js';
import Game from '../models/Games.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Seed helper that assumes DB is already connected and synced.
// Set { reset: true } to truncate first.
export async function seedGames({ reset = false } = {}) {
    const before = await Game.count();
    if (before > 0 && !reset) {
        console.log(`Games already present: ${before}, skipping seed`);
        return;
    }

    await sequelize.transaction(async (t) => {
        if (reset) {
            await Game.destroy({ where: {}, truncate: true, transaction: t });
        }

        const sampleGames = [
            { title: 'Game A', tags: 'Action,Adventure', platform: 'PC', releaseDate: new Date('2020-01-01'), rating: 4.5 },
            { title: 'Game B', tags: 'RPG', platform: 'Console', releaseDate: new Date('2019-05-15'), rating: 4.0 },
            { title: 'Game C', tags: 'Strategy', platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 },
            { title: 'Game D', tags: 'Puzzle', platform: 'PC', releaseDate: new Date('2018-11-30'), rating: 4.2 },
            { title: 'Game E', tags: 'Simulation', platform: 'Console', releaseDate: new Date('2022-03-10'), rating: 4.8 }
        ];

        await Game.bulkCreate(sampleGames, { validate: true, transaction: t });
    });

    const after = await Game.count();
    console.log(`Seed complete. Games before: ${before}, after: ${after}`);
}

// Allow running as a standalone script: `node backend/config/seedGames.js`
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seedGames.js');
if (isDirectRun) {
    (async () => {
        try {
            await connectDB();
            await sequelize.sync({ alter: true });
            await seedGames({ reset: true });
            process.exit(0);
        } catch (err) {
            console.error('Seeding failed:', err);
            process.exit(1);
        }
    })();
}