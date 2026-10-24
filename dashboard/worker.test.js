import assert from 'node:assert/strict';
import { toRecord } from './worker.js';

assert.deepEqual(toRecord('photos/2024-05-19_p_a1b2c3d4_Banff, AB.jpg'), {
  url: '/photo/2024-05-19_p_a1b2c3d4_Banff%2C%20AB.jpg', thumb: '/thumb/2024-05-19_p_a1b2c3d4_Banff%2C%20AB.jpg',
  date: '2024-05-19', orientation: 'portrait', place: 'Banff, AB'
});
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f.jpg').place, undefined);
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f.jpg').orientation, 'landscape');
assert.equal(toRecord('photos/2023-07-02_l_0f0f0f0f_Lake_Padden.jpg').place, 'Lake_Padden'); // underscores in a place survive
assert.equal(toRecord('photos/IMG_1234.jpg'), null); // a stray upload without the naming convention is skipped
console.log('worker: all checks pass');
