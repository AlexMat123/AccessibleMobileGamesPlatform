import express from 'express';
import { Game, Tag } from '../models/index.js';
import TAG_GROUPS from '../models/tags.js';

const router = express.Router();

// GET /api/tag-groups — returns the canonical tag groups
router.get('/tag-groups', (req, res) => {
  res.json({ groups: TAG_GROUPS });
});

// GET /api/games — returns games with associated tag names
router.get('/games', async (req, res) => {
  try {
    const games = await Game.findAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['title', 'ASC']]
    });

    const payload = games.map((g) => ({
      id: g.id,
      title: g.title,
      platform: g.platform,
      releaseDate: g.releaseDate,
      rating: g.rating,
      tags: (g.tags || []).map((t) => t.name).sort()
    }));

    res.json(payload);
  } catch (err) {
    console.error('Failed to fetch games', err);
    res.status(500).json({ message: 'Unable to load games' });
  }
});

export default router;

