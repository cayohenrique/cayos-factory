const INHERIT = new Set(["inherit", "inherit-parent", "auto"]);

export function isInheritModel(value) {
  return INHERIT.has(String(value || "").toLowerCase());
}

export function normalizeModelPolicy(local = {}) {
  const models = local.models || {};
  const delivery = models.delivery ?? models.orchestrator ?? "inherit";
  const fast = models.work?.fast ?? models.implementer ?? models.smallReviewer ?? models.repairer;
  const judgment = models.work?.judgment ?? models.deepReviewers ?? models.evaluator;
  const grill = models.autoMode?.grill ?? models.griller ?? fast;
  const respond = models.autoMode?.respond ?? models.autoResponder ?? judgment;

  const roles = {
    orchestrator: models.orchestrator ?? delivery,
    implementer: models.implementer ?? fast,
    smallReviewer: models.smallReviewer ?? fast,
    repairer: models.repairer ?? fast,
    deepReviewers: models.deepReviewers ?? judgment,
    evaluator: models.evaluator ?? judgment,
    griller: models.griller ?? grill,
    autoResponder: models.autoResponder ?? respond,
  };

  return {
    delivery,
    work: { fast, judgment },
    autoMode: { grill: roles.griller, respond: roles.autoResponder },
    roles,
  };
}

export function validateModelPolicy(local = {}) {
  const policy = normalizeModelPolicy(local);
  const errors = [];
  if (!policy.delivery) errors.push("delivery model is required (use inherit for parent chat)");
  if (!policy.work.fast) errors.push("work.fast is required for implementation and lightweight review");
  if (!policy.work.judgment) errors.push("work.judgment is required for deep review and spec scrutiny");
  return { valid: errors.length === 0, errors, policy };
}

export function taskModelForRole(role, local = {}) {
  const { roles } = normalizeModelPolicy(local);
  const model = roles[role];
  if (!model || isInheritModel(model)) return null;
  return model;
}
