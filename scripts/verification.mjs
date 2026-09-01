export function normalizeVerification(verification = {}) {
  if (Array.isArray(verification.repositories) && verification.repositories.length > 0) {
    return verification.repositories.map((entry) => ({
      repository: String(entry.repository || "primary"),
      skill: String(entry.skill || ""),
      sourcePaths: Array.isArray(entry.sourcePaths) ? entry.sourcePaths.map(String) : [],
      seam: String(entry.seam || "http"),
      browser: entry.browser,
    }));
  }
  if (verification.skill) {
    return [{
      repository: "primary",
      skill: String(verification.skill),
      sourcePaths: Array.isArray(verification.sourcePaths) ? verification.sourcePaths.map(String) : [],
      seam: String(verification.seam || "http"),
      browser: verification.browser,
    }];
  }
  return [];
}

export function validateVerificationConfig(verification, project = {}) {
  const entries = normalizeVerification(verification);
  const errors = [];
  if (!entries.length) errors.push("at least one repository verifier is required");
  if (!entries.some((entry) => entry.repository === "primary")) errors.push("primary repository verifier is required");
  const seen = new Set();
  for (const entry of entries) {
    if (!entry.skill) errors.push(`missing skill for repository ${entry.repository}`);
    if (!entry.sourcePaths.length) errors.push(`missing sourcePaths for repository ${entry.repository}`);
    if (seen.has(entry.repository)) errors.push(`duplicate verifier for repository ${entry.repository}`);
    seen.add(entry.repository);
    if (entry.repository !== "primary") {
      const declared = (project.repositories?.related || []).find((repo) => repo.id === entry.repository);
      if (!declared) errors.push(`undeclared related repository verifier: ${entry.repository}`);
    }
  }
  return { entries, valid: errors.length === 0, errors };
}

export function normalizeVerifierProof(verifierProof = {}) {
  if (Array.isArray(verifierProof.repositories) && verifierProof.repositories.length > 0) {
    return verifierProof.repositories.map((entry) => ({
      repository: String(entry.repository || "primary"),
      evidence: String(entry.evidence || ""),
      evidenceHash: String(entry.evidenceHash || ""),
      verifierHash: String(entry.verifierHash || ""),
      sourceHash: String(entry.sourceHash || ""),
    }));
  }
  if (verifierProof.evidence) {
    return [{
      repository: "primary",
      evidence: String(verifierProof.evidence),
      evidenceHash: String(verifierProof.evidenceHash || ""),
      verifierHash: String(verifierProof.verifierHash || ""),
      sourceHash: String(verifierProof.sourceHash || ""),
    }];
  }
  return [];
}
