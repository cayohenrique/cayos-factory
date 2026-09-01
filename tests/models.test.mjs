import test from "node:test";
import assert from "node:assert/strict";
import { isInheritModel, normalizeModelPolicy, taskModelForRole, validateModelPolicy } from "../scripts/models.mjs";

test("normalizeModelPolicy prefers tier shape and expands agent roles", () => {
  const policy = normalizeModelPolicy({
    models: {
      delivery: "inherit",
      work: { fast: "fast-model", judgment: "judge-model" },
    },
  });
  assert.equal(policy.delivery, "inherit");
  assert.equal(policy.work.fast, "fast-model");
  assert.equal(policy.work.judgment, "judge-model");
  assert.equal(policy.roles.implementer, "fast-model");
  assert.equal(policy.roles.deepReviewers, "judge-model");
  assert.equal(policy.autoMode.grill, "fast-model");
  assert.equal(policy.autoMode.respond, "judge-model");
});

test("normalizeModelPolicy supports legacy per-agent bindings", () => {
  const policy = normalizeModelPolicy({
    models: {
      orchestrator: "legacy-orchestrator",
      implementer: "legacy-fast",
      deepReviewers: "legacy-judge",
    },
  });
  assert.equal(policy.delivery, "legacy-orchestrator");
  assert.equal(policy.work.fast, "legacy-fast");
  assert.equal(policy.work.judgment, "legacy-judge");
});

test("validateModelPolicy requires delivery and both work tiers", () => {
  const missing = validateModelPolicy({ models: { delivery: "inherit" } });
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join(","), /work\.fast/);
  assert.match(missing.errors.join(","), /work\.judgment/);

  const ok = validateModelPolicy({
    models: {
      delivery: "inherit",
      work: { fast: "f", judgment: "j" },
    },
  });
  assert.equal(ok.valid, true);
});

test("taskModelForRole omits inherit delivery models", () => {
  assert.equal(taskModelForRole("orchestrator", { models: { delivery: "inherit", work: { fast: "f", judgment: "j" } } }), null);
  assert.equal(taskModelForRole("implementer", { models: { delivery: "inherit", work: { fast: "fast-model", judgment: "j" } } }), "fast-model");
});

test("isInheritModel recognizes inherit aliases", () => {
  assert.equal(isInheritModel("inherit"), true);
  assert.equal(isInheritModel("inherit-parent"), true);
  assert.equal(isInheritModel("auto"), true);
  assert.equal(isInheritModel("composer-2.5"), false);
});
