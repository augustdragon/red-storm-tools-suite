const path = require('path');
const repo = 'd:/Dev/RedStorm';
const basePath = 'shared/oob-generator/js/table-processors';
const base = require(path.join(repo, basePath, 'BaseTableProcessor.js'));
global.BaseTableProcessor = base;
global.makeDebugRoll = (sides, description) => ({ roll: 1, debugEntry: `${description}:1` });
global.parseRange = range => {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(num => parseInt(num));
    return [min, max];
  }
  const num = parseInt(range);
  return [num, num];
};
global.window = { aircraftNATO: {} };
const NATOTableD3 = require(path.join(repo, basePath, 'NATOTableD3.js'));
const tableData = require(path.join(repo, 'modules/baltic-approaches/oob-generator/data/nato-tables.json'));
const d3Data = tableData['D3'];
const processor = new NATOTableD3(d3Data);

const sampleResult = processor.process({ scenarioDate: '15-31 May' });
console.log('Sample D3 Result:');
sampleResult.flights.forEach(f => console.log(f.text, '->', f.nationality));
