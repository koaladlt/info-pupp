var express = require("express");
var router = express.Router();
const puppeteer = require("puppeteer");

let browser;
let page;

const maxRetries = 3;
const retryDelay = 1000; // Delay in milliseconds

// Initialize Puppeteer, create a single page instance, and block unnecessary resources
async function initializePuppeteer() {
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });

    page = await browser.newPage();

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        ["image", "stylesheet", "font", "media"].includes(
          request.resourceType()
        )
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(process.env.DOLLAR_SOURCE);
  } catch (error) {
    console.error("Error initializing Puppeteer:", error);
  }
}

initializePuppeteer();

async function fetchData(selector) {
  const value = await page.$eval(selector, (element) => element.textContent);
  return value;
}

async function retryFetchData(selector) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!page) {
        console.log("Reinitializing Puppeteer");
        await initializePuppeteer();
      }
      return await fetchData(selector);
    } catch (error) {
      console.error(`Error fetching data (Attempt ${i + 1}):`, error);
      if (i < maxRetries - 1) {
        // If not the last attempt, wait for a while before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }
  throw new Error("Max retries reached");
}

router.get("/", async (req, res, next) => {
  try {
    const value = await retryFetchData(
      "#dolar > div > div > div.col-sm-6.col-xs-6.centrado > strong"
    );
    console.log("Valor dolar obtenido: ", value);
    res.send(value);
  } catch (error) {
    console.error("Error fetching dollar data:", error);
    res.status(500).send("Error fetching data");
  }
});

router.get("/euro", async (req, res, next) => {
  try {
    const value = await retryFetchData(
      "#euro > div > div > div.col-sm-6.col-xs-6.centrado > strong"
    );
    console.log("Valor euro obtenido: ", value);
    res.send(value);
  } catch (error) {
    console.error("Error fetching euro data:", error);
    res.status(500).send("Error fetching data");
  }
});

module.exports = router;
