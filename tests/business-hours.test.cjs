const test = require('node:test');
const assert = require('node:assert/strict');
const { getHoursStatus } = require(process.env.HOURS_TEST_BUILD + '/business-hours.js');
const { GET } = require(process.env.HOURS_TEST_BUILD + '/api/business-hours/route.js');

test('winter weekday opening and closing boundaries in Eastern time', () => {
  for (const [time, expected] of [
    ['2026-11-09T13:59:59Z', 'away'],
    ['2026-11-09T14:00:00Z', 'open'],
    ['2026-11-09T22:59:59Z', 'open'],
    ['2026-11-09T23:00:00Z', 'away'],
  ]) assert.equal(getHoursStatus(new Date(time)), expected, time);
});
test('summer hours follow New York daylight time', () => {
  assert.equal(getHoursStatus(new Date('2026-07-06T12:59:59Z')), 'away');
  assert.equal(getHoursStatus(new Date('2026-07-06T13:00:00Z')), 'open');
  assert.equal(getHoursStatus(new Date('2026-07-06T22:00:00Z')), 'away');
});
test('weekends are closed', () => {
  assert.equal(getHoursStatus(new Date('2026-11-07T17:00:00Z')), 'away');
  assert.equal(getHoursStatus(new Date('2026-11-08T17:00:00Z')), 'away');
});
test('endpoint returns server-derived status without caching', async () => {
  const response = GET();
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.ok(['open', 'away'].includes((await response.json()).status));
});
