import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, Tag } from '../models/index.js';
import { sequelize } from './db.js';
import { ALL_TAGS } from '../models/tags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const sample = [
    { title: 'Game A', tags: ['Action', 'Adventure'], platform: 'PC', releaseDate: new Date('2020-01-01'), rating: 4.5 },
    { title: 'Game B', tags: ['RPG'], platform: 'Console', releaseDate: new Date('2019-05-15'), rating: 4.0 },
    { title: 'Game C', tags: ['Strategy'], platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 },
    { title: 'Game D', tags: ['Strategy'], platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 },
    { title: 'Game E', tags: ['Strategy'], platform: 'Mobile', releaseDate: new Date('2021-07-20'), rating: 3.5 },
    // Add new games here; they will be appended safely
    { title: 'Game F', tags: ['Action'], platform: 'PC', releaseDate: new Date('2022-02-02'), rating: 4.2 }
];

export async function seedGames({ reset = false } = {}) {
    await sequelize.transaction(async (t) => {
        if (reset) {
            await Game.destroy({ where: {}, truncate: true, transaction: t });
            await Tag.destroy({ where: {}, truncate: true, transaction: t });
            console.log('Reset complete');
        }

        // Ensure all canonical tags exist (idempotent)
        for (const tagName of ALL_TAGS) {
            await Tag.findOrCreate({
                where: { name: tagName },
                defaults: { name: tagName },
                transaction: t
            });
        }

        for (const g of sample) {
            // Upsert game
            const [game] = await Game.findOrCreate({
                where: { title: g.title },
                defaults: {
                    platform: g.platform,
                    releaseDate: g.releaseDate,
                    rating: g.rating
                },
                transaction: t
            });
            // Keep fields updated on subsequent runs without recreating
            await game.update(
                {
                    platform: g.platform,
                    releaseDate: g.releaseDate,
                    rating: g.rating
                },
                { transaction: t }
            );

            // Upsert tags
            const tagRows = [];
            for (const tagName of g.tags) {
                // By now tags should exist, but keep this idempotent
                const [tag] = await Tag.findOrCreate({
                    where: { name: tagName },
                    defaults: { name: tagName },
                    transaction: t
                });
                tagRows.push(tag);
            }

            // Link missing tag associations
            const existing = new Set(
                (await game.getTags({ attributes: ['id'], transaction: t })).map(tr => tr.id)
            );
            const toAdd = tagRows.filter(tr => !existing.has(tr.id));
            if (toAdd.length) {
                await game.addTags(toAdd, { transaction: t });
                console.log(`Linked tags to ${game.title}: ${toAdd.map(t => t.name).join(', ')}`);
            }
        }
    });

    console.log('Seed append/upsert complete');
}

// Optional direct run
if (process.argv[1]?.endsWith('seedGames.js')) {
    (async () => {
        // Safe sync in dev scripts: avoid ALTER to prevent driver issues
        await sequelize.sync();
        await seedGames({ reset: false });
        process.exit(0);
    })().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
