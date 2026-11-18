import assert from "node:assert/strict";
import { contactError } from "../src/utils/contact-validation.ts";

for (const name of [
  "A",
  "Ольга",
  "张伟",
  "Jean-Luc D'Avila",
  "محمد",
  "علی‌رضا",
  "  Jo  ",
])
  assert.equal(contactError("name", name), "", `International name: ${name}`);
for (const name of ["", "  ", "123", "😀", "A\nB", "x".repeat(101)])
  assert.notEqual(
    contactError("name", name),
    "",
    `Invalid name: ${JSON.stringify(name)}`,
  );
for (const email of [
  "test@example.com",
  "first.last+tag@sub.example.co.uk",
  "o'connor@example.com",
  " USER@example.com ",
  "a@xn--e1afmkfd.xn--p1ai",
])
  assert.equal(contactError("email", email), "", `Valid email: ${email}`);
for (const email of [
  "",
  "y@we",
  "wrong@",
  "a@@example.com",
  ".a@example.com",
  "a.@example.com",
  "a..b@example.com",
  "a@-example.com",
  "a@example-.com",
  "a@example..com",
  "a b@example.com",
  "a@127.0.0.1",
  "a@" + "x".repeat(64) + ".com",
  "x".repeat(65) + "@example.com",
  "<script>@example.com",
])
  assert.notEqual(contactError("email", email), "", `Invalid email: ${email}`);
assert.equal(contactError("company", ""), "");
assert.equal(contactError("message", ""), "");
assert.equal(
  contactError("message", '<img src=x onerror="alert(1)">'),
  "",
  "Treat messages as text, never HTML",
);
assert.notEqual(contactError("company", "x".repeat(201)), "");
assert.notEqual(contactError("message", "x".repeat(5001)), "");
console.log(
  "Contact validation passed: Unicode names, complete domains, local/domain syntax, length limits and optional plain-text messages.",
);
