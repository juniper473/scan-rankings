// fetch-ranking.js
module.exports = async function runFetchRanking(page) {

  // 🔧 CONFIG — EDIT ONLY THIS SECTION
  const tierConfigs = [
    { tierId: 10, startPage: 1, endPage: 5 },
    //{ tierId: 2, startPage: 1, endPage: 50 },
    //{ tierId: 3, startPage: 1, endPage: 50 },
  ];

  const PAGE_DELAY = 700;

  // CSV HEADER
  console.log('rank,playerId,name,level,xp,club');

  for (const { tierId, startPage, endPage } of tierConfigs) {

    console.log(`\n📊 Fetching Tier ${tierId}`);

    for (let currentPage = startPage; currentPage <= endPage; currentPage++) {

      const rows = await page.evaluate(
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

          const results = [];
          const trs = container.querySelectorAll('tbody tr[id^="num"]');

          trs.forEach(tr => {
            const rank =
              tr.querySelector('.ranking-player-rank')?.textContent.trim();
            const nameEl =
              tr.querySelector('.ranking-player-name a');

            if (!rank || !nameEl) return;

            const name = nameEl.textContent.trim();

            const href = nameEl.getAttribute('href') || '';
            const idMatch = href.match(/profile\/(\d+)/);
            const playerId = idMatch ? idMatch[1] : '';

            const level =
              tr.querySelector('.ranking-player-level')?.textContent.trim() || '';

            const xp =
              tr.querySelector('.ranking-player-xp')
                ?.textContent.replace(/[^\d]/g, '') || '';

            const club =
              tr.querySelector('.ranking-player-guild .player-guild-logo-name')
                ?.textContent.trim() || '';

            results.push({
              rank,
              playerId,
              name,
              level,
              xp,
              club
            });
          });

          return results;
        },
        { currentPage, tierId }
      );

      if (!rows.length) {
        console.warn(`⚠️ No rows on page ${currentPage}, tier ${tierId}`);
      }

      for (const r of rows) {
        console.log(
          `${r.rank},${r.playerId},"${r.name.replace(/"/g,'""')}",${r.level},${r.xp},"${r.club.replace(/"/g,'""')}"`
        );
      }

      await page.waitForTimeout(PAGE_DELAY);
    }
  }

  console.log('✅ RANKING FETCH COMPLETED');
};
