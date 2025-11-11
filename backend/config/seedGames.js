import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, sequelize } from './db.js';
import { Game, Tag } from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

export async function seedGames({ reset = false } = {}) {
    const gameCount = await Game.count();
    if (gameCount > 0 && !reset) {
        console.log(`Games present: ${gameCount}, skipping seed`);
        return;
    }

    const sample = [
        { title: 'Game A', tags: ['Action', 'Adventure'], platform: 'PC', releaseDate: new Date('2020-01-01'), rating: 4.5 },
        { title: 'Game B', tags: ['RPG'], platform: 'Console', releaseDate: new Date('2019-05-15'), rating: 4.0 },
        { title: 'Game C', tags: ['Strategy'], platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 }
    ];

    await sequelize.transaction(async (t) => {
        if (reset) {
            await Game.destroy({ where: {}, truncate: true, transaction: t });
            await Tag.destroy({ where: {}, truncate: true, transaction: t });
        }

        // Insert unique tags
        const tagNames = [...new Set(sample.flatMap(g => g.tags))];
        await Tag.bulkCreate(tagNames.map(name => ({ name })), { ignoreDuplicates: true, transaction: t });

        // Create games and link tags
        for (const g of sample) {
            const game = await Game.create(
                { title: g.title, platform: g.platform, releaseDate: g.releaseDate, rating: g.rating },
                { transaction: t }
            );
            const tagRows = await Tag.findAll({ where: { name: g.tags }, transaction: t });
            await game.addTags(tagRows, { transaction: t });
        }
    });

    console.log('Seed complete');
}

// Direct run
const isDirectRun = process.argv[1]?.endsWith('seedGames.js');
if (isDirectRun) {
    (async () => {
        try {
            await connectDB();
            await sequelize.sync({ alter: true }); // creates games, tags, game_tags
            await seedGames({ reset: true });
            process.exit(0);
        } catch (e) {
            console.error('Seeding failed:', e);
            process.exit(1);
        }
    })();
}