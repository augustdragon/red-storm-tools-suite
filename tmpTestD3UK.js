const path = require('path');
const repo = 'd:/Dev/RedStorm';
const basePath = 'shared/oob-generator/js/table-processors';
const BaseTableProcessor = require(path.join(repo, basePath, 'BaseTableProcessor.js'));

global.BaseTableProcessor = BaseTableProcessor;
global.makeDebugRoll = (sides, description) => ({ roll: global.__nextRoll || 1, debugEntry: `${description}: ${global.__nextRoll || 1}` });
global.parseRange = range => {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(num => parseInt(num, 10));
    return [min, max];
  }
  const num = parseInt(range, 10);
  return [num, num];
};
global.window = {
  aircraftNATO: {},
  BA_DATE_RANGES_COMBINED_MAY: {},
  BA_DATE_RANGES: {}
};

const NATOTableD3 = require(path.join(repo, basePath, 'NATOTableD3.js'));
const tableData = require(path.join(repo, 'modules/baltic-approaches/oob-generator/data/nato-tables.json'))['D3'];
const processor = new NATOTableD3(tableData);

function runTest(roll, scenarioDate) {
  global.__nextRoll = roll;
  const result = processor.process({ scenarioDate });
  console.log(`Roll ${roll} on ${scenarioDate}: nationality=${result.nationality}`);
  result.flights.forEach(f => {
    console.log(`  Flight: ${f.text} | nationality=${f.nationality} actual=${f.actualNationality}`);
  });
  console.log('');
}

runTest(6, '15-31 May'); // UK(RAF)
runTest(4, '1-15 June'); // UK(RN)
