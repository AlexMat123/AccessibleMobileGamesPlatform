import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock the API module used by Search
vi.mock('../api', () => ({
  fetchTagGroups: vi.fn(async () => ({
    groups: [
      { id: 'accessibility-categories', label: 'Accessibility Categories', tags: ['Vision','Hearing','Motor','Speech','Cognitive'] },
      { id: 'vision', label: 'Vision Tags', tags: ['Colourblind Mode','High Contrast','Large Text','Screen Reader Friendly'] },
      { id: 'hearing', label: 'Hearing Tags', tags: ['No Audio Needed','Captions','Visual Alerts'] },
      { id: 'motor', label: 'Motor Tags', tags: ['One-Handed','Simple Controls','No Timed Inputs','No Precision Needed'] },
      { id: 'speech', label: 'Speech Tags', tags: ['No Voice Required'] },
      { id: 'cognitive', label: 'Cognitive Tags', tags: ['Simple UI','Clear Instructions','Tutorial Mode','Adjustable Difficulty'] },
      { id: 'general-ui', label: 'General UI/Gameplay', tags: ['Tap Only','Hints Available','Low Cognitive Load'] },
      { id: 'genres', label: 'Genres', tags: ['Action','Adventure','Puzzle'] }
    ]
  })),
  fetchGames: vi.fn(async () => ([
    { id: 1, title: 'Puzzle Grove', platform: 'Web', rating: 4.6, tags: ['Puzzle','Hints Available','Simple UI'] },
    { id: 2, title: 'Aurora Quest', platform: 'PC', rating: 4.8, tags: ['Adventure','RPG','High Contrast'] }
  ])),
  searchGames: vi.fn(async () => ([
    { id: 1, title: 'Puzzle Grove', platform: 'Web', rating: 4.6, tags: ['Puzzle','Hints Available','Simple UI'] }
  ]))
}));

import Search from './Search.jsx';

function renderSearch(initialEntries = ['/search']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Search />
    </MemoryRouter>
  );
}

describe('Search page (accessibility + basics)', () => {
  it('renders heading, filters drawer, search input, and genre dropdown', async () => {
    renderSearch();

    // h1 heading
    expect(await screen.findByRole('heading', { name: /search/i, level: 1 })).toBeInTheDocument();

    // Filters heading in drawer
    expect(screen.getByRole('heading', { name: /filters/i, level: 2 })).toBeInTheDocument();

    // Search input with placeholder
    expect(screen.getByRole('searchbox', { name: /search games/i })).toHaveAttribute('placeholder', expect.stringContaining('Search games'));

    // Genre select should exist and include at least All + Puzzle
    const genreLabel = screen.getByLabelText(/genre/i);
    expect(genreLabel.tagName.toLowerCase()).toBe('select');
    // open/select via user-event to keep it realistic
    await userEvent.selectOptions(genreLabel, 'Puzzle');
    const optionPuzzle = within(genreLabel).getByRole('option', { name: 'Puzzle' });
    expect(optionPuzzle.selected).toBe(true);
  });

  it('supports keyboard navigation for category accordion and tag toggles', async () => {
    renderSearch();

    // Find a category button — use name from mock
    const motorBtn = await screen.findByRole('button', { name: /^motor/i });
    // Focus it, then expand with keyboard
    motorBtn.focus();
    expect(motorBtn).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(motorBtn).toHaveAttribute('aria-expanded', 'true');

    // After expand, the tag buttons should be reachable
    const panel = await screen.findByRole('region', { name: /^motor/i });
    const tagBtn = within(panel).getByRole('button', { name: /one-handed/i });
    await userEvent.click(tagBtn);
    expect(tagBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
