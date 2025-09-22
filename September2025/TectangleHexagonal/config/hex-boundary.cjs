/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Confirm boundary assumptions and feature flag alignment
 - [ ] Log decisions in TODO_2025-09-16.md
*/

/**
 * Dependency-Cruiser rules to enforce hex boundaries (small, composable).
 * Lanes:
 *  - core:     pure domain, no DOM, no ports/ui/app
 *  - ports:    IO adapters (mediapipe, audio, midi), may depend on core only
 *  - ui:       view helpers (overlay/hud), may depend on core/ports
 *  - app:      composition layer; others must not import from app
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // core must stay pure
    {
      name: 'core-no-outbound',
      comment: 'core must not depend on ui, ports, adapters, or app',
      severity: 'error',
      from: { path: '^September2025/TectangleHexagonal/src/core' },
      to: { pathNot: '^September2025/TectangleHexagonal/src/core' }
    },
    // prevent importing app from anywhere else
    {
      name: 'no-import-app',
      comment: 'Only the entry points should sit in app; other layers must not import from app',
      severity: 'error',
      from: { pathNot: '^September2025/TectangleHexagonal/src/app' },
      to: { path: '^September2025/TectangleHexagonal/src/app' }
    },
    // ports should not depend on ui/app/adapters
    {
      name: 'ports-only-core',
      comment: 'ports may only depend on core (and same-folder utilities)',
      severity: 'error',
      from: { path: '^September2025/TectangleHexagonal/src/ports' },
      // Allow external modules (node_modules or http/https) but forbid reaching into ui/app/adapters
      to: { path: '^(September2025/TectangleHexagonal/src/(ui|app|adapters))' }
    },
    // core must not reach into ports
    {
      name: 'core-no-ports',
      comment: 'core cannot import ports',
      severity: 'error',
      from: { path: '^September2025/TectangleHexagonal/src/core' },
      to: { path: '^September2025/TectangleHexagonal/src/ports' }
    }
  ],
  options: {
    // Exclude only node_modules; previous pattern accidentally filtered all due to '/\.' matching paths with dots
    exclude: 'node_modules',
    doNotFollow: { path: 'node_modules' },
    reporterOptions: { dot: { collapsePattern: 'node_modules|September2025/TectangleHexagonal/src' } }
  }
};
