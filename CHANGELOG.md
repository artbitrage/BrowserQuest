# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-29

### Added
- Modern monorepo structure with npm workspaces
- React 19 + Vite 6 client with Canvas 2D rendering
- Node.js 22 WebSocket server with TypeScript
- Shared types package (`@bq/shared`)
- TailwindCSS 4 styling with glassmorphism effects
- HUD components (HealthBar, Chat, Inventory)
- WASD/Arrow key movement with collision detection
- WebSocket message protocol
- Docker multi-stage builds
- docker-compose orchestration
- GitHub Actions CI pipeline
- Comprehensive test suite (11 tests)

### Changed
- Replaced legacy JavaScript with TypeScript
- Upgraded from `websocket-server` to `ws`
- Replaced `memcache` with `ioredis`

### Removed
- Legacy client code (moved to `legacy/` for reference)
