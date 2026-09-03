import { existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(
  process.env.PDF_OUTPUT || join(projectRoot, "assets", "Serhii_Cherevatin_Full_Stack_Engineer.pdf"),
);

const browserCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const browserPath = browserCandidates.find(existsSync);
if (!browserPath) {
  throw new Error("Chrome or Chromium was not found. Set CHROME_PATH to its executable.");
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const requestedPath = resolve(projectRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
    const isInsideProject = requestedPath === projectRoot || requestedPath.startsWith(`${projectRoot}${sep}`);

    if (!isInsideProject) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const content = await readFile(requestedPath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(requestedPath)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const address = server.address();
const pageUrl = `http://127.0.0.1:${address.port}/index.html`;
mkdirSync(dirname(outputPath), { recursive: true });

const browserArgs = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-pdf-header-footer",
  "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=3000",
  `--print-to-pdf=${outputPath}`,
  pageUrl,
];

if (process.env.CI) {
  browserArgs.unshift("--no-sandbox");
}

try {
  await new Promise((resolveBrowser, rejectBrowser) => {
    const browser = spawn(browserPath, browserArgs, { stdio: ["ignore", "ignore", "pipe"] });
    let errors = "";

    browser.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    browser.on("error", rejectBrowser);
    browser.on("exit", (code) => {
      if (code === 0) resolveBrowser();
      else rejectBrowser(new Error(`PDF generation failed with exit code ${code}.\n${errors}`));
    });
  });
} finally {
  await new Promise((resolveClosed) => server.close(resolveClosed));
}

if (!existsSync(outputPath) || statSync(outputPath).size === 0) {
  throw new Error(`Chrome did not create a PDF at ${outputPath}.`);
}

console.log(`Generated ${outputPath}`);
