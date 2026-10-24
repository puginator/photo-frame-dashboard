// Real weather from Open-Meteo into DATA.weather, in °F. Fetched straight from the frame: the API
// allows CORS and needs no key, so no Worker proxy. Shape matches the demo data in data.js, except
// the hourly arrays run 48 h from local midnight so the strip can show past midnight.

// WMO weather code -> [day icon, night icon, label], using the icons in icons.js.
function code(c) {
  if (c === 0) return ['sun', 'moon', 'Clear'];
  if (c === 1) return ['sun', 'moon', 'Mostly clear'];
  if (c === 2) return ['partly', 'moon', 'Partly cloudy'];
  if (c === 3) return ['cloud', 'cloud', 'Overcast'];
  if (c === 45 || c === 48) return ['cloud', 'cloud', 'Fog'];
  if (c >= 51 && c <= 57) return ['rain', 'rain', 'Drizzle'];
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['cloud', 'cloud', 'Snow'];
  if (c >= 95) return ['rain', 'rain', 'Storms'];
  return ['rain', 'rain', 'Rain']; // 61-67, 80-82
}
function icon(c, day) { var x = code(c); return day ? x[0] : x[1]; }

export function weatherUrl(cfg) {
  return 'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + cfg.places.map(function (p) { return p.lat; }).join(',') +
    '&longitude=' + cfg.places.map(function (p) { return p.lon; }).join(',') +
    '&current=temperature_2m,weather_code,is_day' +
    '&hourly=temperature_2m,weather_code,precipitation_probability,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min' +
    '&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=2&timezone=' + encodeURIComponent(cfg.timezone);
}

// Open-Meteo response (array, one per place) -> DATA.weather shape.
export function toWeather(res, cfg, now) {
  if (!Array.isArray(res)) res = [res];
  var a = res[0], H = a.hourly, r = Math.round;
  return {
    hi: r(a.daily.temperature_2m_max[0]), lo: r(a.daily.temperature_2m_min[0]),
    t: H.temperature_2m.map(r),
    c: H.weather_code.map(function (c, i) { return icon(c, H.is_day[i]); }),
    l: H.weather_code.map(function (c) { return code(c)[2]; }),
    p: H.precipitation_probability.map(function (p) { return p || 0; }),
    others: res.slice(1).map(function (b, i) {
      return { name: cfg.places[i + 1].name, temp: r(b.current.temperature_2m), cond: icon(b.current.weather_code, b.current.is_day) };
    }),
    day: a.daily.time[0], updated: now.getTime()
  };
}

// cb(weather) with the cached copy right away, then after each fetch. Refreshes every 30 min; a
// failed fetch keeps the last good reading on screen.
export function loadWeather(cfg, cb) {
  try { var cached = JSON.parse(localStorage.getItem('weather') || 'null'); if (cached) cb(cached); } catch (e) {}
  function refresh() {
    fetch(weatherUrl(cfg))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (res) { var w = toWeather(res, cfg, new Date()); localStorage.setItem('weather', JSON.stringify(w)); cb(w); })
      .catch(function () {});
  }
  refresh();
  setInterval(refresh, 30 * 60000);
}
