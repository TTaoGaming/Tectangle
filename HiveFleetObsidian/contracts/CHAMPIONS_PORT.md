# Champions Port (HFO) - Evolution & Adaptation

## Purpose

Codify a contract for creating, rating, and evolving "champions" (agents/personae) over time with scribe feedback and multi-horizon planning.

## Data model (neutral)

- Champion: `{ id, displayName, origin: 'mythic'|'human'|'algorithm', archetypes: string[], elements: string[], keywords: string[], intent: { goals: string[], constraints: string[] }, policies?: {}, notes?: string }`
- Evidence: `{ ts, source: 'scribe'|'trace'|'sim'|'user', signal: 'success'|'failure'|'score', details }`
- Rating: `{ elo?: number, trueskill?: { mu, sigma }, btl?: { strength }, bandit?: { reward, ctx? } }`
- TimeHorizons: `{ immediate, short, mid, long }` where each is `{ objective, plan, metrics }`

## Contract

- Inputs: champions.json (seed), scribe feedback (events), goals/state, time horizon
- Outputs: updated ratings, selected champion per horizon, candidate proposals
- Success: selection improves metrics; diversity preserved (quality-diversity)

### Scheduling & Seats

- Patch cadence: default monthly (generate variants, optional apply)
- Seats: periodic selection of top-k champions for counsel (default k=4)
- Orchestrator: acts as facade; champions can be hidden unless inspected

## Feedback loop (HITL + online)

1) Observe: collect Evidence (scribe logs, traces)
2) Rate: ELO/TrueSkill/BTL or Dueling Bandits for pairwise choices
3) Select: contextual bandit for next champion(s) given goal/state
4) Evolve: propose variants via QD (MAP-Elites) / CMA-ES / PBT; archive elites
5) Distill: compress winners into reusable policies (knowledge distillation)

## Multi-horizon planning

- Immediate: heuristic/MAB
- Short: Model Predictive Control (MPC), receding-horizon
- Mid: Hierarchical RL / Options Framework / HTN
- Long: Roadmap + ADR alignment; periodic reevaluation

## Battle-tested algorithms (notes)

- Rating: ELO, TrueSkill, Bradley-Terry-Luce (BTL)
- Bandits: (Contextual) Multi-Armed Bandits, Dueling Bandits
- Evolution: CMA-ES, MAP-Elites (Quality-Diversity), Novelty Search, PBT
- Planning: MPC, HTN, Hierarchical RL (Options, FeUdal)
- Learning: RLHF/Preference Learning, Behavior Cloning, Distillation

## CLI

- Seed champions: `node HiveFleetObsidian/tools/champions_seed.mjs`

## Notes

- Keep archetypes human-interpretable (Jungian) while allowing algorithmic variants.
- Maintain provenance: origin and evidence trail.
