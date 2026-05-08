require('dotenv').config();
const { chromium } = require('playwright');

// ⬇️ Import all sub-scripts (exported as functions)..
const DIVIDER = '────────────────────────────────────────────────────────────────────────────────';
const runBurnEnergy = require('./burn-energy.js');
const runFashionMagazine = require('./fashion-magazine.js');
const runTeleportEvent = require('./tele.js');
const runMapsEvent = require('./maps.js');
const runSlotsEvent = require('./Slots.js');
const runMemoryEvent = require('./memory.js');
const runFurnitureScript = require('./furniture.js');
const runDailyTasks = require('./daily-tasks.js');
const runBoyfriendKiss = require('./bfk.js');
const runGuildShow = require('./guild-show.js');
const runPetTraining = require('./pet-train.js');
const runBridesmaids = require('./bridesmaids.js');

const scripts = [
  { name: 'Burn Energy', fn: runBurnEnergy, alwaysRun: true },
  { name: 'Fashion Magazine', fn: runFashionMagazine, envKey: 'LP_FASHION_MAGAZINE_URL' },
  { name: 'Tele Event', fn: runTeleportEvent, envKey: 'LP_TELEPORT_URL' },
  { name: 'Maps Event', fn: runMapsEvent, envKey: 'LP_MAPS_URL' },
  { name: 'Slots Event', fn: runSlotsEvent, envKey: 'LP_SLOTS_URL' },
  { name: 'Memory Event', fn: runMemoryEvent, envKey: 'LP_MEMORY_URL' },
  { name: 'Furniture Script', fn: runFurnitureScript, alwaysRun: true },
  { name: 'Daily Tasks', fn: runDailyTasks, alwaysRun: true },
  { name: 'Boyfriend Kiss', fn: runBoyfriendKiss, alwaysRun: true },
  { name: 'Guild Show', fn: runGuildShow, alwaysRun: true },
  { name: 'Pet Training', fn: runPetTraining, alwaysRun: false },
  { name: 'Bridesmaids Tasks', fn: runBridesmaids, alwaysRun: true },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.LP_EMAIL;
  const password = process.env.LP_PASSWORD;

  // ✅ LOGIN
  let loginSuccess = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`🔐 [Attempt ${attempt}] Opening Lady Popular login page...`);
      await page.goto('https://ladypopular.com', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      console.log("🔎 Waiting for Sign In button...");
      await page.waitForSelector('#login-btn', { timeout: 30000 });
      await page.waitForTimeout(5000);
      await page.click('#login-btn');

      console.log("🔐 Entering credentials...");
      await page.waitForSelector('#login-username-field', { timeout: 10000 });
      await page.fill('#login-username-field', email);
      await page.fill('#loginForm3 > div > label:nth-child(2) > input[type=password]', password);
      await page.waitForTimeout(5000);
      await page.click('#loginSubmit');

      await page.waitForSelector('#header', { timeout: 15000 });
      console.log("🎉 Login successful.");
      loginSuccess = true;
      break;
    } catch (error) {
      console.log(`❌ Login attempt ${attempt} failed: ${error.message}`);
      await page.screenshot({ path: `login-error-${attempt}.png`, fullPage: true });

      if (attempt === 5) {
        console.log("🚫 Max login attempts reached. Aborting.");
        await browser.close();
        return;
      }
    }
  }

  // ✅ RUN EACH SCRIPT
  for (const script of scripts) {
    const shouldRun =
      script.alwaysRun || (process.env[script.envKey] && process.env[script.envKey] !== 'OFF');

    if (!shouldRun) {
      console.log(`⏭️ ${script.name} skipped (not active or URL = OFF)`);
      continue;
    }

    console.log(`\n🚀 Starting: ${script.name}`);
    try {
      await script.fn(page); // Call the script function with shared page
      console.log(`✅ ${script.name} finished successfully.`);
      console.log(DIVIDER);
    } catch (err) {
      console.log(`❌ ${script.name} failed: ${err.message}`);
      await page.screenshot({ path: `${script.name.replace(/\s+/g, '_')}-error.png`, fullPage: true });
      console.log(DIVIDER);
    }
  }

  await browser.close();
  console.log(`\n🎉 All scripts done. Browser closed.`);
})();








