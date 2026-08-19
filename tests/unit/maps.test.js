// Maps are pure data, and a broken lane would only show up as a soft-locked
// board in the browser — so every rule the engine relies on is asserted here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, getMap, useMap, currentMap, DEFAULT_MAP } from '../../js/maps.js';
import { PATH, PATH2, COLS, ROWS, PATHS } from '../../js/config.js';

function tilesOf(paths) {
  const tiles = new Set();
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1];
      const [bx, by] = path[i];
      const sx = Math.sign(bx - ax);
      const sy = Math.sign(by - ay);
      let x = ax; let y = ay;
      tiles.add(`${x},${y}`);
      while (x !== bx || y !== by) { x += sx; y += sy; tiles.add(`${x},${y}`); }
    }
  }
  return tiles;
}

test('map ids are unique and every map has a theme', () => {
  const ids = MAPS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const map of MAPS) {
    assert.ok(map.name && map.icon, `${map.id} needs a name and an icon`);
    for (const key of ['floor', 'tileLight', 'tileDark', 'path', 'wall', 'fog', 'arrow']) {
      assert.equal(typeof map.theme[key], 'number', `${map.id}.theme.${key}`);
    }
  }
});

test('every lane is axis-aligned, in bounds and has no zero-length segments', () => {
  for (const map of MAPS) {
    for (const [lane, path] of map.paths.entries()) {
      assert.ok(path.length >= 3, `${map.id} lane ${lane} is too short`);
      for (const [i, [x, y]] of path.entries()) {
        assert.ok(Number.isInteger(x) && x >= 0 && x < map.cols, `${map.id} lane ${lane} waypoint ${i} col`);
        assert.ok(Number.isInteger(y) && y >= 0 && y < map.rows, `${map.id} lane ${lane} waypoint ${i} row`);
      }
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1];
        const [bx, by] = path[i];
        assert.ok(ax === bx || ay === by, `${map.id} lane ${lane} segment ${i} is diagonal`);
        assert.ok(ax !== bx || ay !== by, `${map.id} lane ${lane} segment ${i} is zero length`);
      }
    }
  }
});

test('lanes start at a door on the edge and all end at the same bowl', () => {
  for (const map of MAPS) {
    const goal = map.paths[0][map.paths[0].length - 1];
    for (const [lane, path] of map.paths.entries()) {
      const [sx, sy] = path[0];
      const onEdge = sx === 0 || sy === 0 || sx === map.cols - 1 || sy === map.rows - 1;
      assert.ok(onEdge, `${map.id} lane ${lane} does not start on an edge`);
      assert.deepEqual(path[path.length - 1], goal, `${map.id} lane ${lane} ends elsewhere`);
    }
  }
});

test('every map leaves plenty of room to build', () => {
  for (const map of MAPS) {
    const blocked = tilesOf(map.paths).size;
    const free = map.cols * map.rows - blocked;
    assert.ok(free >= 60, `${map.id} only has ${free} buildable tiles`);
  }
});

test('the kitchen is unchanged so waves 1-10 still play the same', () => {
  const kitchen = getMap('kitchen');
  assert.equal(DEFAULT_MAP, 'kitchen');
  assert.equal(kitchen.cols, 9);
  assert.equal(kitchen.rows, 19);
  assert.deepEqual(kitchen.paths, [PATH, PATH2]);
  assert.equal(kitchen.secondLaneWave, 11);
});

test('getMap falls back to the first map for an unknown id', () => {
  assert.equal(getMap('nope').id, MAPS[0].id);
});

test('useMap swaps the live board bindings', async () => {
  useMap('garden');
  const garden = currentMap();
  // Re-import to read the live bindings after the swap.
  const cfg = await import('../../js/config.js');
  assert.equal(cfg.COLS, garden.cols);
  assert.equal(cfg.ROWS, garden.rows);
  assert.deepEqual(cfg.PATHS, garden.paths);
  useMap('kitchen');
  assert.equal(cfg.COLS, 9);
  assert.equal(cfg.ROWS, 19);
  // The bindings imported at the top of this file follow along too.
  assert.equal(COLS, 9);
  assert.equal(ROWS, 19);
  assert.deepEqual(PATHS, [PATH, PATH2]);
});
