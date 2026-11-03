// Render overview.html to a one-page PDF and a PNG preview, and report any layout overflow.
const { chromium } = require('playwright');
const path = require('path');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1330 }, deviceScaleFactor: 2 });
  const errs = []; p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); p.on('requestfailed', r => errs.push('FAILED ' + r.url()));
  await p.goto('file://' + path.join(dir, 'overview.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const report = await p.evaluate(() => {
    const out = {};
    out.fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family);
    out.pageOverflow = document.documentElement.scrollHeight > 1330 || document.documentElement.scrollWidth > 1600;
    out.cards = [...document.querySelectorAll('.card')].map(c => {
      const fig = c.querySelector('.fig').getBoundingClientRect(), img = c.querySelector('.fig img').getBoundingClientRect();
      return { name: c.querySelector('h2').textContent, overflow: c.scrollHeight > c.clientHeight + 1, cardH: Math.round(c.getBoundingClientRect().height), figW: Math.round(fig.width), figH: Math.round(fig.height), imgW: Math.round(img.width), imgH: Math.round(img.height), fill: +(img.width * img.height / (fig.width * fig.height)).toFixed(2), loaded: c.querySelector('img').naturalWidth > 0, titleClipped: c.querySelector('.ptitle').scrollHeight > c.querySelector('.ptitle').clientHeight + 1, ideaLines: Math.round(c.querySelector('.idea').getBoundingClientRect().height / 20.25), resultLines: Math.round(c.querySelector('.result').getBoundingClientRect().height / 19.24), textTop: Math.round(c.querySelector('.idea').getBoundingClientRect().top) };
    });
    const last = document.querySelector('.foot').getBoundingClientRect();
    out.footerBottom = Math.round(last.bottom);
    const who = document.querySelector('.who'); out.whoLines = Math.round(who.getBoundingClientRect().height / 20.25);
    return out;
  });
  console.log(JSON.stringify(report, null, 1));
  await p.screenshot({ path: path.join(dir, 'overview-preview.png') });
  await p.pdf({ path: path.join(dir, '..', 'assets', 'hekai-wang-research-overview.pdf'), width: '1600px', height: '1330px', printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log('errors', JSON.stringify(errs));
})();
