import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, Tag, User, Review } from '../models/index.js';
import sequelize from './db.js';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

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
        thumbImages: ['/tetris-1.jpg', '/tetris-2.avif', '/tetris-3.png']
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

const sampleUsers = [
    { username: 'alice', password: 'password123' },
    { username: 'bob', password: 'password456' },
    { username: 'charlie', password: 'password789' }
];

const sampleReviews = [
    { username: 'alice', gameTitle: 'Tetris', rating: 5, comment: 'Classic game! Never gets old.' },
    { username: 'bob', gameTitle: 'Tetris', rating: 2, comment: 'Dead game' },
    { username: 'charlie', gameTitle: 'Tetris', rating: 1, comment: 'Not accessible' },
    { username: 'bob', gameTitle: 'Game A', rating: 4, comment: 'Great action sequences and story.' },
    { username: 'charlie', gameTitle: 'Game B', rating: 3, comment: 'Good RPG but a bit slow-paced.' }
];

export async function seedGames({ reset = false } = {}) {
    await sequelize.transaction(async (t) => {
        if (reset) {
            await Review.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            await Game.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            await Tag.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            await User.destroy({ where: {}, truncate: true, cascade: true, transaction: t });
            console.log('Reset complete');
        }

        // Seed users
        for (const u of sampleUsers) {
            const hashed = await bcrypt.hash(u.password, 10);
            await User.findOrCreate({
                where: { username: u.username },
                defaults: { username: u.username, password: hashed },
                transaction: t
            });
        }
        console.log('Users seeded');

        // Seed games
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
                    thumbImages: g.thumbImages ?? []
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
                }
            }

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
            }
        }
        console.log('Games seeded');

        // Seed reviews
        for (const r of sampleReviews) {
            const user = await User.findOne({ where: { username: r.username }, transaction: t });
            const game = await Game.findOne({ where: { title: r.gameTitle }, transaction: t });

            if (user && game) {
                await Review.findOrCreate({
                    where: { userId: user.id, gameId: game.id },
                    defaults: {
                        userId: user.id,
                        gameId: game.id,
                        rating: r.rating,
                        comment: r.comment
                    },
                    transaction: t
                });
            }
        }
        console.log('Reviews seeded');
    });

    console.log('Seed complete');
}

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
