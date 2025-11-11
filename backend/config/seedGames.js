import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, sequelize } from './db.js';
import Game from '../models/Games.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
    await connectDB();
    try {
        // Ensure tables exist
        await sequelize.sync({ alter: true });
        await Game.destroy({ where: {} });

        const sampleGames = [
            { title: 'Game A', tags: 'Action,Adventure', platform: 'PC', releaseDate: new Date('2020-01-01'), rating: 4.5 },
            { title: 'Game B', tags: 'RPG', platform: 'Console', releaseDate: new Date('2019-05-15'), rating: 4.0 },
            { title: 'Game C', tags: 'Strategy', platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 },
            { title: 'Game D', tags: 'Puzzle', platform: 'PC', releaseDate: new Date('2018-11-30'), rating: 4.2 },
            { title: 'Game E', tags: 'Simulation', platform: 'Console', releaseDate: new Date('2022-03-10'), rating: 4.8 }
        ];

        await Game.bulkCreate(sampleGames);
        console.log(`Seeded ${sampleGames.length} games`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
})();