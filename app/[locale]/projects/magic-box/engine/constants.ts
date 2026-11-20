export const WORK_SPACE_SIZE = 200;
export const SHAPE_SIZE = 20;      // placement snaps to this grid
export const LIMIT_SIZE = 4;       // max scale for basic shapes and text
export const STL_MAX_SCALE = 2.22; // cartoon models are already larger
export const SIDEBAR_W = 120;
export const HISTORY_LIMIT = 50;
export const LARGE_SCENE = 50;     // warn above this many objects
export const CLICK_SLOP = 5;       // px a pointer may move and still count as a click
export const CAMERA_HOME: [number, number, number] = [170, 145, 255];
export const LIGHT_DIRECTION: [number, number, number] = [1, 0.75, 0.5];
export const DEFAULT_COLOR = '#dddddd';

export type ObjectModule = 'shape' | 'stl' | 'text';
/** `title` doubles as the image file name and the i18n key under magicBox.shapes. */
export type PickItem = { module: ObjectModule; code: number; title: string };

export const STL_FILES: Record<number, string> = {
  0: '/models/stl/ascii/standing.stl',
  1: '/models/stl/ascii/climbing.stl',
  2: '/models/stl/ascii/lying.stl',
  3: '/models/stl/ascii/sitting.stl',
  4: '/models/stl/ascii/tyrannosaurusRex.stl',
  5: '/models/stl/ascii/pokemon/bulbasaur_starter_1gen_flowalistik.stl',
  6: '/models/stl/ascii/pokemon/charmander_starter_1gen_flowalistik.stl',
  7: '/models/stl/ascii/pokemon/chikorita_starter_2gen_flowalistik.stl',
  8: '/models/stl/ascii/pokemon/pikachu_1gen_flowalistik.stl',
  9: '/models/stl/ascii/pokemon/squirtle_starter_1gen_flowalistik.stl',
  10: '/models/stl/ascii/pokemon/totodile_starter_2gen_flowalistik.stl',
  11: '/models/stl/ascii/five-point-star.stl',
};
export const FALLBACK_STL = 4;

export const SHAPES_LIST: PickItem[] = [
  { title: 'cube',           code: 0,   module: 'shape' },
  { title: 'ball',           code: 3,   module: 'shape' },
  { title: 'cylinder',       code: 1,   module: 'shape' },
  { title: 'prismatic',      code: 5,   module: 'shape' },
  { title: 'cone',           code: 2,   module: 'shape' },
  { title: 'pyramid',        code: 6,   module: 'shape' },
  { title: 'doughnut',       code: 4,   module: 'shape' },
  { title: 'hollowcylinder', code: 7,   module: 'shape' },
  { title: 'triprism',       code: 8,   module: 'shape' },
  { title: 'fivepointstar',  code: 11,  module: 'stl'   },
  { title: 'text',           code: 222, module: 'text'  },
];

export const CARTOON_LIST: PickItem[] = [
  { title: 'standing',         code: 0,  module: 'stl' },
  { title: 'climbing',         code: 1,  module: 'stl' },
  { title: 'lying',            code: 2,  module: 'stl' },
  { title: 'sitting',          code: 3,  module: 'stl' },
  { title: 'tyrannosaurusRex', code: 4,  module: 'stl' },
  { title: 'bulbasaur',        code: 5,  module: 'stl' },
  { title: 'charmander',       code: 6,  module: 'stl' },
  { title: 'chikorita',        code: 7,  module: 'stl' },
  { title: 'pikachu',          code: 8,  module: 'stl' },
  { title: 'squirtle',         code: 9,  module: 'stl' },
  { title: 'totodile',         code: 10, module: 'stl' },
];

export const COLOR_PALETTE = [
  '#dddddd', '#ffffff', '#f5f5dc', '#ffd700',
  '#f2f545', '#ffa040', '#ff6b6b', '#ff1493',
  '#c084fc', '#60a5fa', '#34d399', '#92400e',
];
