import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "screenshots");
const url = process.env.SHOT_URL || "http://127.0.0.1:8765/?v=shots";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "laptop-1280", width: 1280, height: 800, mobile: false },
  { name: "tablet-1024", width: 1024, height: 768, mobile: false },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
];

const combos = [
  {
    name: "hero-hang-ticker",
    selectors: [".hero", ".hang-card", ".ticker"],
  },
  {
    name: "sobre-medos",
    selectors: ["#sobre", ".fears"],
  },
  {
    name: "metodo",
    selectors: [".method"],
  },
  {
    name: "atendimentos",
    selectors: ["#atendimento"],
  },
  {
    name: "diferenciais-depoimentos",
    selectors: [".diffs", ".quotes"],
  },
  {
    name: "faq-contato-cta",
    selectors: [".faq", ".contact", ".final-cta", ".footer"],
  },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function preparePage(page) {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    for (const img of imgs) {
      img.loading = "eager";
      img.removeAttribute("loading");
      if (!img.complete || img.naturalWidth === 0) {
        const src = img.currentSrc || img.src;
        if (src) {
          img.src = src;
        }
      }
    }

    const total = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const step = Math.max(300, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, total);
    await new Promise((r) => setTimeout(r, 120));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 120));

    await Promise.all(
      Array.from(document.images).map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 8000);
        });
      })
    );

    await Promise.all(
      Array.from(document.images).map((img) =>
        img.decode ? img.decode().catch(() => {}) : Promise.resolve()
      )
    );
  });

  const status = await page.evaluate(() => {
    const imgs = Array.from(document.images);
    const loaded = imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
    const failed = imgs
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src);
    return { total: imgs.length, loaded, failed };
  });

  console.log(
    `  images ${status.loaded}/${status.total}` +
      (status.failed.length ? ` failed=${status.failed.length}` : "")
  );
  if (status.failed.length) {
    console.warn("  missing:", status.failed.slice(0, 5));
  }
}

async function captureRegion(page, selectors, filePath) {
  await page.evaluate((sels) => {
    const first = sels.map((s) => document.querySelector(s)).find(Boolean);
    if (first) first.scrollIntoView({ block: "start" });
  }, selectors);
  await new Promise((r) => setTimeout(r, 200));

  const box = await page.evaluate((sels) => {
    const nodes = sels.map((s) => document.querySelector(s)).filter(Boolean);
    if (!nodes.length) return null;
    const pad = 12;
    let top = Infinity;
    let left = Infinity;
    let bottom = -Infinity;
    let right = -Infinity;
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      const y = r.top + window.scrollY;
      const x = r.left + window.scrollX;
      top = Math.min(top, y);
      left = Math.min(left, x);
      bottom = Math.max(bottom, y + r.height);
      right = Math.max(right, x + r.width);
    }
    const width = Math.ceil(right - left);
    const height = Math.ceil(bottom - top);
    return {
      x: Math.max(0, Math.floor(left - pad)),
      y: Math.max(0, Math.floor(top - pad)),
      width: Math.min(document.documentElement.scrollWidth, width + pad * 2),
      height: height + pad * 2,
    };
  }, selectors);

  if (!box || box.width < 40 || box.height < 40) {
    console.warn(`  skip combo (empty): ${path.basename(filePath)}`);
    return false;
  }

  await page.screenshot({
    path: filePath,
    type: "png",
    clip: box,
    captureBeyondViewport: true,
  });
  return true;
}

async function main() {
  await ensureDir(outDir);
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(90000);

  const index = [];

  for (const vp of viewports) {
    console.log(`\n→ ${vp.name} (${vp.width}×${vp.height})`);
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    await page.goto(url, { waitUntil: ["load", "networkidle0"] });
    await preparePage(page);

    const fullName = `full-${vp.name}.png`;
    await page.screenshot({
      path: path.join(outDir, fullName),
      type: "png",
      fullPage: true,
    });
    index.push({ type: "full", viewport: vp.name, file: fullName });
    console.log(`  saved ${fullName}`);

    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 150));
    const heroName = `viewport-hero-${vp.name}.png`;
    await page.screenshot({
      path: path.join(outDir, heroName),
      type: "png",
      fullPage: false,
    });
    index.push({ type: "viewport", viewport: vp.name, file: heroName });
    console.log(`  saved ${heroName}`);

    for (const combo of combos) {
      const file = `combo-${combo.name}-${vp.name}.png`;
      const ok = await captureRegion(
        page,
        combo.selectors,
        path.join(outDir, file)
      );
      if (ok) {
        index.push({
          type: "combo",
          combo: combo.name,
          viewport: vp.name,
          file,
        });
        console.log(`  saved ${file}`);
      }
    }
  }

  await fs.writeFile(
    path.join(outDir, "index.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), url, items: index },
      null,
      2
    ),
    "utf8"
  );

  const md = [
    "# Screenshots - Dra. Viviane Verônica",
    "",
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    `URL: ${url}`,
    "",
    "Captura força o carregamento de imagens (`loading=lazy`) e mantém o visual real do site.",
    "",
    "## Página completa",
    "",
    ...viewports.map(
      (vp) => `- \`full-${vp.name}.png\` - ${vp.width}×${vp.height}`
    ),
    "",
    "## Primeiro viewport (hero)",
    "",
    ...viewports.map((vp) => `- \`viewport-hero-${vp.name}.png\``),
    "",
    "## Combinações de seções",
    "",
    ...combos.flatMap((c) => [
      `### ${c.name}`,
      ...viewports.map((vp) => `- \`combo-${c.name}-${vp.name}.png\``),
      "",
    ]),
  ].join("\n");

  await fs.writeFile(path.join(outDir, "README.md"), md, "utf8");
  await browser.close();
  console.log(`\nDone. ${index.length} arquivos em ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
