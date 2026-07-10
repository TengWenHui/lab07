import { Builder, By, until } from 'selenium-webdriver';
import assert from 'assert';

// Get the argument (default to 'local' if not provided)
const environment = process.argv[2] || 'local';

// URLs based on environment
const seleniumUrl = environment === 'github'
  ? 'http://selenium:4444/wd/hub'
  : 'http://localhost:4444/wd/hub';

// Start the Node.js server before running the test locally.
// Chrome runs inside Docker, so it reaches the Windows host through
// host.docker.internal rather than localhost.
const serverUrl = environment === 'github'
  ? 'http://testserver:3000'
  : 'http://host.docker.internal:3000';

console.log(`Running tests in '${environment}' environment`);
console.log(`Selenium URL: ${seleniumUrl}`);
console.log(`Server URL: ${serverUrl}`);

(async function testTimestamp() {
  console.log('before driver init');

  const driver = await new Builder()
    .forBrowser('chrome')
    .usingServer(seleniumUrl)
    .build();

  try {
    console.log('after driver init');

    await driver.get(serverUrl);

    console.log('after driver.get serverUrl');

    const timestampElement = await driver.wait(
      until.elementLocated(By.id('timestamp')),
      5000
    );

    const timestampText = await timestampElement.getText();
    console.log(`Timestamp: ${timestampText}`);

    const timestampMatch = timestampText.match(/Server timestamp:\s*(.*)/);
    assert.ok(timestampMatch, 'Timestamp text does not match expected format');

    const extractedTimestamp = timestampMatch[1];

    const timestampRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    assert.match(
      extractedTimestamp,
      timestampRegex,
      'Timestamp format is invalid'
    );

    console.log('Timestamp format is valid.');
  } catch (err) {
    console.error('Test failed:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})();
