import { parseMoney, fmtMoney } from './validation-utils.js';
import { parseCSV } from './csv-utils.js';

export function computeLostIncome({ baselineMonthly, trendPct, outageDays, periodMonths }){
  const base = parseMoney(baselineMonthly)||0;
  const trend = (Number(trendPct)||0)/100;
  const months = Number(periodMonths)||1;
  const daily = (base * (1+trend)) / 30;
  const lost = daily * (Number(outageDays)||0);
  const proj = base * months * (1+trend);
  return { daily: fmtMoney(daily), projected: fmtMoney(proj), lost: fmtMoney(lost), lostRaw: lost };
}

export function summarizeCSV(text, moneyCol='amount'){
  const rows = parseCSV(text).map(r=>({ date:r[0]||'', label:r[1]||'', amount:r[2]||'' }));
  const total = rows.reduce((s,x)=>s+(parseMoney(x[moneyCol])||0),0);
  return { rows, total, totalFmt: fmtMoney(total) };
}
