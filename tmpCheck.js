const path = require('path');
const repo = 'd:/Dev/RedStorm';
const basePath = 'shared/oob-generator/js/table-processors';
const BaseTableProcessor = require(path.join(repo, basePath, 'BaseTableProcessor.js'));
global.BaseTableProcessor = BaseTableProcessor;
global.makeDebugRoll = (sides, description) => ({ roll: 1, debugEntry: `${description}:1` });
global.parseRange = range => {
  if (range.includes('-')) {
    const [min, max] = range.split('-').map(num => parseInt(num, 10));
    return [min, max];
  }
  const num = parseInt(range, 10);
  return [num, num];
};
global.window = { aircraftNATO: {} };
const NATOTableD3 = require(path.join(repo, basePath, 'NATOTableD3.js'));
const tableData = require(path.join(repo, 'modules/baltic-approaches/oob-generator/data/nato-tables.json'));
const d3Data = tableData['D3'];
const processor = new NATOTableD3(d3Data);
const result = processor.process({ scenarioDate: '15-31 May' });
const entry = {
  ...result,
  id: 1,
  table: 'D3',
  faction: 'NATO',
  tableName: 'NATO Table D3 - Naval Strike Raid'
};
const flightsArray = entry.flights;
console.log('Entry keys:', Object.keys(entry));
for (const individualFlight of flightsArray) {
  const processedFlight = {
    ...entry,
    ...individualFlight,
    result: individualFlight.text || individualFlight.result,
    faction: entry.faction || individualFlight.faction || 'NATO'
  };
  console.log('Processed flight nationality fields:', processedFlight.nationality, processedFlight.actualNationality, Object.keys(processedFlight));
}
