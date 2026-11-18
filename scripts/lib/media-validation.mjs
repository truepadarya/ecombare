import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import sharp from "sharp";

export const mediaLimits = {
  image: 1536 * 1024,
  svg: 100 * 1024,
  video: 5 * 1024 * 1024,
  dimension: 4096,
};
const mediaExtension =
  /\.(webp|avif|png|jpe?g|svg|mp4|ico|gif|webm|mov|heic|heif|bmp|tiff?)$/i;
export async function walk(folder) {
  try {
    return (
      await Promise.all(
        (await fs.readdir(folder, { withFileTypes: true })).map((entry) =>
          entry.isDirectory()
            ? walk(path.join(folder, entry.name))
            : path.join(folder, entry.name),
        ),
      )
    ).flat();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const unwrap = (expression) => {
  while (
    ts.isSatisfiesExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  )
    expression = expression.expression;
  return expression;
};

export function readRegistry(code) {
  const parsed = ts.createSourceFile(
    "media.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const imports = new Map();
  let object;
  for (const statement of parsed.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      statement.importClause?.name &&
      statement.moduleSpecifier.text.startsWith("@/assets/")
    ) {
      imports.set(
        statement.importClause.name.text,
        statement.moduleSpecifier.text.split("?")[0].replace("@/", "src/"),
      );
    }
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations) {
        if (
          declaration.name.getText(parsed) === "media" &&
          declaration.initializer
        )
          object = unwrap(declaration.initializer);
      }
  }
  if (
    parsed.parseDiagnostics.length ||
    !object ||
    !ts.isObjectLiteralExpression(object)
  )
    throw new Error(
      "src/data/media.ts must export a valid media object with explicit imports.",
    );
  const entries = [];
  const errors = [];
  for (const property of object.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      !ts.isIdentifier(property.name) ||
      !/^[a-z][a-zA-Z0-9]*$/.test(property.name.text)
    ) {
      errors.push(
        "Each media record needs a stable camelCase ID, not a path or spread.",
      );
      continue;
    }
    const id = property.name.text;
    const call = property.initializer;
    if (
      !ts.isCallExpression(call) ||
      call.arguments.length < 2 ||
      call.arguments.length > 3 ||
      call.expression.getText(parsed) !== "describe" ||
      !ts.isIdentifier(call.arguments[0]) ||
      !ts.isStringLiteral(call.arguments[1])
    ) {
      errors.push(
        `media.${id}: use describe(importedFile, "Meaningful description", optionalDecorativeBoolean).`,
      );
      continue;
    }
    const file = imports.get(call.arguments[0].text);
    const description = call.arguments[1].text.trim();
    const decorative = call.arguments[2];
    if (!file)
      errors.push(
        `media.${id}: source must be an explicit import from @/assets/.`,
      );
    if (
      !description ||
      /^(todo|tbd|placeholder|image|photo|video|description)[.!]?$/i.test(
        description,
      )
    )
      errors.push(
        `media.${id}: write a meaningful description after viewing the file.`,
      );
    if (
      decorative &&
      ![ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
        decorative.kind,
      )
    )
      errors.push(`media.${id}: decorative must be true or false.`);
    entries.push({
      id,
      file,
      description,
      decorative: decorative?.kind === ts.SyntaxKind.TrueKeyword,
    });
  }
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
    errors.push("Duplicate media IDs.");
  if (new Set(entries.map((entry) => entry.file)).size !== entries.length)
    errors.push("Register each file once; reuse its stable ID.");
  for (const file of imports.values())
    if (!entries.some((entry) => entry.file === file))
      errors.push(`Unused media import: ${file}`);
  if (errors.length) throw new Error(errors.join("\n"));
  return { entries, object, parsed };
}

export function hasFaststart(data) {
  const atoms = [];
  for (let offset = 0; offset + 8 <= data.length;) {
    let size = data.readUInt32BE(offset);
    if (size === 1) {
      if (offset + 16 > data.length) return false;
      size = Number(data.readBigUInt64BE(offset + 8));
    } else if (size === 0) size = data.length - offset;
    if (size < 8 || offset + size > data.length) return false;
    atoms.push(data.toString("ascii", offset + 4, offset + 8));
    offset += size;
  }
  return (
    atoms.includes("moov") &&
    atoms.includes("mdat") &&
    atoms.indexOf("moov") < atoms.indexOf("mdat")
  );
}

