import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// Mock the Sequelize models module that routes use
const mockFindAll = jest.fn();

jest.unstable_mockModule('../models/index.js', () => ({
  Game: { findAll: mockFindAll },
  Tag: {}
}));

const { default: libraryRoutes } = await import('../routes/library.js');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', libraryRoutes);
  return app;
}

describe('Games API (mocked DB)', () => {
  beforeEach(() => {
    mockFindAll.mockReset();
  });

  it('GET /api/games maps games and sorts tags', async () => {
    mockFindAll.mockResolvedValue([
      { id: 1, title: 'Alpha', platform: 'Web', releaseDate: null, rating: 3, tags: [{ name: 'Puzzle' }, { name: 'Action' }] },
      { id: 2, title: 'Beta', platform: 'Mobile', releaseDate: null, rating: 4, tags: [{ name: 'RPG' }] }
    ]);

    const app = makeApp();
    const res = await request(app).get('/api/games').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const first = res.body.find(x => x.id === 1);
    expect(first.tags).toEqual(['Action','Puzzle']); // sorted
  });

  it('GET /api/games/search without filters delegates to same mapping', async () => {
    mockFindAll.mockResolvedValue([
      { id: 3, title: 'Gamma', platform: 'PC', releaseDate: null, rating: 5, tags: [{ name: 'Strategy' }, { name: 'Adventure' }] }
    ]);

    const app = makeApp();
    const res = await request(app).get('/api/games/search').expect(200);

    expect(res.body).toEqual([
      { id: 3, title: 'Gamma', platform: 'PC', releaseDate: null, rating: 5, tags: ['Adventure','Strategy'] }
    ]);
    expect(mockFindAll).toHaveBeenCalled();
  });
});
