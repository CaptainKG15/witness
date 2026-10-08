// Tests the pure helper functions in app/index.html. Run: node tests/frontend_helpers.test.js
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const html = fs.readFileSync(path.join(__dirname, "..", "app", "index.html"), "utf8");
const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const grab = (name) => js.match(new RegExp("(function " + name + "\\([\\s\\S]*?\\n}\\n)"))[1];
const src = ["norm", "isHttps", "describeReading"].map(grab).join("\n");
const { norm, isHttps, describeReading } = new Function(src + "\nreturn { norm, isHttps, describeReading };")();

const raw = new Map([["id", 3n], ["url", "https://x.com"], ["injection_suspected", true], ["nested", new Map([["a", 1n]])]]);
assert.deepStrictEqual(norm(raw), { id: 3, url: "https://x.com", injection_suspected: true, nested: { a: 1 } });
assert.deepStrictEqual(norm([new Map([["k", 2n]])]), [{ k: 2 }]);
assert.strictEqual(norm("text"), "text");
assert.strictEqual(norm(null), null);

assert.ok(isHttps("https://example.com/a"));
assert.ok(!isHttps("http://example.com"));
assert.ok(!isHttps("javascript:alert(1)"));
assert.ok(!isHttps("https://a b.com"));
assert.ok(!isHttps(undefined));

assert.ok(describeReading("yes|article|false").includes("supports the claim"));
assert.ok(describeReading("no|docs|false").includes("contradicts"));
assert.ok(describeReading("unclear|other|true").includes("steer the reader"));
assert.strictEqual(describeReading("unreadable"), "No usable reading.");
assert.strictEqual(describeReading(undefined), "No usable reading.");

console.log("frontend helper tests passed");
