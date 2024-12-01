import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots");
const BROWSER_WS_ENDPOINT = "ws://localhost:3000";

async function readFileContent(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (error) {
    console.error(`Error reading file from ${filePath}:`, error);
    throw error;
  }
}

async function htmlToImage(html, connect, useFirefox) {
  let browser;
  if (connect) {
    browser = await puppeteer.connect({
      browserWSEndpoint: BROWSER_WS_ENDPOINT,
    });
  } else if (useFirefox) {
    browser = await puppeteer.launch({ product: 'firefox' });
  } else {
    browser = await puppeteer.launch();
  }
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'load' });

  const content = await page.$("body");
  const imageBuffer = await content.screenshot();
  await browser.close();
  return imageBuffer;
}

async function runBenchmark(filePath, iterations, connect, useFirefox) {
  const html = await readFileContent(filePath);
  let totalTime = 0;
  const screenshotName = connect ? "puppeteer-connect.png" : useFirefox ? "puppeteer-firefox.png" : "puppeteer-launch.png";
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);

  if (connect) {
    console.log(`Running the benchmark using a launched browser at the following address: ${BROWSER_WS_ENDPOINT}…`)
  } else if (useFirefox) {
    console.log('Running the benchmark using Firefox…')
  } else {
    console.log('Running the benchmark using Chrome…')
  }

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const imageBuffer = await htmlToImage(html, connect, useFirefox);
    const endTime = performance.now();

    totalTime += (endTime - startTime);

    if (i === 0) {
      await fs.writeFile(screenshotPath, imageBuffer);
      console.log(`First screenshot saved at: ${screenshotPath}`);
    }
  }

  const averageTime = totalTime / iterations;
  console.log(`Average time for ${iterations} iterations: ${averageTime.toFixed(2)} ms`);
}

function printHelp() {
  console.log(`Usage: node puppeteer.js [options] <html-file-path>

Options:
  -c             Use Puppeteer connect mode (connect to an existing browser instance)
  -f             Use Firefox instead of Chromium
  -i <number>    Set the number of iterations (default: 100)
  -h, --help     Display this help message
  `);
}

(async () => {
  const args = process.argv.slice(2);
  const connect = args.includes("-c");
  const useFirefox = args.includes("-f");
  const help = args.includes("-h") || args.includes("--help");
  const filePath = args.find(arg => !arg.startsWith("-")) || null;
  const iterationsIndex = args.findIndex(arg => arg === "-i");
  const iterations = iterationsIndex !== -1 ? parseInt(args[iterationsIndex + 1], 10) : 100;

  if (help) {
    printHelp();
    process.exit(0);
  }

  if (!filePath) {
    console.error("Error: HTML file path is required.");
    printHelp();
    process.exit(1);
  }

  await runBenchmark(filePath, iterations, connect, useFirefox);
})();
