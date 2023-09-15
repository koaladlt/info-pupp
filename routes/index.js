var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');

let browser;

// Initialize Puppeteer when the server starts
async function initializePuppeteer() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath:
      process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
}

initializePuppeteer();

async function fetchData(url, selector) {
  const page = await browser.newPage();
  await page.goto(url, { timeout: 60000 });
  const value = await page.$eval(selector, (element) => element.textContent);
  await page.close();
  return value;
}

router.get('/', async (req, res, next) => {
  try {
    const value = await fetchData(
      process.env.DOLLAR_SOURCE,
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
      process.env.EURO_SOURCE,
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
