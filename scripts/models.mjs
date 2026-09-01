const INHERIT = new Set(["inherit", "inherit-parent", "auto"]);

export const SUBAGENT_KEYS = [
  "grillInterviewer",
  "grillInterviewee",
  "smallTask",
  "mediumTask",
  "complexTask",
  "reviewer",
];

const ROLE_TO_SUBAGENT = {
  griller: "grillInterviewer",
  autoResponder: "grillInterviewee",
  implementer: "mediumTask",
  repairer: "mediumTask",
  smallReviewer: "reviewer",
  deepReviewers: "reviewer",
  evaluator: "reviewer",
};

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).length > 0);
}

export function isInheritModel(value) {
  return INHERIT.has(String(value || "").toLowerCase());
}

export function normalizeModelPolicy(local = {}) {
  const models = local.models || {};
  const subagents = models.subagents || {};
  const delivery = pick(models.delivery, models.orchestrator, "inherit");
  const fast = pick(models.work?.fast, models.implementer, models.smallReviewer, models.repairer, models.griller);
  const judgment = pick(models.work?.judgment, models.deepReviewers, models.evaluator, models.autoResponder);
  const grill = pick(models.autoMode?.grill, models.griller, fast);
  const respond = pick(models.autoMode?.respond, models.autoResponder, judgment);

  const resolved = {
    grillInterviewer: pick(subagents.grillInterviewer, grill, fast),
    grillInterviewee: pick(subagents.grillInterviewee, respond, judgment),
    smallTask: pick(subagents.smallTask, fast, models.implementer),
    mediumTask: pick(subagents.mediumTask, fast, models.implementer),
    complexTask: pick(subagents.complexTask, judgment, models.deepReviewers),
    reviewer: pick(subagents.reviewer, judgment, models.deepReviewers, models.smallReviewer),
  };

  const roles = {
    orchestrator: pick(models.orchestrator, delivery),
    implementer: pick(models.implementer, resolved.mediumTask),
    smallReviewer: pick(models.smallReviewer, resolved.reviewer),
    repairer: pick(models.repairer, resolved.mediumTask),
    deepReviewers: pick(models.deepReviewers, resolved.reviewer),
    evaluator: pick(models.evaluator, resolved.reviewer),
    griller: pick(models.griller, resolved.grillInterviewer),
    autoResponder: pick(models.autoResponder, resolved.grillInterviewee),
  };

  return {
    delivery,
    subagents: resolved,
    work: { fast, judgment },
    autoMode: { grill: resolved.grillInterviewer, respond: resolved.grillInterviewee },
    roles,
  };
}

export function validateModelPolicy(local = {}) {
  const policy = normalizeModelPolicy(local);
  const errors = [];
  if (!policy.delivery) errors.push("delivery model is required (use inherit for parent chat)");
  for (const key of SUBAGENT_KEYS) {
    if (!policy.subagents[key]) errors.push(`subagents.${key} is required`);
  }
  return { valid: errors.length === 0, errors, policy };
}

export function taskModelForSubagent(key, local = {}) {
  if (!SUBAGENT_KEYS.includes(key)) throw new Error(`unknown subagent key: ${key}`);
  const { subagents } = normalizeModelPolicy(local);
  const model = subagents[key];
  if (!model || isInheritModel(model)) return null;
  return model;
}

export function taskModelForComplexity(level, local = {}) {
  const normalized = String(level || "medium").toLowerCase();
  if (normalized === "small") return taskModelForSubagent("smallTask", local);
  if (normalized === "large" || normalized === "complex") return taskModelForSubagent("complexTask", local);
  return taskModelForSubagent("mediumTask", local);
}

export function taskModelForRole(role, local = {}) {
  if (role === "orchestrator") {
    const { delivery } = normalizeModelPolicy(local);
    if (!delivery || isInheritModel(delivery)) return null;
    return delivery;
  }
  const subagent = ROLE_TO_SUBAGENT[role];
  if (!subagent) throw new Error(`unknown role: ${role}`);
  return taskModelForSubagent(subagent, local);
}

export function applySubagentUpdates(models = {}, updates = {}) {
  const next = { ...models, subagents: { ...(models.subagents || {}) } };
  for (const key of SUBAGENT_KEYS) {
    if (updates[key]) next.subagents[key] = String(updates[key]);
  }
  if (updates.fast) {
    next.subagents.grillInterviewer = String(updates.fast);
    next.subagents.smallTask = String(updates.fast);
    next.subagents.mediumTask = String(updates.fast);
    next.work = { ...(next.work || {}), fast: String(updates.fast) };
  }
  if (updates.judgment) {
    next.subagents.grillInterviewee = String(updates.judgment);
    next.subagents.complexTask = String(updates.judgment);
    next.subagents.reviewer = String(updates.judgment);
    next.work = { ...(next.work || {}), judgment: String(updates.judgment) };
  }
  if (updates.grill) {
    next.subagents.grillInterviewer = String(updates.grill);
    next.autoMode = { ...(next.autoMode || {}), grill: String(updates.grill) };
  }
  if (updates.respond) {
    next.subagents.grillInterviewee = String(updates.respond);
    next.autoMode = { ...(next.autoMode || {}), respond: String(updates.respond) };
  }
  return next;
}
