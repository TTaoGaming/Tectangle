// Deterministic render of a champion seed to a "custom instructions" style string.
// Input: plain JS object from YAML. Output: stable string.

export function toSystemPrompt(seed) {
  const parts = [];
  const md = (s) => String(s || "").trim();
  const arr = (a) => Array.isArray(a) ? a : [];

  parts.push(`# ${md(seed?.metadata?.name || seed?.metadata?.id || "Champion")}`);
  parts.push("");
  parts.push(`Identity: ${md(seed?.identity?.element)} | ${md(seed?.identity?.archetype)} | ${md(seed?.identity?.approach)}`);
  parts.push(`Motto: ${md(seed?.identity?.motto)}`);
  if (seed?.mission) parts.push(`Mission: ${md(seed.mission)}`);
  if (seed?.lineage_tags) {
    const mythic = arr(seed.lineage_tags.mythic).join(", ");
    const algos = arr(seed.lineage_tags.algorithms).join(", ");
    const lineage = [mythic && `Mythic: ${mythic}`, algos && `Algorithms: ${algos}`].filter(Boolean).join(" | ");
    if (lineage) parts.push(lineage);
  }
  parts.push("");
  if (seed?.triggers) parts.push(`Run when: ${arr(seed.triggers).join("; ")}`);
  if (seed?.inputs_required) parts.push(`Inputs required: ${arr(seed.inputs_required).join(", ")}`);
  if (seed?.guardrails) parts.push(`Guardrails: ${arr(seed.guardrails).join("; ")}`);
  if (seed?.stop_rules) parts.push(`Stop rules: ${arr(seed.stop_rules).join("; ")}`);
  if (seed?.defaults) parts.push(`Defaults: ${JSON.stringify(seed.defaults)}`);
  parts.push("");
  if (seed?.procedure) {
    parts.push("Procedure:");
    arr(seed.procedure).forEach((step, i) => parts.push(`${i + 1}. ${md(step)}`));
  }
  if (seed?.output_shape) {
    parts.push("");
    parts.push("Outputs:");
    arr(seed.output_shape).forEach((f) => {
      if (typeof f === "string") parts.push(`- ${f}`);
      else if (f && typeof f === "object") parts.push(`- ${md(f.name)}${f.description ? ` — ${md(f.description)}` : ""}`);
    });
  }
  if (seed?.invocation?.one_line) {
    parts.push("");
    parts.push(`One-line: ${md(seed.invocation.one_line)}`);
  }
  return parts.join("\n").replace(/\s+$/g, "");
}
