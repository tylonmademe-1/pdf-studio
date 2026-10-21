import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import {
  initDb,
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  findSession,
  deleteSession,
  recordHistory,
  getUserHistory,
  deleteUserHistoryItem,
} from "../../lib/db/index";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("Database & Authentication Layer", () => {
  before(async () => {
    await initDb();
  });

  test("Password hashing and verification with bcryptjs", async () => {
    const raw = "SuperSecretPassword2026!";
    const hash = await hashPassword(raw);
    assert.notEqual(raw, hash);

    const valid = await verifyPassword(raw, hash);
    assert.equal(valid, true);

    const invalid = await verifyPassword("WrongPassword", hash);
    assert.equal(invalid, false);
  });

  test("User creation and retrieval by email and ID", async () => {
    const email = `testuser-${Date.now()}@domain.local`;
    const hash = await hashPassword("ValidPassword123!");
    const name = "Test Architect";

    const user = await createUser(email, hash, name);
    assert.ok(user.id);
    assert.equal(user.email, email);
    assert.equal(user.name, name);

    const foundByEmail = await findUserByEmail(email);
    assert.ok(foundByEmail);
    assert.equal(foundByEmail.id, user.id);

    const foundById = await findUserById(user.id);
    assert.ok(foundById);
    assert.equal(foundById.email, email);
  });

  test("Session lifecycle: create, find, and delete", async () => {
    const email = `session-user-${Date.now()}@domain.local`;
    const user = await createUser(email, "hashed", "Session User");
    const token = `tok-${Date.now()}-${Math.random().toString(36)}`;
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour

    await createSession(user.id, token, expiresAt);

    const found = await findSession(token);
    assert.ok(found);
    assert.equal(found.userId, user.id);

    await deleteSession(token);
    const deleted = await findSession(token);
    assert.equal(deleted, null);
  });

  test("Processing history records metadata and enforces strict user isolation", async () => {
    const userA = await createUser(`usera-${Date.now()}@domain.local`, "h1", "User A");
    const userB = await createUser(`userb-${Date.now()}@domain.local`, "h2", "User B");

    // Record history for User A
    const historyIdA = await recordHistory(userA.id, {
      toolSlug: "merge-pdf",
      toolName: "Merge PDF",
      originalFilename: "doc1.pdf, doc2.pdf",
      outputFilename: "merged-doc1.pdf",
      status: "completed",
      fileSize: 10240,
      outputSize: 18450,
      engine: "stirling",
    });

    // Record history for User B
    await recordHistory(userB.id, {
      toolSlug: "rotate-pdf",
      toolName: "Rotate PDF",
      originalFilename: "scan.pdf",
      outputFilename: "rotated-scan.pdf",
      status: "completed",
      fileSize: 5000,
      outputSize: 5120,
      engine: "native",
    });

    // Verify User A only sees their own history
    const historyA = await getUserHistory(userA.id);
    assert.equal(historyA.length, 1);
    assert.equal(historyA[0].id, historyIdA);
    assert.equal(historyA[0].tool_slug, "merge-pdf");

    // Verify User B cannot access User A's history
    const historyB = await getUserHistory(userB.id);
    assert.equal(historyB.length, 1);
    assert.equal(historyB[0].tool_slug, "rotate-pdf");

    // Verify User B cannot delete User A's history
    const deletedByOther = await deleteUserHistoryItem(userB.id, historyIdA);
    assert.equal(deletedByOther, false);

    // Verify User A can delete their own history
    const deletedByOwner = await deleteUserHistoryItem(userA.id, historyIdA);
    assert.equal(deletedByOwner, true);
  });
});
