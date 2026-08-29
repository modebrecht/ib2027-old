const { test, expect } = require('@playwright/test');

const BASE_URL = (process.env.BASE_URL || 'https://ib2026.vercel.app').replace(/\/$/, '');
const SCORE_TOTALS = { A4: 16, A8: 15, A9: 12, A10: 10, A11: 5, A12: 12, A14: 14 };
const WRITING_PAGES = ['A2', 'A3', 'A5', 'A13'];

async function openClean(page, code) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('studentVorname', 'E2E Persist');
    localStorage.setItem('student_vorname', 'E2E Persist');
  });
  await page.goto(`${BASE_URL}/hw/${code}.html`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toBeVisible();
}

async function storageSnapshot(page) {
  return page.evaluate(() => Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => {
    const key = localStorage.key(i);
    return [key, localStorage.getItem(key)];
  })));
}

async function fillEveryPersistableControl(page, code) {
  return page.evaluate((pageCode) => {
    const excludedTypes = new Set(['hidden', 'button', 'submit', 'reset', 'file', 'image']);
    const controls = Array.from(document.querySelectorAll('input[id], textarea[id], select[id]'))
      .filter((el) => !el.readOnly && !el.disabled && !excludedTypes.has((el.type || '').toLowerCase()))
      .filter((el) => !/^student(Name|Class|Date)$/i.test(el.id));

    if (!controls.length) throw new Error(`${pageCode}: no persistable controls discovered`);

    const seenRadioGroups = new Set();
    for (let i = 0; i < controls.length; i += 1) {
      const el = controls[i];
      const type = (el.type || '').toLowerCase();
      if (type === 'checkbox') {
        el.checked = !el.checked;
      } else if (type === 'radio') {
        const group = el.name || el.id;
        if (!seenRadioGroups.has(group)) {
          seenRadioGroups.add(group);
          el.checked = true;
        } else {
          el.checked = false;
        }
      } else if (el.tagName === 'SELECT') {
        const option = Array.from(el.options).find((o) => !o.disabled && o.value !== '');
        if (option) el.value = option.value;
      } else if (type === 'range' || type === 'number') {
        const min = Number(el.min);
        const max = Number(el.max);
        const current = Number(el.value);
        let next = Number.isFinite(max) && max !== current ? max : (Number.isFinite(min) ? min + 1 : current + 1);
        if (!Number.isFinite(next)) next = 1;
        el.value = String(next);
      } else {
        el.value = `E2E_PERSIST_${pageCode}_${el.id}_${i + 1}`;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    return controls.map((el) => ({
      id: el.id,
      type: (el.type || el.tagName).toLowerCase(),
      value: el.value,
      checked: !!el.checked,
    }));
  }, code);
}

async function readControls(page, expected) {
  return page.evaluate((items) => items.map((item) => {
    const el = document.getElementById(item.id);
    return el ? { id: item.id, type: item.type, value: el.value, checked: !!el.checked } : { id: item.id, missing: true };
  }), expected);
}

async function assertWritingPersistence(page, code) {
  await openClean(page, code);
  const beforeStorage = await storageSnapshot(page);
  const expected = await fillEveryPersistableControl(page, code);
  await page.waitForTimeout(500);
  const settled = await readControls(page, expected);
  const afterStorage = await storageSnapshot(page);

  expect(settled, `${code}: controls changed unexpectedly before reload`).toEqual(expected);
  const changedKeys = Object.keys(afterStorage).filter((key) => beforeStorage[key] !== afterStorage[key]);
  expect(changedKeys.length, `${code}: no localStorage entry changed after editing all controls`).toBeGreaterThan(0);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(350);
  const restored = await readControls(page, expected);
  expect(restored, `${code}: one or more saved input fields did not survive reload`).toEqual(expected);
}

async function seedHistory(page, code, total, first, second, best, suffix = '') {
  const key = `hw_score_history_${code}${suffix ? `_${suffix}` : ''}`;
  await page.evaluate(({ key, total, first, second, best }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 1,
      firstScore: first,
      secondScore: second,
      bestScore: best,
      attempts: 3,
      total,
      passedEver: true,
      lastScore: best,
    }));
  }, { key, total, first, second, best });
}

async function assertHistory(page, code, total, first, second, best, suffix = '') {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction((c) => window.__scoreHistoryPage === c, code, { timeout: 8000 });
  const history = await page.evaluate(({ suffix, total }) => window.__getScoreHistory(suffix, total), { suffix, total });
  expect(history.firstScore, `${code}: firstScore`).toBe(first);
  expect(history.secondScore, `${code}: secondScore`).toBe(second);
  expect(history.bestScore, `${code}: bestScore`).toBe(best);
  expect(history.attempts, `${code}: attempts`).toBe(3);
}

test.use({ screenshot: 'only-on-failure', trace: 'retain-on-failure' });
test.setTimeout(45_000);

test.describe('HW persistence contract A1-A14', () => {
  test('A1: first / second / best persist independently for every difficulty', async ({ page }) => {
    await openClean(page, 'A1');
    const modes = [
      ['einfach', 101, 102, 110],
      ['mittel', 201, 205, 220],
      ['schwer', 301, 306, 330],
      ['ultra', 401, 407, 440],
    ];
    for (const [mode, first, second, best] of modes) await seedHistory(page, 'A1', null, first, second, best, mode);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__scoreHistoryPage === 'A1');
    for (const [mode, first, second, best] of modes) {
      const h = await page.evaluate((m) => window.__getScoreHistory(m, null), mode);
      expect(h.firstScore).toBe(first);
      expect(h.secondScore).toBe(second);
      expect(h.bestScore).toBe(best);
      expect(h.attempts).toBe(3);
    }
  });

  for (const code of WRITING_PAGES) {
    test(`${code}: every persistable input field survives reload`, async ({ page }) => {
      await assertWritingPersistence(page, code);
    });
  }

  test('A6: manual completion checkbox survives reload', async ({ page }) => {
    await openClean(page, 'A6');
    await page.locator('#manualDoneA6').check();
    await page.waitForTimeout(250);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#manualDoneA6')).toBeChecked();
  });

  test('A7: manual completion checkbox survives reload', async ({ page }) => {
    await openClean(page, 'A7');
    await page.locator('#manualDoneA7').check();
    await page.waitForTimeout(250);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#manualDoneA7')).toBeChecked();
  });

  for (const [code, total] of Object.entries(SCORE_TOTALS)) {
    test(`${code}: first / second / best score storage contract survives reload`, async ({ page }) => {
      await openClean(page, code);
      const first = Math.max(0, total - 3);
      const second = Math.max(0, total - 1);
      const best = total;
      await seedHistory(page, code, total, first, second, best);
      await assertHistory(page, code, total, first, second, best);

      const panel = page.locator('.score-history-panel').first();
      await expect(panel).toContainText('Erster Versuch');
      await expect(panel).toContainText('Zweiter Versuch');
      await expect(panel).toContainText('Bester Versuch');
    });
  }
});
