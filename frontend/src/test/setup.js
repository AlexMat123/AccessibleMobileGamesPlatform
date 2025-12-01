import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Ensure React Testing Library cleans up between tests so DOM isn't duplicated.
afterEach(() => cleanup());
