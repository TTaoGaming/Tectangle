// Hive Fleet Obsidian — Hex Ports (TTao Edition)
// Purpose: keep the core portable; adapters implement I/O.

/**
 * BoardSnapshot
 * @typedef {Object} BoardSnapshot
 * @property {string} problem
 * @property {string} metric
 * @property {string} constraint
 * @property {string} horizons
 * @property {string} current
 */

/**
 * CouncilCard
 * @typedef {Object} CouncilCard
 * @property {string} what
 * @property {string} why
 * @property {string} win
 * @property {string} warnings
 * @property {string[]} how
 */

/**
 * FullTurnJSON
 * @typedef {Object} FullTurnJSON
 * @property {{ explore: CouncilCard, pivot: CouncilCard, reorient: CouncilCard, exploit: CouncilCard }} counsel
 * @property {string} guardrail
 * @property {{ snapshot:string, metric_delta:string, lesson:string }} history
 */

/**
 * Port: Board
 * Methods any adapter must provide to read/write the Board and history.
 */
export const BoardPort = {
  /** @returns {Promise<BoardSnapshot>} */
  readSnapshot: async () => { throw new Error('BoardPort.readSnapshot not implemented'); },
  /** @param {BoardSnapshot} snap */
  writeSnapshot: async (_snap) => { throw new Error('BoardPort.writeSnapshot not implemented'); },
  /** @param {{snapshot:string,metric_delta:string,lesson:string}} hist */
  appendHistory: async (_hist) => { throw new Error('BoardPort.appendHistory not implemented'); },
  /** @returns {Promise<string|null>} */
  lastHistoryLine: async () => { throw new Error('BoardPort.lastHistoryLine not implemented'); },
};

/**
 * Port: Orchestrator
 * A minimal scheduler for turns and tasks (single-process for now, distributable later).
 */
export const OrchestratorPort = {
  /** @param {BoardSnapshot} snap */
  runExplore: async (_snap) => { throw new Error('Orchestrator.runExplore not implemented'); },
  /** @param {BoardSnapshot} snap */
  runExploit: async (_snap) => { throw new Error('Orchestrator.runExploit not implemented'); },
};

/**
 * Port: Knowledge (Scribe)
 */
export const KnowledgePort = {
  /** @param {{snapshot:string,metric_delta:string,lesson:string}} hist */
  record: async (_hist) => { throw new Error('Knowledge.record not implemented'); },
};

// Note: Council, Champion, Spiderling remain chat/tooling-driven for now.

