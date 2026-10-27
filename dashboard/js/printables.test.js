import assert from 'node:assert/strict';
import { topicsFromKeys, topicOfDay, titleOf, bandFor } from './printables.js';

const topics = topicsFromKeys(['packs/cozy-v1/volcanoes-early.pdf', 'packs/cozy-v1/volcanoes-teen.pdf', 'packs/cozy-v1/ant-tunnels-early.pdf', 'art/x.png']);
assert.deepEqual(topics, ['ant-tunnels', 'volcanoes']);
assert.equal(topicOfDay([], '2026-10-26'), null);
assert.notEqual(topicOfDay(topics, '2026-10-26'), topicOfDay(topics, '2026-10-27')); // walks one a day
assert.equal(topicOfDay(topics, '2026-10-26'), topicOfDay(topics, '2026-10-28'));
assert.equal(titleOf('ant-tunnels'), 'Ant Tunnels');
assert.deepEqual([0, 5, 9, 10, 12, 13, 15].map(bandFor), ['early', 'early', 'early', 'middle', 'middle', 'teen', 'teen']);
console.log('printables: all checks pass');
