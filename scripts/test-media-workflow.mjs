import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import {
  validateMedia,
  readRegistry,
  inspectAsset,
  hasFaststart,
  mediaLimits,
} from "./lib/media-validation.mjs";

const script = path.resolve("scripts/add-media.mjs");
const originalRegistry =
  "const describe = (src, description, decorative = false) => ({ src, description, decorative });\nexport const media = {};\n";
async function workspace(run) {
  const parent = path.resolve(".cache");
  await fs.mkdir(parent, { recursive: true });
  const root = await fs.mkdtemp(path.join(parent, "media-tests-"));
  assert(root.startsWith(parent + path.sep));
  try {
    await fs.mkdir(path.join(root, "src/data"), { recursive: true });
    await fs.mkdir(path.join(root, "src/assets/graphics"), { recursive: true });
    await fs.writeFile(path.join(root, "src/data/media.ts"), originalRegistry);
    await run(root);
  } finally {
    assert(path.resolve(root).startsWith(parent + path.sep));
    await fs.rm(root, { recursive: true, force: true });
  }
}
const add = (root, args) =>
  promisify(execFile)(process.execPath, [script, ...args], {
    cwd: root,
    windowsHide: true,
  });

test("unregistered media and blank descriptions are rejected", async () =>
  workspace(async (root) => {
    const image = await sharp({
      create: { width: 20, height: 10, channels: 3, background: "#ceff65" },
    })
      .webp()
      .toBuffer();
    await fs.writeFile(path.join(root, "src/assets/graphics/test.webp"), image);
    await assert.rejects(validateMedia({ root }), /test.webp: not registered/);
    assert.throws(
      () =>
        readRegistry(
          'import testFile from "@/assets/graphics/test.webp"; export const media = { test: describe(testFile, "") };',
        ),
      /meaningful description/,
    );
    assert.throws(
      () => readRegistry("export const media = { test: describe() };"),
      /use describe/,
    );
  }));

test("adding an image optimizes, registers, preserves alpha and prevents overwrite", async () =>
  workspace(async (root) => {
    const source = path.join(root, "source.png");
    await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 4,
        background: { r: 30, g: 100, b: 170, alpha: 0.5 },
      },
    })
      .png()
      .toFile(source);
    const args = [
      "--input",
      source,
      "--output",
      "graphics/portrait.webp",
      "--id",
      "teamPortrait",
      "--description",
      "Portrait for a media workflow test.",
      "--max-size",
      "20",
    ];
    await add(root, args);
    const output = path.join(root, "src/assets/graphics/portrait.webp");
    const outputBuffer = await fs.readFile(output);
    const image = await sharp(outputBuffer).metadata();
    assert.equal(image.width, 20);
    assert.equal(image.height, 10);
    assert(image.hasAlpha);
    const stats = await sharp(outputBuffer).ensureAlpha().stats();
    assert.equal(stats.channels[3].min, 128);
    assert.equal(stats.channels[3].max, 128);
    const result = await validateMedia({ root });
    assert.equal(result.entries[0].id, "teamPortrait");
    const registry = await fs.readFile(
      path.join(root, "src/data/media.ts"),
      "utf8",
    );
    const bytes = await fs.readFile(output);
    await assert.rejects(add(root, args), /already exists/);
    assert.equal(
      await fs.readFile(path.join(root, "src/data/media.ts"), "utf8"),
      registry,
    );
    assert((await fs.readFile(output)).equals(bytes));
    assert((await fs.stat(source)).size > 0);
    await assert.rejects(
      add(root, [
        "--input",
        source,
        "--output",
        "../escape.webp",
        "--id",
        "escape",
        "--description",
        "Escaping image.",
      ]),
      /inside graphics/,
    );
  }));

test("oversized SVG rolls back the new asset and leaves the registry and source intact", async () =>
  workspace(async (root) => {
    const source = path.join(root, "source.svg");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><!--${"x".repeat(mediaLimits.svg)}--><rect width="20" height="10"/></svg>`;
    await fs.writeFile(source, svg);
    await assert.rejects(
      add(root, [
        "--input",
        source,
        "--output",
        "graphics/large.svg",
        "--id",
        "large",
        "--description",
        "Test vector.",
      ]),
      /exceeds/,
    );
    assert.equal(
      await fs.readFile(path.join(root, "src/data/media.ts"), "utf8"),
      originalRegistry,
    );
    await assert.rejects(
      fs.access(path.join(root, "src/assets/graphics/large.svg")),
      { code: "ENOENT" },
    );
    assert.equal(await fs.readFile(source, "utf8"), svg);
  }));

test("missing imports, excessive dimensions, and unregistered public media are rejected", async () =>
  workspace(async (root) => {
    await fs.writeFile(
      path.join(root, "src/data/media.ts"),
      'import missingFile from "@/assets/graphics/missing.webp"; export const media = { missing: describe(missingFile, "Missing image.") };',
    );
    await assert.rejects(validateMedia({ root }), /missing file/);
    await fs.writeFile(path.join(root, "src/data/media.ts"), originalRegistry);
    const image = await sharp({
      create: { width: 4097, height: 1, channels: 3, background: "#ceff65" },
    })
      .webp()
      .toBuffer();
    const file = path.join(root, "large.webp");
    await fs.writeFile(file, image);
    await assert.rejects(
      inspectAsset(file, "src/assets/graphics/large.webp"),
      /4096 pixels/,
    );
    await fs.mkdir(path.join(root, "public"));
    await fs.writeFile(path.join(root, "public/hidden.webp"), image);
    await assert.rejects(
      validateMedia({ root }),
      /content media belongs in src\/assets/,
    );
  }));

test("MP4 faststart detects moov order and corrupt atom lengths", () => {
  const atom = (type) => {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(8);
    buffer.write(type, 4);
    return buffer;
  };
  assert(
    hasFaststart(Buffer.concat([atom("ftyp"), atom("moov"), atom("mdat")])),
  );
  assert(
    !hasFaststart(Buffer.concat([atom("ftyp"), atom("mdat"), atom("moov")])),
  );
  const corrupt = atom("moov");
  corrupt.writeUInt32BE(999);
  assert(!hasFaststart(corrupt));
});
