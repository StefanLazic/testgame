// ---------------------------------------------------------------------------
// The boards you can defend. A map owns its size, its lanes, its theme and its
// scenery; everything else (cats, pests, waves) is shared.
//
// Lane rules the engine relies on:
//   * every segment between two waypoints is axis-aligned (no diagonals),
//   * the first waypoint sits on the edge of the board (that is the door),
//   * every lane ends on the same tile — the milk bowl.
// ---------------------------------------------------------------------------

import { PATH, PATH2, setBoard } from './config.js';
import { settings } from './settings.js';

export const MAPS = [
  {
    id: 'kitchen',
    icon: '🍽️',
    name: 'The Kitchen',
    cols: 9,
    rows: 19,
    secondLaneWave: 11,
    paths: [PATH, PATH2],
    theme: {
      floor: 0x3a2360, tileLight: 0x53377f, tileDark: 0x472e6f, path: 0x8f6a3e,
      wall: 0x2a1a46, fog: 0x140a24, arrow: 0xffd9a0, decor: null,
    },
  },
  {
    // Wider, shorter and much more open: more places to build, but the pests
    // reach the bowl sooner and the two lanes run close enough to share cats.
    id: 'garden',
    icon: '🌻',
    name: 'The Garden',
    cols: 11,
    rows: 17,
    secondLaneWave: 11,
    paths: [
      [[0, 1], [8, 1], [8, 4], [1, 4], [1, 7], [8, 7], [8, 10], [1, 10], [1, 13], [5, 13], [5, 15]],
      [[10, 0], [10, 2], [9, 2], [9, 5], [10, 5], [10, 8], [9, 8], [9, 12], [7, 12], [7, 15], [5, 15]],
    ],
    theme: {
      floor: 0x2f5a2c, tileLight: 0x4f8a43, tileDark: 0x437438, path: 0xb08a5a,
      wall: 0x27482a, fog: 0x0d2417, arrow: 0xfff0a0, decor: 'flowers',
    },
  },
];

export const DEFAULT_MAP = MAPS[0].id;

export function getMap(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}

let current = getMap(DEFAULT_MAP);
export function currentMap() { return current; }

// Point the whole game at another board. Returns the map that is now live.
export function useMap(id) {
  current = getMap(id);
  setBoard(current);
  settings.set('map', current.id);
  return current;
}

// Boot with whatever the player chose last time.
useMap(settings.get('map') || DEFAULT_MAP);
