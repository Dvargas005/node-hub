import { test } from "node:test";
import assert from "node:assert/strict";
import { isInMinTerm, minTermEndFor } from "./commitment";

// Run with: npx tsx --test src/lib/commitment.test.ts

test("a plan with no term has no end date", () => {
  assert.equal(minTermEndFor(new Date("2026-10-08T00:00:00Z"), 0), null);
});

test("a 12-month term ends one year after the first period starts", () => {
  const end = minTermEndFor(new Date("2026-10-08T15:00:00Z"), 12);
  assert.equal(end?.toISOString(), "2027-10-08T15:00:00.000Z");
});

test("a 3-month term ends three months after the first period starts", () => {
  const end = minTermEndFor(new Date("2026-10-08T15:00:00Z"), 3);
  assert.equal(end?.toISOString(), "2027-01-08T15:00:00.000Z");
});

test("the term blocks cancellation until its end date, then stops", () => {
  const end = new Date("2027-10-08T15:00:00Z");
  assert.equal(isInMinTerm(end, new Date("2027-10-08T14:59:59Z")), true);
  assert.equal(isInMinTerm(end, new Date("2027-10-08T15:00:00Z")), false);
  assert.equal(isInMinTerm(end, new Date("2028-01-01T00:00:00Z")), false);
});

test("a subscription without a term is never locked", () => {
  assert.equal(isInMinTerm(null), false);
  assert.equal(isInMinTerm(undefined), false);
});
