import express from 'express';
import { Review, Game, User } from '../models/index.js';
import authenticateToken from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

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

// Get accessibility preferences for a user
router.get('/:id/accessibility-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
    if (req.user?.id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.accessibilityPreferences || { visual: false, motor: false, cognitive: false, hearing: false });
  } catch (e) {
    console.error('Load accessibility prefs error:', e);
    res.status(500).json({ message: 'Failed to load accessibility preferences' });
  }
});

// Patch accessibility preferences for a user
router.patch('/:id/accessibility-preferences', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
    if (req.user?.id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { visual, motor, cognitive, hearing } = req.body || {};
    user.accessibilityPreferences = {
      visual: !!visual,
      motor: !!motor,
      cognitive: !!cognitive,
      hearing: !!hearing
    };
    await user.save();
    res.json(user.accessibilityPreferences);
  } catch (e) {
    console.error('Update accessibility prefs error:', e);
    res.status(500).json({ message: 'Failed to update accessibility preferences' });
  }
});

// POST /api/users/:id/follow/:gameId
router.post('/:id/follow/:gameId', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const gameId = Number(req.params.gameId);
    if (Number.isNaN(userId) || Number.isNaN(gameId)) return res.status(400).json({ message: 'Invalid id(s)' });
    if (req.user?.id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(userId);
    const game = await Game.findByPk(gameId);
    if (!user || !game) return res.status(404).json({ message: 'User or game not found' });
    await user.addFollowedGame(game); // idempotent relationship add
    res.status(201).json({ message: 'Followed', gameId });
  } catch (e) {
    console.error('Follow game error:', e);
    res.status(500).json({ message: 'Failed to follow game' });
  }
});

// DELETE /api/users/:id/follow/:gameId
router.delete('/:id/follow/:gameId', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const gameId = Number(req.params.gameId);
    if (Number.isNaN(userId) || Number.isNaN(gameId)) return res.status(400).json({ message: 'Invalid id(s)' });
    if (req.user?.id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(userId);
    const game = await Game.findByPk(gameId);
    if (!user || !game) return res.status(404).json({ message: 'User or game not found' });
    await user.removeFollowedGame(game);
    res.json({ message: 'Unfollowed', gameId });
  } catch (e) {
    console.error('Unfollow game error:', e);
    res.status(500).json({ message: 'Failed to unfollow game' });
  }
});

// GET /api/users/:id/followed-games
router.get('/:id/followed-games', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) return res.status(400).json({ message: 'Invalid user id' });
    if (req.user?.id !== userId) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findByPk(userId, {
      include: [{ model: Game, as: 'followedGames', attributes: ['id', 'title', 'thumbImages'] }]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const games = (user.followedGames || []).map(g => ({
      id: g.id,
      title: g.title,
      images: Array.isArray(g.thumbImages) ? g.thumbImages : []
    }));
    res.json(games);
  } catch (e) {
    console.error('Load followed games error:', e);
    res.status(500).json({ message: 'Failed to load followed games' });
  }
});

// Update profile (username/email)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!req.user || req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const { username, email } = req.body || {};
    if (!username && !email) return res.status(400).json({ error: 'No fields to update' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (username) user.username = String(username).trim();
    if (email) user.email = String(email).trim();
    await user.save();
    return res.json({ id: user.id, username: user.username, email: user.email, createdAt: user.createdAt });
  } catch (e) {
    console.error('Update profile error', e);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.patch('/:id/password', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!req.user || req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(String(currentPassword), user.password);
    if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(String(newPassword), salt);
    user.password = hash;
    await user.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('Change password error', e);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
