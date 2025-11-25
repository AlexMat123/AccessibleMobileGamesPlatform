import express from 'express';
import { Review, Game } from '../models/index.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// getting recent reviews for the logged in user
router.get('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });

    if (req.user?.id !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const reviews = await Review.findAll({
      where: { userId },
      include: [
        { model: Game, as: 'game', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    // shaping data for the frontend
    const out = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      game: r.game ? { id: r.game.id, title: r.game.title } : null
    }));
    res.json(out);
  } catch (e) {
    console.error('Fetch user reviews error:', e);
    res.status(500).json({ message: 'Failed to fetch user reviews' });
  }
});

export default router;
