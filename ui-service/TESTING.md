# UI Service Testing Guide

This document describes the testing setup and practices for the PeerPrep UI Service.

## Testing Framework

The UI Service uses [Vitest](https://vitest.dev/) as its testing framework, which is fast, compatible with Vite/Next.js, and provides a Jest-compatible API.

## Dependencies

- **vitest**: Testing framework
- **@vitejs/plugin-react**: React support for Vitest
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js
- **happy-dom**: Alternative lightweight DOM implementation
- **@vitest/coverage-v8**: Code coverage reporting

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test File Structure

Test files should be co-located with the source files they test:
- Utility function tests: `lib/*.test.ts`
- Component tests: `components/**/*.test.tsx`
- Hook tests: `hooks/*.test.ts`

### Naming Convention
- Test files: `<filename>.test.ts` or `<filename>.test.tsx`
- Component tests use `.tsx` extension
- Utility/function tests use `.ts` extension

## Writing Tests

### Utility Function Tests

Example from `lib/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });
});
```

### Component Tests

Example from `components/ui/button.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles onClick event', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByRole('button').click();
    
    expect(clicked).toBe(true);
  });
});
```

### Testing Environment Variables

Example from `lib/config.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('respects custom environment variables', async () => {
    process.env.SESSION_SECRET = 'custom-secret';
    vi.resetModules();
    
    const { config } = await import('./config');
    expect(config.session.secret).toBe('custom-secret');
  });
});
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern

### 2. Component Testing
- Test component behaviour, not implementation details
- Use semantic queries (e.g., `getByRole`, `getByLabelText`) over test IDs
- Test user interactions and component state changes

### 3. Mocking
- Mock external dependencies (API calls, services)
- Use `vi.mock()` for module mocking
- Reset mocks between tests using `vi.resetAllMocks()`

### 4. Coverage
- Aim for high coverage of critical business logic
- Don't obsess over 100% coverage—focus on meaningful tests
- Coverage reports are generated in the `coverage/` directory

## Configuration Files

### vitest.config.ts
Main Vitest configuration:
- Sets up React plugin
- Configures jsdom environment for browser-like testing
- Defines path aliases (@/ → project root)
- Sets up coverage reporting

### vitest.setup.ts
Test setup file that runs before each test:
- Imports jest-dom matchers
- Configures automatic cleanup after each test

## Continuous Integration

Tests should be run in CI pipelines before merging code:
```bash
npm run lint      # Run linter
npm test          # Run all tests
npm run build     # Build the application
```

## Troubleshooting

### Module resolution issues
- Ensure path aliases in `vitest.config.ts` match `tsconfig.json`
- Use `vi.resetModules()` when testing modules that depend on environment variables

### React 19 compatibility
- This setup uses React 19 and Next.js 16, which require specific package versions
- Ensure `@testing-library/react` is compatible with React 19

### Coverage not generated
- Install `@vitest/coverage-v8`: `npm install --save-dev @vitest/coverage-v8`
- Coverage reports are excluded from git via `.gitignore`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
