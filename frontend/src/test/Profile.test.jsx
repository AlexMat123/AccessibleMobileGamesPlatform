import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './pages/Profile.jsx';
import * as api from '../api.js';

vi.mock('../api', () => ({
  fetchCurrentUser: vi.fn(),
  fetchUserReviews: vi.fn(),
  getAccessibilityPreferences: vi.fn(),
  updateAccessibilityPreferences: vi.fn(),
  getFollowedGames: vi.fn(),
  updateUserProfile: vi.fn(),
  changeUserPassword: vi.fn(),
}));

vi.mock('../components/ToastHost.jsx', () => ({
  pushToast: vi.fn(),
}));

describe('Profile page', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderProfile = () =>
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

  it('renders loading state initially', () => {
    api.fetchCurrentUser.mockImplementation(() => new Promise(() => {}));
    renderProfile();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches and displays user profile', async () => {
    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce([]);
    api.getAccessibilityPreferences.mockResolvedValueOnce({
      visual: false,
      motor: false,
      cognitive: false,
      hearing: false,
    });
    api.getFollowedGames.mockResolvedValueOnce([]);

    renderProfile();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'testuser' })).toBeInTheDocument();
    });
  });

  it('handles fetch user error', async () => {
    api.fetchCurrentUser.mockRejectedValueOnce(new Error('Failed to load profile'));

    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
    });
  });

  it('fetches user reviews', async () => {
    const mockReviews = [
      { id: 1, game_id: 1, rating: 5, comment: 'Great game!' },
    ];

    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce(mockReviews);
    api.getAccessibilityPreferences.mockResolvedValueOnce({});
    api.getFollowedGames.mockResolvedValueOnce([]);

    renderProfile();

    await waitFor(() => {
      expect(api.fetchUserReviews).toHaveBeenCalledWith(1);
    });
  });

  it('handles fetch reviews error gracefully', async () => {
    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockRejectedValueOnce(new Error('Failed to load reviews'));
    api.getAccessibilityPreferences.mockResolvedValueOnce({});
    api.getFollowedGames.mockResolvedValueOnce([]);

    renderProfile();

    await waitFor(() => {
      expect(api.fetchUserReviews).toHaveBeenCalled();
    });
  });

  it('fetches accessibility preferences', async () => {
    const mockPrefs = {
      visual: true,
      motor: false,
      cognitive: true,
      hearing: false,
    };

    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce([]);
    api.getAccessibilityPreferences.mockResolvedValueOnce(mockPrefs);
    api.getFollowedGames.mockResolvedValueOnce([]);

    renderProfile();

    await waitFor(() => {
      expect(api.getAccessibilityPreferences).toHaveBeenCalledWith(1);
    });
  });

  it('handles fetch accessibility preferences error', async () => {
    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce([]);
    api.getAccessibilityPreferences.mockRejectedValueOnce(
      new Error('Failed to load accessibility preferences')
    );
    api.getFollowedGames.mockResolvedValueOnce([]);

    renderProfile();

    await waitFor(() => {
      expect(api.getAccessibilityPreferences).toHaveBeenCalled();
    });
  });

  it('fetches followed games', async () => {
    const mockGames = [
      { id: 1, title: 'Game 1' },
      { id: 2, title: 'Game 2' },
    ];

    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce([]);
    api.getAccessibilityPreferences.mockResolvedValueOnce({});
    api.getFollowedGames.mockResolvedValueOnce(mockGames);

    renderProfile();

    await waitFor(() => {
      expect(api.getFollowedGames).toHaveBeenCalledWith(1);
    });
  });

  it('handles fetch followed games error gracefully', async () => {
    api.fetchCurrentUser.mockResolvedValueOnce(mockUser);
    api.fetchUserReviews.mockResolvedValueOnce([]);
    api.getAccessibilityPreferences.mockResolvedValueOnce({});
    api.getFollowedGames.mockRejectedValueOnce(new Error('Failed'));

    renderProfile();

    await waitFor(() => {
      expect(api.getFollowedGames).toHaveBeenCalled();
      // Should not crash - error is ignored
    });
  });
});

