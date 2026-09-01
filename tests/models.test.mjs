import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBAGENT_KEYS,
  isInheritModel,
  normalizeModelPolicy,
  taskModelForComplexity,
  taskModelForRole,
  taskModelForSubagent,
  validateModelPolicy,
} from "../scripts/models.mjs";

test("normalizeModelPolicy resolves six subagent classes", () => {
  const policy = normalizeModelPolicy({
    models: {
      delivery: "inherit",
      subagents: {
        grillInterviewer: "gi",
        grillInterviewee: "ge",
        smallTask: "s",
        mediumTask: "m",
        complexTask: "c",
        reviewer: "r",
      },
    },
  });
  assert.equal(policy.subagents.grillInterviewer, "gi");
  assert.equal(policy.subagents.reviewer, "r");
  assert.equal(policy.roles.griller, "gi");
  assert.equal(policy.roles.deepReviewers, "r");
});

test("normalizeModelPolicy migrates legacy work tiers into subagents", () => {
  const policy = normalizeModelPolicy({
    models: {
      delivery: "inherit",
      work: { fast: "fast-model", judgment: "judge-model" },
    },
  });
  assert.equal(policy.subagents.grillInterviewer, "fast-model");
  assert.equal(policy.subagents.grillInterviewee, "judge-model");
  assert.equal(policy.subagents.smallTask, "fast-model");
  assert.equal(policy.subagents.mediumTask, "fast-model");
  assert.equal(policy.subagents.complexTask, "judge-model");
  assert.equal(policy.subagents.reviewer, "judge-model");
});

test("validateModelPolicy requires delivery and all subagent classes", () => {
  const missing = validateModelPolicy({ models: { delivery: "inherit" } });
  assert.equal(missing.valid, false);
  for (const key of SUBAGENT_KEYS) assert.match(missing.errors.join(","), new RegExp(key));

  const ok = validateModelPolicy({
    models: {
      delivery: "inherit",
      subagents: Object.fromEntries(SUBAGENT_KEYS.map((key) => [key, "model"])),
    },
  });
  assert.equal(ok.valid, true);
});

test("taskModelForComplexity routes small medium and large", () => {
  const local = {
    models: {
      delivery: "inherit",
      subagents: {
        grillInterviewer: "gi",
        grillInterviewee: "ge",
        smallTask: "small-model",
        mediumTask: "medium-model",
        complexTask: "complex-model",
        reviewer: "review-model",
      },
    },
  };
  assert.equal(taskModelForComplexity("small", local), "small-model");
  assert.equal(taskModelForComplexity("medium", local), "medium-model");
  assert.equal(taskModelForComplexity("large", local), "complex-model");
});

test("taskModelForRole maps legacy roles to subagent classes", () => {
  const local = {
    models: {
      delivery: "inherit",
      subagents: Object.fromEntries(SUBAGENT_KEYS.map((key) => [key, `${key}-model`])),
    },
  };
  assert.equal(taskModelForRole("griller", local), "grillInterviewer-model");
  assert.equal(taskModelForRole("implementer", local), "mediumTask-model");
  assert.equal(taskModelForRole("deepReviewers", local), "reviewer-model");
});

test("taskModelForRole omits inherit delivery models", () => {
  assert.equal(taskModelForRole("orchestrator", { models: { delivery: "inherit", subagents: Object.fromEntries(SUBAGENT_KEYS.map((key) => [key, "m"])) } }), null);
});

test("isInheritModel recognizes inherit aliases", () => {
  assert.equal(isInheritModel("inherit"), true);
  assert.equal(isInheritModel("inherit-parent"), true);
  assert.equal(isInheritModel("auto"), true);
  assert.equal(taskModelForSubagent("reviewer", { models: { delivery: "inherit", subagents: Object.fromEntries(SUBAGENT_KEYS.map((key) => [key, "composer-2.5"])) } }), "composer-2.5");
});
