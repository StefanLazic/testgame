// Pure placement/preview rules, kept out of game.js so they can be tested in
// node without a WebGL context.
import test from 'node:test';
import assert from 'node:assert/strict';
import { previewStats, previewTile } from '../../js/rules.js';
import { TOWERS, towerStats } from '../../js/config.js';

test('previewStats reports the level 1 numbers a shopper needs', () => {
  const p = previewStats('archer');
  assert.equal(p.kind, 'archer');
  assert.equal(p.cost, TOWERS.archer.cost);
  assert.equal(p.icon, TOWERS.archer.icon);
  assert.equal(p.range, towerStats('archer', 1).range);
  assert.equal(p.damage, Math.round(towerStats('archer', 1).damage));
  assert.equal(p.air, true);
  assert.equal(p.global, false);
});

test('previewStats describes ability cats instead of faking damage numbers', () => {
  assert.equal(previewStats('witch').ability, 'curse');
  assert.equal(previewStats('queen').global, true);
  assert.equal(previewStats('queen').range, 0);
});

test('previewStats is undefined for an unknown cat', () => {
  assert.equal(previewStats('nope'), null);
});

const grid = ({ cols = 5, rows = 5, path = [], occupied = [] } = {}) => ({
  cols, rows, pathTiles: new Set(path), occupied: new Set(occupied),
});

test('previewTile picks a free tile that touches the path', () => {
  const g = grid({ path: ['2,0', '2,1', '2,2', '2,3', '2,4'] });
  const tile = previewTile(g);
  assert.ok(tile, 'a tile should be found');
  assert.equal(g.pathTiles.has(tile.key), false);
  const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .some(([dc, dr]) => g.pathTiles.has(`${tile.col + dc},${tile.row + dr}`));
  assert.equal(touches, true, 'the preview should sit next to the lane');
});

test('previewTile skips tiles that are already built on', () => {
  const path = ['2,0', '2,1', '2,2', '2,3', '2,4'];
  const g = grid({ path });
  const first = previewTile(g);
  const g2 = grid({ path, occupied: [first.key] });
  const second = previewTile(g2);
  assert.notEqual(second.key, first.key);
});

test('previewTile falls back to any free tile when nothing touches the path', () => {
  const g = grid({ cols: 2, rows: 1, path: [] });
  const tile = previewTile(g);
  assert.ok(tile);
  assert.ok(tile.col >= 0 && tile.col < 2 && tile.row === 0);
});

test('previewTile returns null when the board is full', () => {
  const g = grid({ cols: 2, rows: 1, occupied: ['0,0', '1,0'] });
  assert.equal(previewTile(g), null);
});
