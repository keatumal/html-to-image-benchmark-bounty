import { promises as fs } from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const SCREENSHOTS_DIR = path.resolve("./screenshots");
const TMP_DIR = "/tmp";
const SCREENSHOTONE_API_KEY = process.env.SCREENSHOTONE_API_KEY;

if (!SCREENSHOTONE_API_KEY) {
  console.error("Error: SCREENSHOTONE_API_KEY is not defined in the .env file.");
  process.exit(1);
}

async function runScreenshotOne(htmlContent, outputFilePath, responseType) {
  const apiUrl = `https://api.screenshotone.com/take`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": SCREENSHOTONE_API_KEY,
    },
    body: JSON.stringify({
      html: htmlContent,
      format: "png",
      response_type: responseType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching screenshot: ${response.statusText}`);
  }

  if (responseType !== "empty") {
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputFilePath, buffer);
  }
}

async function runBenchmark(filePath, iterations, responseType) {
  const screenshotName = "screenshotone.png";
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  let totalTime = 0;

  const htmlContent = await fs.readFile(filePath, "utf8");

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const outputPath = i === 0 ? screenshotPath : path.join(TMP_DIR, `screenshotone-output-${i}.png`);
    try {
      await runScreenshotOne(htmlContent, outputPath, responseType);
    } catch (error) {
      console.error(`Error during screenshot capture: ${error.message}`);
      continue;
    }
    const endTime = performance.now();

    totalTime += (endTime - startTime);

    if (i === 0 && responseType !== "empty") {
      console.log(`First screenshot saved at: ${screenshotPath}`);
    } else if (responseType !== "empty") {
      await fs.unlink(outputPath);
    }
  }

  const averageTime = totalTime / iterations;
  console.log(`Average time for ${iterations} iterations: ${averageTime.toFixed(2)} ms`);
}

function printHelp() {
  console.log(`Usage: node benchmark-screenshotone.js [options] <html-file-path>

Options:
  -i <number>    Set the number of iterations (default: 100)
  -e             Use response_type=empty to skip downloading the actual screenshot
  -h, --help     Display this help message
  `);
}

(async () => {
  const args = process.argv.slice(2);
  const help = args.includes("-h") || args.includes("--help");
  const emptyResponse = args.includes("-e");

  let iterations = 100;
  let filePath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-i" && i + 1 < args.length) {
      iterations = parseInt(args[i + 1], 10);
      i++; // Skip the next argument as it is the value for -i
    } else if (!args[i].startsWith("-")) {
      filePath = args[i];
    }
  }

  if (help) {
    printHelp();
    process.exit(0);
  }

  if (!filePath) {
    console.error("Error: HTML file path is required.");
    printHelp();
    process.exit(1);
  }

  if (!emptyResponse) {
    console.log(`Testing with ${iterations} iterations and image loading…`)
  } else {
    console.log(`Testing with ${iterations} iterations without loading the image…`)
  }

  const responseType = emptyResponse ? "empty" : "by_format";
  await runBenchmark(filePath, iterations, responseType);
})();
