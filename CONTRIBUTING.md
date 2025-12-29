# Contributing to BrowserQuest

Thank you for your interest in contributing! This document provides guidelines.

## Development Setup

```bash
# Clone and install
git clone https://github.com/your-username/BrowserQuest.git
cd BrowserQuest
npm install

# Start development servers
npm run dev
```

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

**Key conventions:**
- Single quotes for strings
- 2-space indentation
- Semicolons required
- Max line width: 100 characters

## Testing

```bash
# Run all tests
npm run test

# Run specific workspace
npm run test --workspace @bq/server
```

All PRs should include tests for new functionality.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add player inventory system
fix: resolve WebSocket reconnection issue
docs: update README with Docker instructions
test: add unit tests for combat formulas
refactor: extract message serialization to utils
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run `npm run lint` and `npm run test`
5. Commit with a descriptive message
6. Push and open a PR

## Project Structure

```
apps/
  client/    # React game client
  server/    # Node.js server
packages/
  shared/    # Shared types and utilities
```

## Questions?

Open an issue or discussion on GitHub.
