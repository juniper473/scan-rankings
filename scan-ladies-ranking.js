/**
 * scan-ladies-ranking.js
 *
 * INSTRUCTIONS FOLLOWED STRICTLY:
 * - Manual inputs: startPage, endPage, tierId
 * - Open pages ONLY via internal POST request
 * - Endpoint: /ajax/ranking/players.php
 * - Action: getRanking
 * - Loop pages from start → end (sequential)
 * - Each page has 20 ladies
 * - Collect per lady:
 *   1. Lady name
 *   2. Club name OR "no club"
 *   3. Level
 *   4. Experience
 * - Log EXACTLY one lady per console line
 * - Output intended for Google Sheets parsing
 */

module.exports = async function scanLadiesRanking(page) {

  // 🔧 MANUAL INPUTS (EDIT ONLY THESE)
  const startPage = 1;
  const endPage = 5;
  const tierId = 10;

  console.log(`START RANK SCAN | Pages ${startPage} → ${endPage} | Tier ${tierId}`);

  // Ensure correct origin for internal fetch
  await page.goto('https://v3.g.ladypopular.com', {
    waitUntil: 'domcontentloaded'
  });

  for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
    console.log(`PAGE ${currentPage}`);

    // 🔹 Internal request to open ranking page
    const response = await page.evaluate(
      async ({ pageNum, tierId }) => {
        const res = await fetch('/ajax/ranking/players.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          body: new URLSearchParams({
            action: 'getRanking',
            page: pageNum,
            tierId: tierId
          })
        });
        return res.json();
      },
      { pageNum: currentPage, tierId }
    );

    if (!response || response.status !== true || !response.html) {
      console.log(`FAILED PAGE ${currentPage}`);
      continue;
    }

    // 🔹 Parse returned HTML
    const ladies = await page.evaluate(html => {
      const container = document.createElement('div');
      container.innerHTML = html;

      const rows = container.querySelectorAll('tbody tr');
      const data = [];

      rows.forEach(row => {
        const nameEl = row.querySelector('.ranking-player-name a');
        const clubEl = row.querySelector('.ranking-player-guild');
        const levelEl = row.querySelector('td:nth-child(5)');
        const expEl = row.querySelector('td:nth-child(6)');

        if (!nameEl || !levelEl || !expEl) return;

        const name = nameEl.textContent.trim();
        const club =
          clubEl && clubEl.textContent.trim()
            ? clubEl.textContent.trim()
            : 'no club';
        const level = levelEl.textContent.trim();
        const experience = expEl.textContent.trim();

        data.push({ name, club, level, experience });
      });

      return data;
    }, response.html);

    // 🔹 EXACTLY one console log per lady
    ladies.forEach(lady => {
      console.log(
        `${lady.name} | ${lady.club} | Level ${lady.level} | EXP ${lady.experience}`
      );
    });

    // small delay for stability
    await page.waitForTimeout(300);
  }

  console.log('RANK SCAN COMPLETED');
};
