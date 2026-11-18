import { validateMedia } from "./lib/media-validation.mjs";

try {
  const { files } = await validateMedia();
  console.log(
    `Media checks passed: ${files.length} files, imports, descriptions, formats, dimensions, size limits and video previews.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
