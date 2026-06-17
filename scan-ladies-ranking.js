module.exports = async function scanLadiesRanking(page) {
  // 🔧 MANUAL INPUTS
  const startPage = 1;   // <-- YOU SET THIS
  const endPage = 5;    // <-- YOU SET THIS
  const tierId = 10;     // <-- YOU SET THIS

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    console.log(`📄 Fetching ranking page ${pageNum} (Tier ${tierId})`);

    // STEP 1: REQUEST
    const response = await page.evaluate(async ({ pageNum, tierId }) => {
      const body = new URLSearchParams();
      body.append('action', 'getRanking');
      body.append('page', pageNum);
      body.append('tierId', tierId);

      const res = await fetch('/ajax/ranking/players.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
        credentials: 'same-origin',
      });

      return res.json();
    }, { pageNum, tierId });

    // LOG FULL RESPONSE (OPTIONAL DEBUG)
    console.log(`----- RAW RESPONSE PAGE ${pageNum} -----`);
    console.log(response);

    if (!response || response.status !== 1 || !response.html) {
      console.log(`⚠️ Page ${pageNum} failed or empty. Continuing.`);
      continue;
    }

    // STEP 2: PARSE HTML
    const ladies = await page.evaluate((html) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;

      const rows = wrapper.querySelectorAll('tr[id^="num"]');
      const results = [];

      rows.forEach((tr) => {
        const name =
          tr.querySelector('.player-avatar-name')?.textContent.trim() || null;

        const club =
          tr.querySelector('.player-guild-logo-name')?.textContent.trim() || null;

        const stats = tr.querySelectorAll('.ranking-player-stat');
        const level = stats[0]?.textContent.trim() || null;

        const expRaw = stats[1]?.textContent || null;
        const experience = expRaw
          ? Number(expRaw.replace(/,/g, ''))
          : null;

        results.push({ name, club, level, experience });
      });

      return results;
    }, response.html);

    // LOG RESULTS
    console.log(`===== PAGE ${pageNum} RESULTS (${ladies.length}) =====`);
    ladies.forEach((lady) => {
      console.log(
        `${lady.name} | ${lady.club} | ${lady.level} | ${lady.experience}`
      );
    });

    // SMALL DELAY (SAFE)
    await page.waitForTimeout(300);
  }

  console.log(
    `🎉 Finished scanning pages ${startPage} → ${endPage} for tier ${tierId}`
  );
};
