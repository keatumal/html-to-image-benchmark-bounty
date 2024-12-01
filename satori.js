import { promises as fs } from "fs";
import satori from "satori";
import { html } from "satori-html";
import { performance } from "perf_hooks";
import process from "process";

const SCREENSHOTS_DIR = "./screenshots";
const FONTS_DIR = "./fonts";

async function benchmark(htmlPath, iterations) {
  const htmlContent = await fs.readFile(htmlPath, "utf-8");
  const template = html(htmlContent);
  const fontData = await fs.readFile(`${FONTS_DIR}/Montserrat-Regular.ttf`);

  let totalTime = 0;
  let svg;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    svg = await satori(template, {
      width: 800,
      height: 1200,
      fonts: [
        {
          name: "Montserrat",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    });
    const end = performance.now();
    totalTime += end - start;
  }

  if (svg && iterations > 0) {
    const screenshotPath = `${SCREENSHOTS_DIR}/satori.svg`;
    console.log(`Screenshot saved at: ${screenshotPath}`);
    await fs.writeFile(screenshotPath, svg);
  }

  console.log(`Average rendering time: ${(totalTime / iterations).toFixed(2)} ms`);
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node satori.js [-i iterations] <html-file-path>");
  process.exit(1);
}

let iterations = 100;

const iterationIndex = args.indexOf("-i");
let htmlPath;
if (iterationIndex !== -1 && args[iterationIndex + 1]) {
  iterations = parseInt(args[iterationIndex + 1], 10);
  htmlPath = args[iterationIndex + 2];
} else {
  htmlPath = args[0];
  if (isNaN(iterations) || iterations <= 0) {
    console.error("Iterations must be a positive number");
    process.exit(1);
  }
}

console.log(`Running a benchmark with ${iterations} iterations…`)
benchmark(htmlPath, iterations).catch(console.error);
