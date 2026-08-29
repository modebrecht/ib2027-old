const fs = require('fs');
const { test, expect } = require('@playwright/test');
const BASE_URL = (process.env.BASE_URL || 'https://ib2026.vercel.app').replace(/\/$/, '');

async function open(page, code) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('studentVorname','E2E Score'); localStorage.setItem('student_vorname','E2E Score'); });
  await page.goto(`${BASE_URL}/hw/${code}.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction((c) => window.__scoreHistoryPage === c, code, { timeout: 8000 });
  await page.evaluate(() => { const native = window.setTimeout.bind(window); window.setTimeout = (fn, ms, ...args) => native(fn, Math.min(Number(ms)||0, 35), ...args); });
}
async function hist(page,total,suffix=''){return page.evaluate(({total,suffix})=>window.__getScoreHistory(suffix,total),{total,suffix});}
async function checkHist(page,total,a,b,best,suffix=''){const h=await hist(page,total,suffix);expect(h.firstScore).toBe(a);expect(h.secondScore).toBe(b);expect(h.bestScore).toBe(best);return h;}
function other(v,vals){return vals.find(x=>x!==v);}
async function pdf(page,selector){const [d]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator(selector).click({force:true})]);const p=await d.path();const b=fs.readFileSync(p);expect(b.subarray(0,5).toString('ascii')).toBe('%PDF-');const payload=await page.evaluate(()=>window.__scoreHistoryPdfPayload||[]);const labels=payload.map(x=>x.label);expect(labels.some(x=>x.includes('Erster Versuch'))).toBe(true);expect(labels.some(x=>x.includes('Zweiter Versuch'))).toBe(true);expect(labels.some(x=>x.includes('Bester Versuch'))).toBe(true);}
async function accept(page,fn){page.once('dialog',d=>d.accept());await page.evaluate(fn);}

async function a4Round(page,wrong){const total=await page.evaluate(()=>TOTAL_QUESTIONS);for(let i=0;i<total;i++){await page.locator('#quizOptions button').first().waitFor({state:'visible'});const correct=await page.evaluate(()=>currentQuestion.id);let id=correct;if(i<wrong){const ids=await page.locator('#quizOptions button').evaluateAll(es=>es.map(e=>e.dataset.id));id=ids.find(x=>x!==correct);}await page.locator(`#quizOptions button[data-id="${id}"]`).click();await page.waitForFunction(prev=>!quizActive||(currentQuestion&&currentQuestion.id!==prev),correct,{timeout:3000});}await page.locator('#modal').waitFor({state:'visible'});return total-wrong;}
async function catRound(page,kind,wrong){const total=await page.evaluate(k=>k==='a8'?ITEMS.length:k==='a9'||k==='a10'?SCENES.length:TOTAL,kind);for(let i=0;i<total;i++){const correct=await page.evaluate(k=>k==='a8'||k==='a9'?current().cat:k==='a10'?current().cat:queue[index].correct,kind);let sel;if(kind==='a8'||kind==='a9'){const c=i<wrong?other(correct,['eingabe','verarbeitung','ausgabe']):correct;sel=`.eva-btn[data-cat="${c}"]`;}else if(kind==='a10'){const c=i<wrong?other(correct,['ram','hdd','ssd']):correct;sel=`.storage-btn[data-cat="${c}"]`;}else{let id=correct;if(i<wrong){const ids=await page.locator('.option-btn').evaluateAll(es=>es.map(e=>e.dataset.id));id=ids.find(x=>x!==correct);}sel=`.option-btn[data-id="${id}"]`;}await page.locator(sel).click();await page.waitForFunction(prev=>index>prev||!document.getElementById('result')?.classList.contains('hidden'),i,{timeout:3000});}await page.locator('#result').waitFor({state:'visible'});return total-wrong;}
async function a11Round(page,wrong){for(let i=0;i<5;i++){await page.locator('#dialogueNext').click({force:true});const correct=await page.evaluate(()=>CASES[index].correct);let id=correct;if(i<wrong){const ids=await page.locator('.device-card').evaluateAll(es=>es.map(e=>e.dataset.id));id=ids.find(x=>x!==correct);}await page.locator(`.device-card[data-id="${id}"]`).click();await expect(page.locator(`.device-card[data-id="${correct}"]`)).toHaveClass(/correct/);await page.locator('#nextBtn').click();await page.waitForFunction(prev=>index>prev||!document.getElementById('result')?.classList.contains('hidden'),i,{timeout:3000});}await page.locator('#result').waitFor({state:'visible'});return 5-wrong;}
async function a12Round(page,wrong){const cs=await page.evaluate(()=>C.map(x=>({id:x.id,category:x.category})));for(let i=0;i<cs.length;i++){const x=cs[i],v=i<wrong?other(x.category,['av','data','network','power']):x.category;const s=page.locator(`#choice_${x.id}`);await s.selectOption(v);await expect(s).toBeDisabled();}await page.locator('#result').waitFor({state:'visible'});return cs.length-wrong;}
async function memory(page){await page.waitForFunction(()=>state?.deck?.length);const pairs=await page.evaluate(()=>{const m={};state.deck.forEach((c,i)=>(m[c.pairId]??=[]).push(i));return Object.values(m).map(x=>x.slice(0,2));});for(const [a,b] of pairs){await page.locator(`.mem-card[data-index="${a}"]`).click();await page.locator(`.mem-card[data-index="${b}"]`).click();}await page.locator('#modal').waitFor({state:'visible'});}

test.use({acceptDownloads:true});
test.setTimeout(60000);

test('A1 attempt history survives reset and enters PDF',async({page})=>{await open(page,'A1');await page.locator('.diff-btn[data-diff="einfach"]').click();await memory(page);const one=await hist(page,null,'einfach');await page.locator('#again').click();await memory(page);const two=await hist(page,null,'einfach');await page.locator('#again').click();await memory(page);const three=await hist(page,null,'einfach');expect(one.firstScore).not.toBeNull();expect(two.secondScore).not.toBeNull();expect(three.attempts).toBe(3);expect(three.bestScore).toBeGreaterThanOrEqual(three.firstScore);expect(three.bestScore).toBeGreaterThanOrEqual(three.secondScore);await page.locator('#change').click();await page.locator('.diff-btn[data-diff="mittel"]').click();await memory(page);await page.locator('#change').click();await page.locator('.diff-btn[data-diff="schwer"]').click();await memory(page);const before=await hist(page,null,'einfach');await accept(page,()=>confirmReset());expect(await hist(page,null,'einfach')).toEqual(before);await pdf(page,'#hdrPdfBtn');});

test('A4 14/16 -> 15/16 -> 16/16',async({page})=>{await open(page,'A4');await page.evaluate(()=>switchMode('quiz'));expect(await a4Round(page,2)).toBe(14);expect((await hist(page,16)).secondScore).toBeNull();await page.evaluate(()=>{document.getElementById('modal').classList.add('hidden');startQuiz()});expect(await a4Round(page,1)).toBe(15);await page.evaluate(()=>{document.getElementById('modal').classList.add('hidden');startQuiz()});expect(await a4Round(page,0)).toBe(16);await checkHist(page,16,14,15,16);const before=await hist(page,16);await accept(page,()=>confirmReset());expect(await hist(page,16)).toEqual(before);await pdf(page,'#hdrPdfBtn');});

test('A8 12/15 -> 14/15 -> 15/15',async({page})=>{await open(page,'A8');expect(await catRound(page,'a8',3)).toBe(12);await page.evaluate(()=>startFullRound());expect(await catRound(page,'a8',1)).toBe(14);await page.evaluate(()=>startFullRound());expect(await catRound(page,'a8',0)).toBe(15);await checkHist(page,15,12,14,15);const before=await hist(page,15);await accept(page,()=>resetA8());expect(await hist(page,15)).toEqual(before);await pdf(page,'#pdf');});

test('A9 10/12 -> 11/12 -> 12/12',async({page})=>{await open(page,'A9');expect(await catRound(page,'a9',2)).toBe(10);await page.evaluate(()=>startRound());expect(await catRound(page,'a9',1)).toBe(11);await page.evaluate(()=>startRound());expect(await catRound(page,'a9',0)).toBe(12);await checkHist(page,12,10,11,12);const before=await hist(page,12);await accept(page,()=>resetA9());expect(await hist(page,12)).toEqual(before);await pdf(page,'#pdf');});

test('A10 8/10 -> 9/10 -> 10/10',async({page})=>{await open(page,'A10');expect(await catRound(page,'a10',2)).toBe(8);await page.evaluate(()=>startRound());expect(await catRound(page,'a10',1)).toBe(9);await page.evaluate(()=>startRound());expect(await catRound(page,'a10',0)).toBe(10);await checkHist(page,10,8,9,10);const before=await hist(page,10);await accept(page,()=>resetA10());expect(await hist(page,10)).toEqual(before);await pdf(page,'#pdf');});

test('A11 first click: 3/5 -> 4/5 -> 5/5',async({page})=>{await open(page,'A11');expect(await a11Round(page,2)).toBe(3);await page.evaluate(()=>startOver());expect(await a11Round(page,1)).toBe(4);await page.evaluate(()=>startOver());expect(await a11Round(page,0)).toBe(5);await checkHist(page,5,3,4,5);const before=await hist(page,5);await accept(page,()=>resetA11());expect(await hist(page,5)).toEqual(before);await pdf(page,'#pdf');});

test('A12 first selection: 10/12 -> 11/12 -> 12/12',async({page})=>{await open(page,'A12');expect(await a12Round(page,2)).toBe(10);await accept(page,()=>resetA12());expect(await a12Round(page,1)).toBe(11);await accept(page,()=>resetA12());expect(await a12Round(page,0)).toBe(12);await checkHist(page,12,10,11,12);const before=await hist(page,12);await accept(page,()=>resetA12());expect(await hist(page,12)).toEqual(before);await pdf(page,'#pdf');});

test('A14 11/14 -> 13/14 -> 14/14',async({page})=>{await open(page,'A14');expect(await catRound(page,'a14',3)).toBe(11);await page.evaluate(()=>startRound());expect(await catRound(page,'a14',1)).toBe(13);await page.evaluate(()=>startRound());expect(await catRound(page,'a14',0)).toBe(14);await checkHist(page,14,11,13,14);const before=await hist(page,14);await accept(page,()=>resetA14());expect(await hist(page,14)).toEqual(before);await pdf(page,'#pdf');});

test('A2/A3/A5/A13 expose no reset button',async({page})=>{for(const c of ['A2','A3','A5','A13']){await open(page,c);const n=await page.locator('button').evaluateAll(bs=>bs.filter(b=>{const t=`${b.title||''} ${b.getAttribute('onclick')||''} ${b.textContent||''}`.toLowerCase();return t.includes('zurücksetzen')||t.includes('confirmreset')||/reset[a-z0-9_]*\(/.test(t)}).length);expect(n).toBe(0);}});


test('A11 reload cannot award the same first attempt twice',async({page})=>{
  await open(page,'A11');
  await page.locator('#dialogueNext').click({force:true});
  const firstCorrect=await page.evaluate(()=>CASES[index].correct);
  await page.locator(`.device-card[data-id="${firstCorrect}"]`).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hw_score_work_A11')).score)).toBe(1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__scoreHistoryPage==='A11');
  expect(await page.evaluate(()=>index)).toBe(1);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hw_score_work_A11')).score)).toBe(1);
  for(let i=1;i<5;i++){
    await page.locator('#dialogueNext').click({force:true});
    const correct=await page.evaluate(()=>CASES[index].correct);
    await page.locator(`.device-card[data-id="${correct}"]`).click();
    await page.locator('#nextBtn').click();
    await page.waitForFunction(prev=>index>prev||!document.getElementById('result')?.classList.contains('hidden'),i,{timeout:3000});
  }
  await page.locator('#result').waitFor({state:'visible'});
  let h=await hist(page,5);expect(h.firstScore).toBe(5);expect(h.attempts).toBe(1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__scoreHistoryPage==='A11');
  await page.locator('#result').waitFor({state:'visible'});
  await expect(page.locator('#result .text-5xl')).toHaveText('5 / 5');
  h=await hist(page,5);expect(h.firstScore).toBe(5);expect(h.attempts).toBe(1);
});

test('A12 reload preserves a locked first selection',async({page})=>{
  await open(page,'A12');
  const first=await page.evaluate(()=>({id:C[0].id,category:C[0].category}));
  const wrong=other(first.category,['av','data','network','power']);
  const sel=page.locator(`#choice_${first.id}`);
  await sel.selectOption(wrong);await expect(sel).toBeDisabled();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__scoreHistoryPage==='A12');
  const reloaded=page.locator(`#choice_${first.id}`);
  await expect(reloaded).toBeDisabled();await expect(reloaded).toHaveValue(wrong);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hw_score_work_A12')).answeredIds.length)).toBe(1);
  const cs=await page.evaluate(()=>C.slice(1).map(x=>({id:x.id,category:x.category})));
  for(const x of cs){await page.locator(`#choice_${x.id}`).selectOption(x.category);}
  await page.locator('#result').waitFor({state:'visible'});
  const h=await hist(page,12);expect(h.firstScore).toBe(11);expect(h.attempts).toBe(1);
});


test('reset buttons never delete localStorage keys',async({page})=>{
  for(const code of ['A1','A4','A8','A9','A10','A11','A12','A14']){
    await open(page,code);
    await page.evaluate(()=>{
      window.__storageDeletes=[];
      window.__storageClears=0;
      const proto=Storage.prototype;
      if(!proto.__scoreAuditRemove){
        proto.__scoreAuditRemove=proto.removeItem;
        proto.__scoreAuditClear=proto.clear;
      }
      proto.removeItem=function(key){window.__storageDeletes.push(String(key));};
      proto.clear=function(){window.__storageClears++;};
    });
    const reset=page.locator('button[title="Zurücksetzen"]').first();
    await expect(reset).toBeVisible();
    page.once('dialog',d=>d.accept());
    await reset.click();
    await page.waitForTimeout(80);
    const audit=await page.evaluate(()=>({deletes:window.__storageDeletes.slice(),clears:window.__storageClears}));
    expect(audit.deletes,code+' removeItem calls').toEqual([]);
    expect(audit.clears,code+' clear calls').toBe(0);
  }
});
