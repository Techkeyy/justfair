// JustFair Minimum Scenario Core (Phase 1)
// One plain schema + one small runner. No framework.
//
// JustFair owns: scenario, invariant, PASS/FAIL, diagnosis, replay,
// remediation. The target owns only its observable behavior.

import { fetchManifest, evaluateTarget, ADAPTER_TIMEOUT_MS } from "./adapter.js";

export const SCENARIO_RESULT = {
  PASS: "PASS",
  FAIL: "FAIL",
  UNABLE_TO_VERIFY: "UNABLE_TO_VERIFY"
};

/**
 * Validate a scenario definition. Returns { ok, error? }.
 */
export function validateScenario(def) {
  if (!def || typeof def !== "object") return { ok: false, error: "Scenario must be an object" };
  for (const field of ["id", "title", "category", "version"]) {
    if (typeof def[field] !== "string" || def[field].trim().length === 0) {
      return { ok: false, error: `Scenario '${field}' must be a non-empty string` };
    }
  }
  if (!Array.isArray(def.requiresCapabilities)) {
    return { ok: false, error: "Scenario 'requiresCapabilities' must be an array" };
  }
  if (!def.inputs || typeof def.inputs !== "object") {
    return { ok: false, error: "Scenario 'inputs' must be an object" };
  }
  if (!def.evidence || typeof def.evidence !== "object" || typeof def.evidence.classification !== "string") {
    return { ok: false, error: "Scenario 'evidence' must carry a classification" };
  }
  const allowedEvidence = ["live", "historical", "simulated"];
  if (!allowedEvidence.includes(def.evidence.classification)) {
    return { ok: false, error: `Evidence classification must be one of ${allowedEvidence.join(", ")}` };
  }
  if (!Array.isArray(def.assertions) || def.assertions.length === 0) {
    return { ok: false, error: "Scenario 'assertions' must be a non-empty array" };
  }
  for (const a of def.assertions) {
    if (!a || typeof a.id !== "string" || typeof a.check !== "function") {
      return { ok: false, error: "Each assertion needs a string 'id' and a 'check' function" };
    }
  }
  return { ok: true };
}

function toUnable(reason, code, replayBase) {
  return {
    status: SCENARIO_RESULT.UNABLE_TO_VERIFY,
    reason,
    reasonCode: code,
    assertions: [],
    diagnosis: null,
    replay: [...replayBase, { at: "T+run", label: "Run inconclusive", expected: "decisive evidence", observed: reason }]
  };
}

/**
 * Run one scenario against one adapter base URL.
 * Returns a complete result object (never throws on target problems).
 */
export async function runScenario(def, baseUrl, { timeoutMs = ADAPTER_TIMEOUT_MS, allowLocal = false } = {}) {
  const replayBase = [
    { at: "T0", label: "Scenario issued", expected: def?.id || "unknown scenario", observed: "inputs prepared" }
  ];
  const valid = validateScenario(def);
  if (!valid.ok) {
    const err = new Error(`Invalid scenario: ${valid.error}`);
    err.code = "SCENARIO_INVALID";
    throw err;
  }

  // 1. Manifest: identity + capability gate.
  let manifest;
  try {
    manifest = await fetchManifest(baseUrl, { timeoutMs, allowLocal });
  } catch (err) {
    const code = err.code === "ADAPTER_URL_BLOCKED" ? "ADAPTER_URL_BLOCKED"
      : err.code === "ADAPTER_MANIFEST_INVALID" ? "ADAPTER_MANIFEST_INVALID"
      : err.name === "TimeoutError" || err.name === "AbortError" ? "ADAPTER_TIMEOUT"
      : "ADAPTER_UNAVAILABLE";
    return toUnable(`Manifest step failed: ${err.message}`, code, replayBase);
  }
  const missing = def.requiresCapabilities.filter(c => !manifest.capabilities.includes(c));
  if (missing.length > 0) {
    return toUnable(`Target lacks required capabilities: ${missing.join(", ")}`, "ADAPTER_CAPABILITY_MISSING", replayBase);
  }

  // 2. Evaluate: collect observations (judged below, never trusted).
  let observations;
  try {
    observations = await evaluateTarget(
      baseUrl,
      { scenarioId: def.id, scenarioVersion: def.version, inputs: def.inputs },
      { timeoutMs, allowLocal }
    );
  } catch (err) {
    const code = err.code === "ADAPTER_RESPONSE_TOO_LARGE" ? "ADAPTER_RESPONSE_TOO_LARGE"
      : err.code === "ADAPTER_MALFORMED_RESPONSE" ? "ADAPTER_MALFORMED_RESPONSE"
      : err.code === "ADAPTER_HTTP_ERROR" ? "ADAPTER_HTTP_ERROR"
      : err.name === "TimeoutError" || err.name === "AbortError" ? "ADAPTER_TIMEOUT"
      : "ADAPTER_UNAVAILABLE";
    return toUnable(`Evaluate step failed: ${err.message}`, code, replayBase);
  }

  // 3. Judge: deterministic assertions over observations + evidence.
  const context = { inputs: def.inputs, evidence: def.evidence, observations, manifest };
  const assertionResults = [];
  for (const a of def.assertions) {
    let passed = false;
    let actual = null;
    let error = null;
    try {
      const r = a.check(context);
      passed = r.passed === true;
      actual = r.actual ?? null;
    } catch (e) {
      error = e.message;
    }
    assertionResults.push({ id: a.id, expected: a.expected, actual, passed, error });
  }
  const failed = assertionResults.filter(a => !a.passed);

  const replay = [
    ...replayBase,
    { at: "T+manifest", label: "Target manifest accepted", expected: def.requiresCapabilities.join(", ") || "no capabilities", observed: manifest.capabilities.join(", ") },
    { at: "T+evaluate", label: "Target observations collected", expected: "observable behavior only", observed: "received" },
    ...assertionResults.map((a, i) => ({
      at: `T+assert${i + 1}`,
      label: `Invariant ${a.id}`,
      expected: a.expected,
      observed: a.error ? `check error: ${a.error}` : JSON.stringify(a.actual)
    }))
  ];

  if (failed.length === 0) {
    return {
      status: SCENARIO_RESULT.PASS,
      target: manifest.name,
      assertions: assertionResults,
      diagnosis: null,
      replay: [...replay, { at: "T+verdict", label: "Invariant satisfied", expected: "all assertions hold", observed: "PASS" }]
    };
  }

  const first = failed[0];
  const failure = typeof def.diagnose === "function"
    ? def.diagnose(first, context)
    : { failureCode: "ASSERTION_FAILED", rootCause: "An invariant did not hold.", guidance: "Inspect the failed assertion." };
  return {
    status: SCENARIO_RESULT.FAIL,
    target: manifest.name,
    assertions: assertionResults,
    diagnosis: {
      failureCode: failure.failureCode,
      expected: first.expected,
      actual: first.error ? `check error: ${first.error}` : first.actual,
      rootCause: failure.rootCause,
      guidance: failure.guidance
    },
    replay: [...replay, { at: "T+verdict", label: "Invariant violated", expected: first.expected, observed: first.error ? `check error: ${first.error}` : JSON.stringify(first.actual) }]
  };
}
