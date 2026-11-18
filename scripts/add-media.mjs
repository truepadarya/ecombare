import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import prettier from "prettier";
import {
  inspectAsset,
  readRegistry,
  validateMedia,
} from "./lib/media-validation.mjs";

const { values } = parseArgs({
  options: {
    input: { type: "string" },
    output: { type: "string" },
    id: { type: "string" },
    description: { type: "string" },
    quality: { type: "string", default: "90" },
    "max-size": { type: "string", default: "2560" },
    decorative: { type: "boolean", default: false },
    lossless: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

async function main() {
  if (values.help) {
    console.log(
      'npm run media:add -- --input path/to/photo.jpg --output graphics/team/portrait.webp --id teamPortrait --description "Portrait of a team member." [--max-size 1600] [--quality 90] [--lossless] [--decorative]',
    );
    console.log(
      "Optimizes a raster image to WebP, or preserves SVG, and registers the file. Source and existing assets are never overwritten. Review the result visually. For video, follow the FFmpeg workflow in LUMOS.md.",
    );
    return;
  }
  for (const option of ["input", "output", "id", "description"])
    if (!values[option]?.trim())
      throw new Error(
        `Missing --${option}. View the image and write its description before importing.`,
      );
  if (!/^[a-z][a-zA-Z0-9]*$/.test(values.id))
    throw new Error("--id must be a stable camelCase name.");
  if (!/^(graphics|icons|logo)\/[a-z0-9/-]+\.(webp|svg)$/.test(values.output))
    throw new Error(
      "--output must be a lowercase kebab-case WebP or SVG path inside graphics/, icons/ or logo/.",
    );
  const quality = Number(values.quality),
    maxSize = Number(values["max-size"]);
  if (
    !Number.isInteger(quality) ||
    quality < 50 ||
    quality > 100 ||
    !Number.isInteger(maxSize) ||
    maxSize < 1 ||
    maxSize > 4096
  )
    throw new Error(
      "Use --quality 50–100 and --max-size 1–4096; never upscale the source.",
    );
  await validateMedia();
  const registryPath = path.resolve("src/data/media.ts");
  const original = await fs.readFile(registryPath, "utf8");
  const { entries, object } = readRegistry(original);
  if (entries.some((entry) => entry.id === values.id))
    throw new Error(
      `media.${values.id} already exists. To replace its file, keep this ID and description and update its import intentionally.`,
    );
  const assetsRoot = path.resolve("src/assets");
  const output = path.resolve(assetsRoot, values.output);
  if (!output.startsWith(assetsRoot + path.sep))
    throw new Error("Output must stay inside src/assets.");
  const source = path.resolve(values.input);
  if (source === output)
    throw new Error("Keep the source separate from the web asset.");
  const input = await fs.readFile(source);
  const metadata = await sharp(input).metadata();
  const svg = metadata.format === "svg";
  if (svg !== values.output.endsWith(".svg"))
    throw new Error("SVG stays SVG; raster images must be written as .webp.");
  if (metadata.pages > 1)
    throw new Error(
      "Animated input needs a separate animation/video review; do not silently flatten it.",
    );
  let result = svg
    ? input
    : await sharp(input)
        .rotate()
        .resize({
          width: maxSize,
          height: maxSize,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp(
          values.lossless
            ? { lossless: true, effort: 6 }
            : { quality, alphaQuality: 100, effort: 6 },
        )
        .toBuffer();
  if (
    metadata.format === "webp" &&
    Math.max(metadata.width, metadata.height) <= maxSize &&
    (!metadata.orientation || metadata.orientation === 1) &&
    input.length <= result.length
  )
    result = input;
  const importName = `${values.id}File`;
  if (new RegExp(`\\b${importName}\\b`).test(original))
    throw new Error(`Import name ${importName} is already used.`);
  const declaration = `\n  ${values.id}: describe(${importName}, ${JSON.stringify(values.description.trim())}${values.decorative ? ", true" : ""}),\n`;
  const position = object.getEnd() - 1;
  const hasTrailingComma = /,\s*$/.test(
    original.slice(object.getStart() + 1, position),
  );
  const insertion =
    object.properties.length && !hasTrailingComma
      ? "," + declaration
      : declaration;
  let updated =
    original.slice(0, position) + insertion + original.slice(position);
  updated =
    `import ${importName} from ${JSON.stringify("@/assets/" + values.output + (svg ? "?url&no-inline" : ""))};\n` +
    updated;
  updated = await prettier.format(updated, {
    ...(await prettier.resolveConfig(registryPath)),
    parser: "typescript",
  });
  readRegistry(updated);
  const temporaryRegistry = registryPath + `.media-add-${process.pid}.tmp`;
  let created = false,
    registered = false;
  try {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, result, { flag: "wx" });
    created = true;
    await inspectAsset(output, "src/assets/" + values.output);
    if ((await fs.readFile(registryPath, "utf8")) !== original)
      throw new Error(
        "The registry changed during import. Retry with its current contents.",
      );
    await fs.writeFile(temporaryRegistry, updated, { flag: "wx" });
    await fs.rename(temporaryRegistry, registryPath);
    registered = true;
    await validateMedia();
  } catch (error) {
    if (registered && (await fs.readFile(registryPath, "utf8")) === updated)
      await fs.writeFile(registryPath, original);
    if (created) await fs.unlink(output);
    throw error;
  } finally {
    await fs.unlink(temporaryRegistry).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  console.log(
    `Added media.${values.id}: ${(input.length / 1024).toFixed(1)} → ${(result.length / 1024).toFixed(1)} KiB. Use src={media.${values.id}.src}; inspect it at /media-review and run npm run check.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
