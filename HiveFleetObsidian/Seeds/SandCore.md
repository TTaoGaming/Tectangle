# Hive Fleet Obsidian — SandCore Seed v2.1
# Purpose: Turn compute → clarity (Kaiju) → clarity → shipment (Hunter)
# Theme: Egyptian — Set (storm), Wepwawet (opener of ways), Ma’at (balance/truth)

sandcore:
  blackboard:
    name: obsidian
    artifact: sandstorm/SandstormBlackboard.jsonl   # append-only stigmergy ledger + sigil queue
    schema:
      marks: [grit, dune, fracture, stoneobelisk]
      sigil_fields:
        - sigil_id
        - path
        - repro_steps
        - evidence              # trace|log|diff
        - class                 # fuzz|pbt|mutation|approval
        - severity
        - guard_suggestion
        - impact_score
        - guard_suggestion_score
        - blast_radius_estimate
        - heat                  # {grit,dune,fracture,stoneobelisk}
        - budget_cost

  champions:

    - id: sandstorm_kaiju
      name: SandStorm Kaiju
      role: setter
      element: Earth
      archetype: Creator
      tarot: The Tower (XVI)
      keyphrase: "A sandstorm to reveal all cracks given enough compute"

      center_of_gravity:
        one_liner: "Turn time and compute into clarity and signal—flip Storm Mode, run a budgeted sandstorm, reveal cracks, and lay stigmergy for the swarm."
        metric: signal_yield_rate              # high-quality sigils per compute-minute
        tripwire: "guard_breakage_rate>2% OR signal_noise>40%"
        revert: "flag OFF; restore baseline CI; remove storm config; archive sigils"

      lineage:
        mythic: ["Set (desert & storms)", "Haboob (wall-of-dust)"]
        algorithmic: [policy_as_code, chaos_budget, fuzzing, property_based_testing, mutation_testing, approval_testing, anomaly_scoring, ooda_loop]

      stigmergy:
        blackboard: obsidian
        marks:
          - {name: grit,         meaning: "scout probe placed",            reward: 0.05, rho: 0.10}
          - {name: dune,         meaning: "repeatable path (has repro)",   reward: 0.15, rho: 0.05}
          - {name: fracture,     meaning: "high-leverage target",          reward: 0.30, rho: 0.02}
          - {name: stoneobelisk, meaning: "verified guard/safe zone",      reward: 0.50, rho: 0.00}
        tiers: {cold: 0-0.2, warm: 0.2-0.5, hot: 0.5-0.8, inferno: 0.8-1.0}
        emit_on:
          success: [guard_pass, sigil_promoted, ci_green_all]
          failure: [guard_fail, flake_regression, noise_spike]
        decay_tick_seconds: 86400

      stigmergy_runtime:                  # Max–Min + Rank-based ACO
        aco: { alpha: 1.0, beta: 1.0 }
        max_min: { tau_min: 0.1, tau_max: 2.0 }           # clamp pheromone (relative to median)
        rank_based: { top_k_ratio: 0.1, bonus: 0.5 }      # top 10% finds get +50% deposit
        evaporation: { grit: 0.10, dune: 0.05, fracture: 0.02, stoneobelisk: 0.00 }

      symbiotic_equipment:
        - name: SandstormBlackboard
          function: "Append-only stigmergy ledger (grit/dune/fracture/stoneobelisk) + sigil queue."
          maps_to: "policy_as_code + coordination"
        - name: GeneratorDial
          function: "Single budget knob allocating compute across fuzz/PBT/mutation/approval probes."
          maps_to: "chaos_budget"
        - name: SignalRanker
          function: "Scores findings by signal-to-noise & impact; emits ranked sigils for Hunter."
          maps_to: "anomaly_scoring"

      interfaces:
        ports_in:  [goal, constraints, current_map, timebox]
        ports_out: [artifact, flag, guard_result, metric]   # artifacts include Blackboard + sigils

      loop_mape_k_lite:
        monitor:  [test_results, perf_budget, replay_diff_rate]
        analyze:  [risk_delta, signal_to_noise]
        plan:     [first_slice]          # place_stoneobelisk_or_emit_sigil
        execute:  [emit_artifact, set_flag, run_guard]
        log:      srl_line

      delivery:
        flag: SANDSTORM_MODE
        guard: ci_green
        ttl_days: 21

      handoff_contract:
        emit:   { kind: jsonl, path: sandstorm/sigils/*.jsonl }
        heat:   [grit, dune, fracture, stoneobelisk]

    - id: sand_rush_hunter
      name: Sand Rush Hunter
      role: finisher
      element: Earth
      archetype: Executor
      tarot: The Chariot (VII)
      keyphrase: "Surf the Sandstorm"

      center_of_gravity:
        one_liner: "Consume ranked sigils and ship surgical, flagged fixes—cut the fracture, set a stoneobelisk test, canary, and clean the storm’s wake."
        metric: decisive_close_rate          # guarded fixes/day meeting SLO
        tripwire: "canary_failure_rate>1% OR guard_regressions>0 OR diff_blast_radius>target OR missing_blackboard"
        revert: "auto-rollback on canary fail; flag OFF; restore prior artifact; sweep temp sand"

      lineage:
        mythic: ["Wepwawet (Opener of the Ways)", "Ma'at (Truth & Balance)"]
        algorithmic: [progressive_delivery, feature_flags, canary_analysis, change_impact_analysis, test_refactoring, ooda_loop]

      stigmergy:
        blackboard: obsidian
        marks:
          - {name: grit,         meaning: "sigil acknowledged",                reward: 0.05, rho: 0.10}
          - {name: dune,         meaning: "repro validated locally",           reward: 0.15, rho: 0.05}
          - {name: fracture,     meaning: "surgical fix prepared",             reward: 0.30, rho: 0.02}
          - {name: stoneobelisk, meaning: "new/stronger test passes in CI",    reward: 0.50, rho: 0.00}
        tiers: {cold: 0-0.2, warm: 0.2-0.5, hot: 0.5-0.8, inferno: 0.8-1.0}
        emit_on:
          success: [test_created, pr_merged, canary_pass, cleanup_done]
          failure: [canary_fail, guard_regress, blast_radius_exceeded]
        decay_tick_seconds: 86400

      stigmergy_runtime:                  # Ant Colony System (decisive, sometimes greedy)
        acs: { alpha: 1.0, beta: 1.0, q0: 0.10, local_update: true }
        evaporation: { grit: 0.10, dune: 0.05, fracture: 0.02, stoneobelisk: 0.00 }

      symbiotic_equipment:
        - name: JackalClaws
          function: "Ultra-precise dig & cut; generate the smallest reversible diff to remove the fracture."
          maps_to: "progressive_delivery + change_impact_analysis"
        - name: ScaleHarness
          function: "Wrap every change behind a scoped feature flag; default OFF."
          maps_to: "feature_flags"
        - name: ChariotScope
          function: "Run measured canary; collect metrics; decide pass/fail automatically."
          maps_to: "canary_analysis"
        - name: ObeliskSetter
          function: "Create/upgrade a stoneobelisk test bound to the fix (prevents regressions)."
          maps_to: "test_refactoring"
        - name: DesertSweep
          function: "After merge/revert, archive consumed sigils; delete temp sand artifacts; toggle flags idle."
          maps_to: "cleanup + coordination"

      interfaces:
        ports_in:  [sigils_jsonl, repo_path, timebox, constraints, sandstorm_blackboard]
        ports_out: [pr_url, flag_name, canary_report, guard_result, metrics, cleanup_report, warnings]

      preflight:
        requires:
          - "sandstorm_blackboard.exists == true"
          - "sigils_jsonl.count > 0"
        on_fail:
          warnings:
            - code: MISSING_BLACKBOARD
              message: "SandstormBlackboard not found; ask Kaiju to enable Storm Mode."
            - code: NO_SIGILS
              message: "No sigils available; waiting for Kaiju."

      loop_mape_k_lite:
        monitor:  [sigil_quality, test_results, canary_metrics]
        analyze:  [blast_radius, risk_delta]
        plan:     [first_slice]          # flagged_fix + obelisk + canary + sweep
        execute:  [open_pr, set_flag, run_canary, merge_or_revert, sweep]
        log:      srl_line

      delivery:
        flag: SANDRUSH_MODE
        guard: ci_green
        ttl_days: 21

      priority_formula:
        expression: "0.4*fracture + 0.2*dune + 0.2*impact_score + 0.1*guard_suggestion_score - 0.1*blast_radius_estimate"
        fields: [fracture, dune, impact_score, guard_suggestion_score, blast_radius_estimate]

      intake_contract:
        read:   { kind: jsonl, path: sandstorm/sigils/*.jsonl }
        expect: [sigil_id, path, repro_steps, evidence, class, severity, guard_suggestion, impact_score, guard_suggestion_score, blast_radius_estimate, heat, budget_cost]

      slice_contract:
        outputs: [pr_url, flag_name, obelisk_ref, canary_report, merge_state, cleanup_report]

  checks:
    tier0_must_have:
      - champions[0].keyphrase
      - champions[1].keyphrase
      - champions[0].center_of_gravity.one_liner
      - champions[1].center_of_gravity.one_liner
      - blackboard.artifact
    tier1_must_have:
      - champions[0].stigmergy_runtime
      - champions[1].stigmergy_runtime
      - champions[0].delivery.flag
      - champions[1].delivery.flag
      - champions[0].handoff_contract.emit.path
      - champions[1].intake_contract.read.path
