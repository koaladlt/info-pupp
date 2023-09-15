var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');

let browser;
let page;

// Initialize Puppeteer, create a single page instance, and block unnecessary resources
async function initializePuppeteer() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath:
      process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  page = await browser.newPage();

  // Block unnecessary resources
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (
      ['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto(process.env.DOLLAR_SOURCE); // Assuming DOLLAR_SOURCE and EURO_SOURCE are the same
}

initializePuppeteer();

async function fetchData(selector) {
  const value = await page.$eval(selector, (element) => element.textContent);
  return value;
}

router.get('/', async (req, res, next) => {
  try {
    const value = await fetchData(
      '#dolar > div > div > div.col-sm-6.col-xs-6.centrado > strong'
    );
    console.log({ value });
    res.send(value);
  } catch (error) {
    console.error('Error fetching dollar data:', error);
    res.status(500).send('Error fetching data');
  }
});

router.get('/euro', async (req, res, next) => {
  try {
    const value = await fetchData(
      '#euro > div > div > div.col-sm-6.col-xs-6.centrado > strong'
    );
    console.log(value);
    res.send(value);
  } catch (error) {
    console.error('Error fetching euro data:', error);
    res.status(500).send('Error fetching data');
  }
});

module.exports = router;
