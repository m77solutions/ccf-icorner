// Runs before every build. Auto-populates the past-month redirect list.
// So on Aug 1, when the daily cron rebuilds, July gets added automatically.
import { readFileSync, writeFileSync } from 'fs';

function getCurrentManilaYM() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: '2-digit'
  }).formatToParts(new Date());
  return {
    year: parseInt(parts.find(p => p.type === 'year').value, 10),
    month: parseInt(parts.find(p => p.type === 'month').value, 10),
  };
}

const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const { year: curYear, month: curMonth } = getCurrentManilaYM();

// Build a list of past months from Jan 2026 up to LAST month
const pastMonths = [];
for (let y = 2026; y <= curYear; y++) {
  const endMonth = (y === curYear) ? curMonth - 1 : 12;
  for (let m = 1; m <= endMonth; m++) {
    pastMonths.push(MONTH_NAMES[m - 1] + '-' + y);
  }
}
console.log('Current Manila:', curYear + '-' + String(curMonth).padStart(2,'0'));
console.log('Past months to redirect:', pastMonths.join(', ') || '(none)');

const cfg = JSON.parse(readFileSync('staticwebapp.config.json', 'utf8'));
cfg.routes = cfg.routes || [];

// Remove any existing past-month redirects (start fresh)
cfg.routes = cfg.routes.filter(r => {
  if (!r.redirect || r.redirect !== '/month/current/') return true;
  if (typeof r.route !== 'string') return true;
  return !r.route.startsWith('/month/');
});

// Prepend fresh past-month redirects
for (const slug of pastMonths) {
  cfg.routes.unshift({ route: '/month/' + slug + '/*', redirect: '/month/current/', statusCode: 302 });
  cfg.routes.unshift({ route: '/month/' + slug, redirect: '/month/current/', statusCode: 302 });
}

writeFileSync('staticwebapp.config.json', JSON.stringify(cfg, null, 2));
console.log('Wrote ' + (pastMonths.length * 2) + ' redirect rules to staticwebapp.config.json');
