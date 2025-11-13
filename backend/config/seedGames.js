import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, Tag } from '../models/index.js';
import sequelize from './db.js'; // default import to match `server.js`

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Clean sample data (include description)
const sample = [
    {
        title: 'Tetris',
        tags: ['Classic', 'Puzzle', 'Retro'],
        platform: 'NES',
        developer: 'Alexey Pajitnov',
        category: 'Puzzle',
        releaseDate: new Date('1984-06-06'),
        rating: 4.5,
        description: 'Stack falling tetrominoes to clear lines and chase high scores.',
        thumbImages: [
            '/tetris-1.jpg',
            '/tetris-2.avif',
            '/tetris-3.png'
        ]
    },
    {
        title: 'Game A',
        tags: ['Action', 'Adventure'],
        platform: 'PC',
        developer: 'Dev A',
        category: 'Action',
        releaseDate: new Date('2020-01-01'),
        rating: 4.5,
        description: 'An exciting action-adventure game.'
    },
    {
        title: 'Game B',
        tags: ['RPG'],
        platform: 'Console',
        developer: 'Dev B',
        category: 'RPG',
        releaseDate: new Date('2019-05-15'),
        rating: 4.0,
        description: 'A captivating role-playing game.'
    }
];

export async function seedGames({ reset = false } = {}) {
    await sequelize.transaction(async (t) => {
        if (reset) {
            await Game.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            await Tag.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            console.log('Reset complete');
        }

        for (const g of sample) {
            const [game, created] = await Game.findOrCreate({
                where: { title: g.title },
                defaults: {
                    platform: g.platform ?? null,
                    developer: g.developer ?? null,
                    category: g.category ?? null,
                    releaseDate: g.releaseDate ?? null,
                    rating: g.rating ?? null,
                    description: g.description ?? null,
                    thumbImages: g.thumbImages ?? []  // ensure default array
                },
                transaction: t
            });

            if (!created) {
                const patch = {};
                for (const k of ['platform','developer','category','releaseDate','rating','description','thumbImages']) {
                    const incoming = g[k];
                    if (incoming != null && JSON.stringify(game[k]) !== JSON.stringify(incoming)) {
                        patch[k] = incoming;
                    }
                }
                if (Object.keys(patch).length) {
                    await game.update(patch, { transaction: t });
                    console.log(`Updated ${game.title}: ${Object.keys(patch).join(', ')}`);
                }
            }

            // Ensure tags exist and are linked
            const tagRows = [];
            for (const tagName of g.tags) {
                const [tag] = await Tag.findOrCreate({
                    where: { name: tagName },
                    defaults: { name: tagName },
                    transaction: t
                });
                tagRows.push(tag);
            }

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
        await sequelize.sync({ alter: true });
        await seedGames({ reset: false });
        process.exit(0);
    })().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
