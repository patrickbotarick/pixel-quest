// Server-only stand-in. The real Phaser bundle touches `window` at import
// time, so the SSR/Nitro graph must never load it. Gameplay imports Phaser
// only from the browser.
/** @type {any} */
let stub;
stub = new Proxy(function PhaserServerStub() {}, {
  get: () => stub,
  apply: () => stub,
  construct: () => stub,
});

export default stub;
export const AUTO = 0;
export const CANVAS = 1;
export const WEBGL = 2;
export const HEADLESS = 3;
export const Game = stub;
export const Scene = stub;
export const Scale = stub;
export const Math = stub;
export const GameObjects = stub;
export const Textures = stub;
export const Input = stub;
export const Cameras = stub;
export const Display = stub;
export const Tweens = stub;
export const Time = stub;
export const Sound = stub;
export const Loader = stub;
export const Physics = stub;
export const Plugins = stub;
export const Utils = stub;
export const Geom = stub;
export const Actions = stub;
export const Animations = stub;
export const Cache = stub;
export const Core = stub;
export const Data = stub;
export const Events = stub;
export const FX = stub;
export const Renderer = stub;
export const Scenes = stub;
export const Structs = stub;
export const Tilemaps = stub;
export const Create = stub;
export const Curves = stub;
export const DOM = stub;
export const BlendModes = stub;
export const ScaleModes = stub;
export const VERSION = "stub";
export const NONE = 0;
export const UP = 0;
export const DOWN = 1;
export const LEFT = 2;
export const RIGHT = 3;
export const FOREVER = -1;
