var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");

const maxRetries = 3;
const retryDelay = 1000; // Delay in milliseconds

// Global browser instance
let browser;

// Start the browser when the server starts
async function startBrowser() {
  if (browser) return; // If the browser is already started, do nothing
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// Call this function at server start
startBrowser();

// Function to create a new page, navigate to a URL, and fetch data
async function fetchWithNewPage(url, selector) {
  if (!browser) {
    console.log("No browser instance found, starting new browser.");
    await startBrowser();
  }

  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url);
    await page.waitForSelector(selector);
    const value = await page.$eval(selector, (el) => el.textContent);
    return value;
  } finally {
    await page.close();
  }
}

// Reusable function to handle fetching with retries
async function fetchDataWithRetries(url, selector) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchWithNewPage(url, selector);
    } catch (error) {
      console.error(`Error on attempt ${i + 1}:`, error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  throw new Error("Max retries reached");
}

// Router endpoints using the new fetch function
router.get("/", async (req, res, next) => {
  try {
    const value = await fetchDataWithRetries(
      process.env.DOLLAR_SOURCE,
      "#dolar > div > div > div.col-sm-6.col-xs-6.centrado > strong"
    );
    console.log("Valor dolar obtenido: ", value);
    res.send(value);
  } catch (error) {
    console.error("Error fetching dollar data:", error);
    res.status(500).send("Error fetching data");
  }
});

router.get("/paralelo", async (req, res, next) => {
  try {
    const value = await fetchDataWithRetries(
      process.env.PARALELO_SOURCE,
      "body > section > div > div.row.inicio > div.col.texto > h2"
    );
    const finalValue = value.replace("BS/USD", "");
    console.log("Paralelo valor obtenido: ", finalValue);
    res.send(finalValue);
  } catch (error) {
    console.error("Error fetching paralelo data:", error);
    res.status(500).send("Error fetching paralelo data");
  }
});

router.get("/euro", async (req, res, next) => {
  try {
    const value = await fetchDataWithRetries(
      process.env.EURO_SOURCE,
      "#euro > div > div > div.col-sm-6.col-xs-6.centrado > strong"
    );
    console.log("Valor euro obtenido: ", value);

    res.send(value);
  } catch (error) {
    console.error("Error fetching euro data:", error);
    res.status(500).send("Error fetching euro data");
  }
});

module.exports = router;
