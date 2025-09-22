# ADR | 2025-09-21T05:26:45Z | ww-2025-097

Context: v2 demo needed a visible bottom app bar with buttons opening panels; tests must verify presence and behavior headfully.
Decision: Mount shell by default on v2 page; add data-testid hooks; use WinBox with CDN fallback; add jest-puppeteer smoke to click Settings and assert window opens.
Consequences: UI is verifiable in CI; slight dependency on CDN when node_modules not present; easy revert by removing shell init and test.
Links: [Webway note](../../../../scaffolds/webway_shell_os_bottom_bar.md)
