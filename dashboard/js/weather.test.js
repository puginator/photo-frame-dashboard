import assert from 'node:assert/strict';
import { toWeather, weatherUrl } from './weather.js';
import { WEATHER } from './config.js';

// Two-place response trimmed to what toWeather reads.
function place(t, code, day) {
  var n = 48, A = function (v) { return Array(n).fill(v); };
  return {
    current: { temperature_2m: t, weather_code: code, is_day: day },
    hourly: { temperature_2m: A(t), weather_code: A(code), precipitation_probability: A(null), is_day: A(day) },
    daily: { time: ['2026-10-24', '2026-10-25'], temperature_2m_max: [50.4, 53], temperature_2m_min: [39.5, 44] }
  };
}
var w = toWeather([place(39.8, 61, 1), place(37.5, 0, 0)], WEATHER, new Date(2026, 9, 24, 8));
assert.equal(w.hi, 50); assert.equal(w.lo, 40);          // rounded °F
assert.equal(w.t.length, 48); assert.equal(w.t[0], 40);
assert.equal(w.c[0], 'rain'); assert.equal(w.l[0], 'Rain');
assert.equal(w.p[0], 0);                                  // null precip -> 0
assert.deepEqual(w.others, [{ name: 'Everson', temp: 38, cond: 'moon' }]);
assert.equal(w.day, '2026-10-24');
assert.match(weatherUrl(WEATHER), /temperature_unit=fahrenheit/);
assert.match(weatherUrl(WEATHER), /latitude=48.75,48.92/);
console.log('weather: all checks pass');
