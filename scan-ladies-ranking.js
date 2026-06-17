module.exports = async function scanLadiesRanking(page) {

  // 🔧 MANUAL INPUTS
  const startPage = 1;
  const endPage = 5;
  const tierId = 10;

  console.log(`START RANK SCAN | Pages ${startPage} → ${endPage} | Tier ${tierId}`);

  // establish origin + session
  await page.goto('https://v3.g.ladypopular.com', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
    console.log(`PAGE ${currentPage}`);

    const ladies = await page.evaluate(
      async ({ currentPage, tierId }) => {

        const res = await fetch('/ajax/ranking/players.php', {
          method: 'POST',
          body: new URLSearchParams({
            action: 'getRanking',
            page: currentPage.toString(),
            tierId: tierId.toString()
          }),
          credentials: 'same-origin'
        });

        const data = await res.json();
        if (!data.html) return [];

        const container = document.createElement('div');
        container.innerHTML = data.html;

        const rows = container.querySelectorAll('tbody tr');
        const results = [];

        rows.forEach(row => {
          const nameEl = row.querySelector('.ranking-player-name a');
          const clubEl = row.querySelector('.ranking-player-guild .player-guild-logo-name');
          const stats = row.querySelectorAll('.ranking-player-stat');

          if (!nameEl || stats.length < 2) return;

          results.push({
            name: nameEl.textContent.trim(),
            club: clubEl?.textContent.trim() || 'no club',
            level: stats[0].textContent.trim(),
            exp: stats[1].textContent.trim()
          });
        });

        return results;
      },
      { currentPage, tierId }
    );

    if (!ladies.length) {
      console.log(`⚠️ No ladies found on page ${currentPage}`);
      continue;
    }

    // EXACTLY one log per lady
    ladies.forEach(l => {
      console.log(
        `${l.name} | ${l.club} | Level ${l.level} | EXP ${l.exp}`
      );
    });

    await page.waitForTimeout(700);
  }

  console.log('RANK SCAN COMPLETED');
};
