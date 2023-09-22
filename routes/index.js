const maxRetries = 3;
const retryDelay = 1000;

async function retryFetchData(selector) {
  for (let i = 0; i < maxRetries; i++) {
    try {
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
    res.send(value);
  } catch (error) {
    console.error("Error fetching euro data:", error);
    res.status(500).send("Error fetching data");
  }
});
