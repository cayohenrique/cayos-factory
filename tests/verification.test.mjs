import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVerification, normalizeVerifierProof, validateVerificationConfig } from "../scripts/verification.mjs";

test("normalizeVerification supports legacy single-repo and repositories array", () => {
  const legacy = normalizeVerification({
    skill: ".cursor/skills/verify-web",
    seam: "browser",
    sourcePaths: ["src"],
  });
  assert.deepEqual(legacy, [{
    repository: "primary",
    skill: ".cursor/skills/verify-web",
    seam: "browser",
    sourcePaths: ["src"],
    browser: undefined,
  }]);

  const multi = normalizeVerification({
    repositories: [
      { repository: "primary", skill: ".cursor/skills/verify-web", sourcePaths: ["src"] },
      { repository: "api", skill: ".cursor/skills/verify-api", sourcePaths: ["server.ts"] },
    ],
  });
  assert.equal(multi.length, 2);
  assert.equal(multi[1].repository, "api");
});

test("validateVerificationConfig rejects duplicate and undeclared repositories", () => {
  const missingPrimary = validateVerificationConfig({
    repositories: [{ repository: "api", skill: ".cursor/skills/verify-api", sourcePaths: ["x"] }],
  }, { repositories: { related: [{ id: "api" }] } });
  assert.equal(missingPrimary.valid, false);
  assert.match(missingPrimary.errors.join(","), /primary/);

  const duplicate = validateVerificationConfig({
    repositories: [
      { repository: "primary", skill: "a", sourcePaths: ["x"] },
      { repository: "primary", skill: "b", sourcePaths: ["y"] },
    ],
  });
  assert.equal(duplicate.valid, false);
  assert.match(duplicate.errors.join(","), /duplicate/);

  const undeclared = validateVerificationConfig({
    repositories: [{ repository: "api", skill: "a", sourcePaths: ["x"] }],
  }, { repositories: { related: [] } });
  assert.equal(undeclared.valid, false);
  assert.match(undeclared.errors.join(","), /undeclared/);
});

test("normalizeVerifierProof supports legacy and repositories proof shape", () => {
  const legacy = normalizeVerifierProof({
    evidence: "evidence/a.json",
    evidenceHash: "abc",
    verifierHash: "def",
    sourceHash: "ghi",
  });
  assert.deepEqual(legacy[0].repository, "primary");

  const multi = normalizeVerifierProof({
    repositories: [
      { repository: "primary", evidence: "a", evidenceHash: "1", verifierHash: "2", sourceHash: "3" },
      { repository: "api", evidence: "b", evidenceHash: "4", verifierHash: "5", sourceHash: "6" },
    ],
  });
  assert.equal(multi.length, 2);
});
