// JustFair Scenario Registry (Phase 2)
// Every scenario runs through the same generic runScenario() — no
// target-specific or scenario-specific runner code paths.

import { STALE_CARRIED_FORWARD_EQUITY } from "./first-scenario.js";
import {
  PRESTOCKS_EXPIRY_BEFORE,
  PRESTOCKS_EXPIRY_NEAR,
  PRESTOCKS_EXPIRY_AFTER
} from "./prestocks.js";

export const SCENARIOS = [
  STALE_CARRIED_FORWARD_EQUITY,
  PRESTOCKS_EXPIRY_BEFORE,
  PRESTOCKS_EXPIRY_NEAR,
  PRESTOCKS_EXPIRY_AFTER
];

export function findScenario(id) {
  return SCENARIOS.find(s => s.id === id) || null;
}
