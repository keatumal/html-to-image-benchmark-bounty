import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const SCREENSHOTS_DIR = path.resolve("./screenshots");
const TMP_DIR = "/tmp";

async function runWkhtmltoimage(htmlFilePath, outputFilePath) {
  return new Promise((resolve, reject) => {
    exec(`wkhtmltoimage ${htmlFilePath} ${outputFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing wkhtmltoimage: ${stderr}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function runBenchmark(filePath, iterations) {
  const screenshotName = "wkhtmltoimage.png";
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  let totalTime = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const outputPath = i === 0 ? screenshotPath : path.join(TMP_DIR, `wkhtmltoimage-output-${i}.png`);
    await runWkhtmltoimage(filePath, outputPath);
    const endTime = performance.now();

    totalTime += (endTime - startTime);

    if (i === 0) {
      console.log(`First screenshot saved at: ${screenshotPath}`);
    } else {
      await fs.unlink(outputPath);
    }
  }

  const averageTime = totalTime / iterations;
  console.log(`Average time for ${iterations} iterations: ${averageTime.toFixed(2)} ms`);
}

function printHelp() {
  console.log(`Usage: node wkhtml.js [options] <html-file-path>

Options:
  -i <number>    Set the number of iterations (default: 100)
  -h, --help     Display this help message
  `);
}

(async () => {
  const args = process.argv.slice(2);
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

  await runBenchmark(filePath, iterations);
})();
