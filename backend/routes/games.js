import express from 'express';
import { Game, Tag } from '../models/index.js';

const router = express.Router();

const normalizePath = (p) => {
    if (p == null) return null;
    const s = String(p).trim();
    if (!s) return null;
    return s.startsWith('/') ? s : `/${s}`;
};

const serializeGame = (g) => {
    const tags = g.tags?.map((t) => ({ id: t.id, name: t.name })) || [];

    return {
        id: g.id,
        name: g.title,
        platform: g.platform,
        developer: g.developer,
        category: g.category,
        releaseDate: g.releaseDate,
        rating: g.rating,
        description: g.description,
        images: Array.isArray(g.thumbImages)
            ? g.thumbImages.map(normalizePath).filter(Boolean)
            : [],
        tags
    };
};

router.get('/', async (_req, res) => {
    try {
        const games = await Game.findAll({
            include: [{ model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] }]
        });
        res.json(games.map(serializeGame));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
        const game = await Game.findByPk(id, {
            include: [{ model: Tag, as: 'tags', through: { attributes: [] }, attributes: ['id', 'name'] }]
        });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        res.json(serializeGame(game));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id/images', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { images } = req.body;
        if (!Array.isArray(images)) return res.status(400).json({ error: 'images must be array' });
        const game = await Game.findByPk(id);
        if (!game) return res.status(404).json({ error: 'Game not found' });
        await game.update({ thumbImages: images });
        res.json(serializeGame(game));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;