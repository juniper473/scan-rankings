/**
 * scan-ladies-ranking.js
 *
 * - Manual inputs: startPage, endPage, tierId
 * - Internal POST request to /ajax/ranking/players.php
 * - Sequential page scanning
 * - 1 console log per lady
 * - Handles "no club"
 * - Console output ready for Google Sheets parsing
 */

module.exports = async function scanLadiesRanking(page) {
  // 🔧 MANUAL INPUTS (EDIT THESE)
  const startPage = 1;   // starting ranking page
  const endPage = 5;     // ending ranking page
  const tierId = 10;     // tier ID (constant)

  console.log(
    `📊 STARTING RANKING SCAN | Pages ${startPage} → ${endPage} | Tier ${tierId}`
  );

  // Ensure proper origin for fetch()
  await page.goto('https://v3.g.ladypopular.com', {
    waitUntil: 'domcontentloaded'
  });

  for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
    console.log(`📄 Processing page ${currentPage}`);

    // 🔹 Fetch ranking data (Playwright-safe argument passing)
    const response = await page.evaluate(
      async ({ pageNum, tier }) => {
        const res = await fetch('/ajax/ranking/players.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: new URLSearchParams({
            action: 'getRanking',
            page: pageNum,
            tierId: tier
          })
        });

        return res.json();
      },
      { pageNum: currentPage, tier: tierId }
    );

    if (!response || response.status !== true || !response.html) {
      console.log(`❌ Failed to load ranking page ${currentPage}`);
      continue;
    }

    // 🔹 Parse ranking HTML inside browser context
    const ladies = await page.evaluate((html) => {
      const container = document.createElement('div');
      container.innerHTML = html;

      const rows = container.querySelectorAll('tbody tr');
      const results = [];

      rows.forEach(row => {
        const nameEl = row.querySelector('.ranking-player-name a');
        const guildEl = row.querySelector('.ranking-player-guild');
        const levelEl = row.querySelector('td:nth-child(5)');
        const expEl = row.querySelector('td:nth-child(6)');

        if (!nameEl || !levelEl || !expEl) return;

        const name = nameEl.textContent.trim();
        const club =
          guildEl && guildEl.textContent.trim()
            ? guildEl.textContent.trim()
            : 'no club';
        const level = levelEl.textContent.trim();
        const experience = expEl.textContent.trim();

        results.push({ name, club, level, experience });
      });

      return results;
    }, response.html);

    // 🔹 Log ONE lady per line (Google Sheets friendly)
    ladies.forEach(lady => {
      console.log(
        `${lady.name} | ${lady.club} | Level ${lady.level} | EXP ${lady.experience}`
      );
    });

    // Small delay for stability / anti-spam
    await page.waitForTimeout(400 + Math.random() * 600);
  }

  console.log('✅ RANKING SCAN COMPLETED');
};
