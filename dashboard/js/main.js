// Entry point. Order matters: each module attaches to the shared window.App.
import './icons.js';
import './data.js';
import './app.js';
import './system.js';
import './slideshow.js';
import './views/home.js';
import './views/calendar.js';
import './views/tasks.js';
import './views/shopping.js';
import './views/photos.js';
import './views/control.js';
import './views/meals.js';
import './views/ambient.js';
import './diag.js';

import { loadWeather } from './weather.js';
import { WEATHER } from './config.js';
loadWeather(WEATHER, function (w) { window.DATA.weather = w; window.App.emit('data'); });

import { loadPhotos } from './photos.js';
var demoPhotos = window.DATA.photos; // shown until the bucket has photos, and again if it is emptied
loadPhotos(function (photos) { window.DATA.photos = photos.length ? photos : demoPhotos; window.App.emit('photos'); });

import { loadLiveEvents } from './calendar-sync.js';
var demoEvents = window.DATA.events; // shown until the Google feed is linked, and if it goes empty
loadLiveEvents(window.DATA, function (events) {
  window.DATA.events = events.length ? events : demoEvents;
  window.App.emit('data');
});
