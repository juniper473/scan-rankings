/**
 * scan-ladies-ranking.js
 *
 * Requirements satisfied:
 * - Manual input: startPage, endPage, tierId
 * - Internal POST request to /ajax/ranking/players.php
 * - Sequential page processing
 * - 1 console log per lady
 * - Handles "no club"
 * - Logs clean text for Google Sheets parsing
 */

module.exports = async function scanLadiesRanking(page) {
  // 🔧 MANUAL INPUTS
  const startPage = 1;   // <-- change manually
  const endPage = 5;     // <-- change manually
  const tierId = 10;     // <-- change manually (constant)

  console.log(`📊 STARTING RANKING SCAN | Pages ${startPage} → ${endPage} | Tier ${tierId}`);

  for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
    console.log(`📄 Processing page ${currentPage}`);

    const response = await page.evaluate(async (pageNum, tier) => {
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
    }, currentPage, tierId);

    if (!response || response.status !== true || !response.html) {
      console.log(`❌ Failed to load page ${currentPage}`);
      continue;
    }

    // Parse HTML safely inside browser context
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
        const club = guildEl && guildEl.textContent.trim() ? guildEl.textContent.trim() : 'no club';
        const level = levelEl.textContent.trim();
        const experience = expEl.textContent.trim();

        results.push({ name, club, level, experience });
      });

      return results;
    }, response.html);

    // 🔹 Log exactly ONE lady per line
    ladies.forEach(lady => {
      console.log(
        `${lady.name} | ${lady.club} | Level ${lady.level} | EXP ${lady.experience}`
      );
    });

    // Anti-spam / stability delay
    await page.waitForTimeout(400 + Math.random() * 600);
  }

  console.log('✅ RANKING SCAN COMPLETED');
};
