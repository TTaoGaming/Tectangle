// Deterministic mapping from champion seed to a CrewAI-like role config.

export function toCrewAI(seed) {
  const s = seed || {};
  const id = s?.metadata?.id || "champion";
  const name = s?.metadata?.name || id;
  const goal = s?.mission || "";

  return {
    role: name,
    profile: {
      id,
      element: s?.identity?.element || "",
      archetype: s?.identity?.archetype || "",
      approach: s?.identity?.approach || "",
      motto: s?.identity?.motto || ""
    },
    goal,
    guardrails: Array.isArray(s?.guardrails) ? s.guardrails.slice() : [],
    stop_rules: Array.isArray(s?.stop_rules) ? s.stop_rules.slice() : [],
    inputs_required: Array.isArray(s?.inputs_required) ? s.inputs_required.slice() : [],
    output_shape: Array.isArray(s?.output_shape) ? s.output_shape.slice() : [],
    procedure: Array.isArray(s?.procedure) ? s.procedure.slice() : [],
    invocation: s?.invocation?.one_line || "",
    defaults: s?.defaults || {},
    lineage: s?.lineage_tags || {},
    version: s?.version || "",
  };
}
