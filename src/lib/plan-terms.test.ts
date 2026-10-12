import { test } from "node:test";
import assert from "node:assert/strict";
import { baseSlug, classifyPlanChange, flexSlug, isFlexSlug, tierRank } from "./plan-terms";

// Run with: npx tsx --test src/lib/plan-terms.test.ts

const p = (slug: string, priceMonthly: number) => ({ slug, priceMonthly });
const member = p("member", 30000);
const growth = p("growth", 50000);
const pro = p("pro", 90000);
const memberFlex = p("member-flex", 37500);
const growthFlex = p("growth-flex", 62500);

test("slug helpers", () => {
  assert.equal(isFlexSlug("growth-flex"), true);
  assert.equal(isFlexSlug("growth"), false);
  assert.equal(baseSlug("pro-flex"), "pro");
  assert.equal(flexSlug("member"), "member-flex");
  assert.equal(flexSlug("member-flex"), "member-flex");
  assert.equal(tierRank("growth-flex"), 1);
  assert.equal(tierRank("dedicated-pro"), null);
});

test("12-month upgrade to a higher 12-month tier keeps the term", () => {
  assert.deepEqual(classifyPlanChange(member, growth), { kind: "upgrade" });
});

test("Flexible upgrade to a higher Flexible tier keeps the term", () => {
  assert.deepEqual(classifyPlanChange(memberFlex, growthFlex), { kind: "upgrade" });
});

test("Flexible to the same tier on 12-month is a term switch, even though the price drops", () => {
  assert.deepEqual(classifyPlanChange(growthFlex, growth), { kind: "switch-to-annual" });
});

test("Flexible to a higher 12-month tier upgrades and restarts a 12-month term", () => {
  assert.deepEqual(classifyPlanChange(memberFlex, pro), { kind: "upgrade", restartTermMonths: 12 });
});

test("12-month to Flexible is blocked, at any tier", () => {
  assert.equal(classifyPlanChange(member, memberFlex).kind, "blocked");
  assert.equal(classifyPlanChange(member, growthFlex).kind, "blocked");
});

test("moving down a tier is blocked on both terms", () => {
  assert.equal(classifyPlanChange(growth, member).kind, "blocked");
  assert.equal(classifyPlanChange(growthFlex, memberFlex).kind, "blocked");
  assert.equal(classifyPlanChange(growthFlex, member).kind, "blocked");
});

test("plans outside the family still use the price rule", () => {
  assert.deepEqual(classifyPlanChange(p("early-adopters", 9100), member), { kind: "upgrade" });
  assert.equal(classifyPlanChange(pro, p("early-adopters", 9100)).kind, "blocked");
});
