import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, Tag } from '../models/index.js';
import { sequelize } from './db.js';
import { ALL_TAGS } from '../models/tags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// Representative sample library to exercise filters thoroughly.
// Titles are unique so reseeding is idempotent.
const sample = [
    // Genres coverage
    { title: 'Aurora Quest', tags: ['Adventure', 'RPG', 'Vision', 'Colourblind Mode', 'High Contrast', 'Large Text', 'Screen Reader Friendly', 'Hearing', 'Captions', 'Visual Alerts', 'Cognitive', 'Clear Instructions', 'Adjustable Difficulty', 'Simple UI', 'Hints Available', 'Low Cognitive Load'], platform: 'PC & Console', releaseDate: new Date('2024-03-20'), rating: 4.8 },
    { title: 'Circuit Sprint', tags: ['Action', 'Sports', 'Motor', 'One-Handed', 'Simple Controls', 'No Timed Inputs', 'No Precision Needed', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'Mobile & Console', releaseDate: new Date('2023-11-05'), rating: 4.2 },
    { title: 'Puzzle Grove', tags: ['Puzzle', 'Casual', 'Cognitive', 'Simple UI', 'Clear Instructions', 'Tutorial Mode', 'Adjustable Difficulty', 'General UI/Gameplay', 'Hints Available', 'Low Cognitive Load'], platform: 'PC, Console & Mobile', releaseDate: new Date('2022-08-16'), rating: 4.6 },
    { title: 'Skybound Strategy', tags: ['Strategy', 'Simulation', 'Vision', 'Screen Reader Friendly', 'Hearing', 'Captions', 'No Audio Needed', 'Cognitive', 'Adjustable Difficulty', 'Motor', 'No Timed Inputs'], platform: 'PC', releaseDate: new Date('2021-02-10'), rating: 4.3 },
    { title: 'Cozy Harbor', tags: ['Simulation', 'Casual', 'Hearing', 'No Audio Needed', 'Captions', 'Visual Alerts', 'Cognitive', 'Tutorial Mode', 'Clear Instructions', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'Switch & PC', releaseDate: new Date('2020-06-25'), rating: 4.4 },
    { title: 'Grove Guardians', tags: ['Action', 'Platformer', 'Motor', 'Simple Controls', 'No Precision Needed', 'Cognitive', 'Adjustable Difficulty', 'Vision', 'High Contrast', 'Large Text'], platform: 'Console', releaseDate: new Date('2024-01-12'), rating: 4.1 },
    { title: 'Quiet Current', tags: ['Adventure', 'Casual', 'Speech', 'No Voice Required', 'Hearing', 'No Audio Needed', 'Visual Alerts', 'Cognitive', 'Simple UI', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'PC & Mobile', releaseDate: new Date('2021-09-08'), rating: 4.0 },
    { title: 'Trailblazer Kids', tags: ['Kids', 'Adventure', 'Puzzle', 'Vision', 'Large Text', 'Screen Reader Friendly', 'Cognitive', 'Clear Instructions', 'Tutorial Mode', 'General UI/Gameplay', 'Hints Available'], platform: 'Tablet & Web', releaseDate: new Date('2023-04-03'), rating: 4.7 },

    // Additional coverage to ensure every tag appears multiple times
    { title: 'Monochrome Run', tags: ['Action', 'Vision', 'Colourblind Mode', 'High Contrast', 'Motor', 'Simple Controls'], platform: 'PC', releaseDate: new Date('2022-10-01'), rating: 4.0 },
    { title: 'Echo City', tags: ['Adventure', 'Hearing', 'Captions', 'No Audio Needed', 'Visual Alerts', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'PC & Console', releaseDate: new Date('2021-12-11'), rating: 3.9 },
    { title: 'One-Handed Hero', tags: ['Action', 'Motor', 'One-Handed', 'No Precision Needed', 'No Timed Inputs'], platform: 'Mobile', releaseDate: new Date('2023-03-15'), rating: 4.1 },
    { title: 'Tutor Isles', tags: ['Puzzle', 'Cognitive', 'Tutorial Mode', 'Clear Instructions', 'Adjustable Difficulty', 'General UI/Gameplay', 'Hints Available'], platform: 'Web', releaseDate: new Date('2022-06-05'), rating: 4.5 },
    { title: 'High Contrast Tactics', tags: ['Strategy', 'Vision', 'High Contrast', 'Large Text', 'Screen Reader Friendly'], platform: 'PC', releaseDate: new Date('2020-09-18'), rating: 4.2 },
    { title: 'Tap Tap Trails', tags: ['Casual', 'General UI/Gameplay', 'Tap Only', 'Low Cognitive Load', 'Motor', 'Simple Controls'], platform: 'Mobile', releaseDate: new Date('2021-01-22'), rating: 3.8 },
    { title: 'Platform Peaks', tags: ['Platformer', 'Action', 'Cognitive', 'Adjustable Difficulty', 'General UI/Gameplay', 'Hints Available'], platform: 'Console', releaseDate: new Date('2022-04-10'), rating: 4.0 },
    { title: 'RPG Lanterns', tags: ['RPG', 'Vision', 'Large Text', 'Colourblind Mode', 'Cognitive', 'Simple UI'], platform: 'PC', releaseDate: new Date('2023-07-07'), rating: 4.3 },
    { title: 'Strategy Seeds', tags: ['Strategy', 'Simulation', 'Motor', 'No Timed Inputs', 'No Precision Needed'], platform: 'PC', releaseDate: new Date('2020-11-30'), rating: 3.9 },
    { title: 'Calm Puzzles', tags: ['Puzzle', 'Casual', 'Cognitive', 'Simple UI', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'Mobile', releaseDate: new Date('2024-02-02'), rating: 4.4 },
    { title: 'Captions Cup', tags: ['Sports', 'Hearing', 'Captions', 'Visual Alerts'], platform: 'Console', releaseDate: new Date('2021-05-21'), rating: 3.7 },
    { title: 'Speechless Shores', tags: ['Adventure', 'Speech', 'No Voice Required', 'Hearing', 'No Audio Needed'], platform: 'PC', releaseDate: new Date('2022-12-13'), rating: 4.1 },
    { title: 'Hint Harbor', tags: ['Simulation', 'General UI/Gameplay', 'Hints Available', 'Cognitive', 'Clear Instructions'], platform: 'PC & Web', releaseDate: new Date('2023-09-09'), rating: 4.0 },
    { title: 'Retro Runner', tags: ['Action', 'Platformer', 'Motor', 'Simple Controls', 'No Precision Needed'], platform: 'Console', releaseDate: new Date('2020-03-03'), rating: 3.6 },
    { title: 'Coach Kids', tags: ['Kids', 'Cognitive', 'Tutorial Mode', 'Clear Instructions', 'General UI/Gameplay', 'Tap Only'], platform: 'Tablet', releaseDate: new Date('2021-08-08'), rating: 4.6 },
    { title: 'Logic Lagoon', tags: ['Puzzle', 'Cognitive', 'Adjustable Difficulty', 'General UI/Gameplay', 'Low Cognitive Load'], platform: 'Web', releaseDate: new Date('2022-02-14'), rating: 4.2 }
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