export async function inspectAsset(file, relative) {
  const data = await fs.readFile(file);
  const extension = path.extname(relative).toLowerCase();
  const limit =
    extension === ".mp4"
      ? mediaLimits.video
      : extension === ".svg"
        ? mediaLimits.svg
        : mediaLimits.image;
  if (data.length > limit)
    throw new Error(
      `${relative}: ${Math.ceil(data.length / 1024)} KiB exceeds the ${Math.ceil(limit / 1024)} KiB review limit. Optimize from the original; do not raise the limit to pass.`,
    );
  if (extension === ".mp4") {
    if (!hasFaststart(data))
      throw new Error(`${relative}: MP4 needs faststart (moov before mdat).`);
    if (
      !data.includes(Buffer.from("avc1")) &&
      !data.includes(Buffer.from("avc3"))
    )
      throw new Error(
        `${relative}: use H.264 MP4 for the site's video baseline.`,
      );
    return;
  }
  if (extension === ".ico") {
    if (
      !relative.startsWith("src/assets/logo/") ||
      data.length < 4 ||
      data.readUInt32LE(0) !== 65536
    )
      throw new Error(
        `${relative}: ICO is reserved for browser icons in logo/.`,
      );
    return;
  }
  if (![".webp", ".avif", ".svg", ".png"].includes(extension))
    throw new Error(
      `${relative}: convert raster images to WebP/AVIF and video to H.264 MP4 before registration.`,
    );
  if (extension === ".png" && !relative.startsWith("src/assets/logo/"))
    throw new Error(
      `${relative}: PNG is reserved for logo/social/browser assets; use lossless WebP for UI screenshots.`,
    );
  const metadata = await sharp(data).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`${relative}: cannot read image dimensions.`);
  if (metadata.format !== extension.slice(1))
    throw new Error(`${relative}: file contents do not match the extension.`);
  if (
    extension !== ".svg" &&
    Math.max(metadata.width, metadata.height) > mediaLimits.dimension
  )
    throw new Error(
      `${relative}: exceeds ${mediaLimits.dimension} pixels; prepare a web-sized source without upscaling.`,
    );
}

export async function validateMedia({ root = process.cwd() } = {}) {
  const errors = [];
  const { entries } = readRegistry(
    await fs.readFile(path.join(root, "src/data/media.ts"), "utf8"),
  );
  const relative = (file) => path.relative(root, file).replaceAll("\\", "/");
  const files = (await walk(path.join(root, "src/assets")))
    .filter((file) => mediaExtension.test(file))
    .map(relative);
  for (const file of files)
    if (!entries.some((entry) => entry.file === file))
      errors.push(
        `${file}: not registered. Use npm run media:add or add an explicit import and description in src/data/media.ts.`,
      );
  for (const entry of entries)
    if (!files.includes(entry.file))
      errors.push(
        `media.${entry.id}: missing file ${entry.file}. Update the import after moving or renaming media.`,
      );
  for (const file of files) {
    if (
      !/^[a-z0-9/-]+\.[a-z0-9]+$/.test(file) ||
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(file)
    )
      errors.push(
        `${file}: use lowercase kebab-case names, without spaces or UUIDs.`,
      );
    try {
      await inspectAsset(path.join(root, file), file);
    } catch (error) {
      errors.push(error.message);
    }
    if (
      file.endsWith(".mp4") &&
      !files.includes(file.replace(/\.mp4$/, "-poster.webp"))
    )
      errors.push(`${file}: add and register a matching -poster.webp preview.`);
  }
  for (const file of (await walk(path.join(root, "public"))).filter((file) =>
    mediaExtension.test(file),
  )) {
    const name = relative(file).replace(/^public\//, "");
    if (!/^(favicon\.(svg|png|ico)|og-image\.(jpe?g|png|webp))$/.test(name))
      errors.push(
        `${relative(file)}: content media belongs in src/assets and the shared registry. public/ is reserved for browser/social files.`,
      );
  }
  if (errors.length)
    throw new Error(
      `Media checks failed:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  return { files, entries };
}
