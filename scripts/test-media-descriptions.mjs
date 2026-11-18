import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMedia } from "./lib/media-validation.mjs";
import sharp from "sharp";

const { files } = await validateMedia();

const fixture = "src/pages/media-descriptions-test.astro";
try {
  await fs.access(fixture);
  throw new Error(`Test fixture already exists: ${fixture}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const build = async () => {
  const packagePath = fileURLToPath(import.meta.resolve("astro/package.json"));
  const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
  const cli = resolve(dirname(packagePath), packageJson.bin.astro);
  const { stdout, stderr } = await promisify(execFile)(
    process.execPath,
    [cli, "build"],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  if (stderr) process.stderr.write(stderr);
  return stdout;
};

await fs.writeFile(
  fixture,
  `---
import Img from "@/components/media/Img.astro";
import Video from "@/components/media/Video.astro";
import { media } from "@/data/media";
const photo = media.placeholderImage.src;
const photoUrl = photo.src;
const background = media.placeholderBackground.src;
const clip = media.placeholderVideo.src;
const mediaRecords = Object.entries(media).map(([id, item]) => ({
  id, description: item.description, decorative: item.decorative,
  src: typeof item.src === "string" ? item.src : item.src.src,
}));
---
<script type="application/json" id="media-registry" set:html={JSON.stringify(mediaRecords)} />
<Img src={photo} variant="densities" width={80} data-test="metadata" />
<Img src={photo.src} width={80} height={100} data-test="metadata-url" />
<Img src={photoUrl} width={80} height={100} data-test="url" />
<Img src={photoUrl + "?v=1#preview"} width={80} height={100} data-test="query" />
<Img src={photo} variant="densities" width={80} alt="Context-specific description" data-test="override" />
<Img src={photo} variant="densities" width={80} alt="" data-test="empty" />
<Img src={background} variant="densities" width={80} data-test="decorative" />
<Img src="/unregistered.webp" width={80} height={100} data-test="unknown" />
<Img src={photo} render={false} data-test="hidden-image" />
<Video src={clip} autoplay={false} data-test="video" />
<Video src={clip} autoplay={false} aria-label="Context-specific video" data-test="video-override" />
<Video src={clip} autoplay={false} aria-label="" data-test="video-empty" />
<p id="video-caption">Visible video caption</p>
<Video src={clip} autoplay={false} aria-labelledby="video-caption" data-test="video-labelledby" />
<Video src={clip} autoplay={false} aria-hidden="true" data-test="video-hidden" />
<Video src={clip} render={false} data-test="hidden-video" />
`,
);

try {
  await build();
  const html = await fs.readFile(
    "dist/media-descriptions-test/index.html",
    "utf8",
  );
  const records = JSON.parse(
    html.match(
      /<script[^>]*id="media-registry"[^>]*>([\s\S]*?)<\/script>/,
    )?.[1] ?? "null",
  );
  assert.equal(records.length, files.length);
  const mediaById = new Map(records.map((entry) => [entry.id, entry]));
  assert.equal(mediaById.size, records.length);
  for (const entry of records) {
    assert(entry.description.trim(), entry.id);
    assert(entry.src, entry.id);
    assert.equal(typeof entry.decorative, "boolean");
    assert(!/[/.]/.test(entry.id), `Path used as a media ID: ${entry.id}`);
  }
  const attribute = (element, name) => {
    const match = element.match(
      new RegExp(`\\s${name}(?:="([^"]*)")?(?=\\s|/?>)`),
    );
    return match ? (match[1] ?? "") : undefined;
  };
  const verifyMarkup = (html) => {
    const tag = (key) => {
      const element = [...html.matchAll(/<(?:img|video)\b[^>]*>/g)]
        .map((match) => match[0])
        .find((element) => element.includes(`data-test="${key}"`));
      assert(element, `Missing rendered fixture: ${key}`);
      return element;
    };
    const attr = (key, name) => attribute(tag(key), name);
    const description = mediaById.get("placeholderImage").description;
    for (const key of ["metadata", "metadata-url", "url", "query"])
      assert.equal(attr(key, "alt"), description, key);
    assert.equal(attr("override", "alt"), "Context-specific description");
    for (const key of ["empty", "decorative", "unknown"])
      assert.equal(attr(key, "alt"), "", key);
    assert.equal(
      attr("video", "aria-label"),
      mediaById.get("placeholderVideo").description,
    );
    assert.equal(
      attr("video-override", "aria-label"),
      "Context-specific video",
    );
    assert.equal(attr("video-empty", "aria-label"), "");
    assert.equal(attr("video-labelledby", "aria-label"), undefined);
    assert.equal(attr("video-labelledby", "aria-labelledby"), "video-caption");
    assert.equal(attr("video-hidden", "aria-label"), undefined);
    assert(!html.includes('data-test="hidden-image"'));
    assert(!html.includes('data-test="hidden-video"'));
  };
  verifyMarkup(html);
  const gallery = await fs.readFile("dist/media-review/index.html", "utf8");
  const verifyGallery = (gallery) => {
    const figures = [...gallery.matchAll(/<figure\b[\s\S]*?<\/figure>/g)]
      .map((match) => match[0])
      .filter((figure) =>
        attribute(figure.match(/<figure\b[^>]*>/)?.[0] ?? "", "class")
          ?.split(/\s+/)
          .includes("media-review_wrap"),
      );
    assert.equal(
      figures.length,
      files.filter((file) => file.startsWith("src/assets/graphics/")).length,
    );
    for (const figure of figures) {
      const name = figure.match(/class="media-review_name"[^>]*>([^<]+)</)?.[1];
      const id = attribute(
        figure.match(/<figure\b[^>]*>/)?.[0] ?? "",
        "data-media-id",
      );
      const metadata = mediaById.get(id);
      assert(metadata, name);
      if (name.endsWith(".mp4"))
        assert(figure.includes(`aria-label="${metadata.description}"`), name);
      else
        assert.equal(
          attribute(figure.match(/<img\b[^>]*>/)?.[0] ?? "", "alt"),
          metadata.decorative ? "" : metadata.description,
          name,
        );
    }
  };
  verifyGallery(gallery);
  if (process.env.MEDIA_TEST_DEV_URL) {
    const response = await fetch(
      new URL("/media-review", process.env.MEDIA_TEST_DEV_URL),
    );
    assert.equal(response.status, 200);
    verifyGallery(await response.text());
    console.log("Development gallery descriptions verified.");
  }
  const validFixture = await fs.readFile(fixture, "utf8");
  await fs.writeFile(
    fixture,
    validFixture.replace(
      /^---\n/,
      '---\nimport missingAsset from "@/assets/__missing-media-description-test.webp";\n',
    ) + '\n<Img src={missingAsset} alt="Build failure test" />\n',
  );
  await assert.rejects(build(), (error) =>
    /__missing-media-description-test\.webp/.test(error.stdout + error.stderr),
  );
  await fs.writeFile(fixture, validFixture);
  const unregistered = "src/assets/graphics/media-validation-test.webp";
  const sample = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#ceff65" },
  })
    .webp()
    .toBuffer();
  await fs.writeFile(unregistered, sample, { flag: "wx" });
  try {
    await assert.rejects(build(), (error) =>
      /media-validation-test\.webp: not registered/.test(
        error.stdout + error.stderr,
      ),
    );
  } finally {
    await fs.unlink(unregistered);
  }
  console.log(
    `Verified ${files.length} imported media records, all gallery items, stable IDs, URL lookups, explicit overrides, empty alt, decorative media, video labels, render=false and build rejection of missing imports and unregistered files.`,
  );
} finally {
  await fs.unlink(fixture);
  await build();
}
