import assert from 'node:assert/strict';
import { toPhoto } from './photos.js';

assert.deepEqual(toPhoto({ url: '/photo/a.jpg', thumb: '/thumb/a.jpg', date: '2023-10-24', orientation: 'portrait', place: 'Banff, AB' }),
  { url: '/photo/a.jpg', thumb: '/thumb/a.jpg', date: '2023-10-24', place: 'Banff, AB', o: 'p', tag: '2023-10-24' });
assert.equal(toPhoto({ url: '/photo/b.jpg', thumb: '/thumb/b.jpg', date: '2020-01-01', orientation: 'landscape' }).place, '');
console.log('photos: all checks pass');
