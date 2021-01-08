export interface Engine {
  size: IVector;
  canvasOffset: IVector;
  screens: { [name: string]: ILayer[] };
  activeScreen: string;
  layers: { [name: string]: ILayer };
  container: HTMLElement;

  vector: (x?: number, y?: number) => IVector;

  init: (_box: string | HTMLElement, config?: string[] | { [name: string]: string[] }) => void;
  start: (name: string) => void;
  stop: () => void;

  createScreen: (name: string, layersNames: string[]) => void;
  setScreen: (name: string) => void;

  createLayer: (name: string, index: number) => void;
  getLayer: (name: string) => ILayer;

  createScene: (name: string, Construct?: any) => void;
  getSceneNodes: (name: string) => NodesType[];

  createNode: (params: any, update?: () => void) => NodesType;

  createView: (layersNames: string[]) => IView;
}

export interface IVector {
  x: number;
  y: number;

  plus: (IVector: any) => IVector;
  minus: (IVector: any) => IVector;
}

export type NodesTypeName =
  | 'Node'
  | 'RectNode'
  | 'CircleNode'
  | 'TextNode'
  | 'ImageNode'
  | 'SpriteNode';
export type NodesType = IImageNode | IRectNode | ICircleNode | ISpriteNode | ITextNode;

export interface INode {
  position: IVector;
  size: IVector;
  type: NodesTypeName;
  layer: ILayer;
  sceneName: string;
  border?: string;

  move: (IVector: any) => void;
  addTo: (sceneName: string) => NodesType;
  update?: (node: NodesType) => void;
  destroy: () => void;
  clearLayer: () => void;
}

export interface IRectNode extends INode {
  color: string;

  draw: () => void;
}

export interface ICircleNode extends INode {
  color: string;
  radius: number;

  draw: () => void;
  innerUpdate: () => void;
}

export interface ITextNode extends INode {
  color: string;
  font: string;
  fontSize: number;
  text: string;

  draw: () => void;
}

export interface IImageNode extends INode {
  img: HTMLImageElement;
  srcX: number;
  srcY: number;
  dh: number;
  dw: number;

  draw: () => void;
}

export interface SpriteStatesConfig {
  [dynamic: string]: {
    img: HTMLImageElement;
    frames: number;
    speed?: number;
    dh?: number;
    startFrame?: number;
    positionAdjust?: IVector;
    size?: IVector;
  };
}

export interface ISpriteNode extends INode {
  img: HTMLImageElement;
  dh: number;
  dw: number;
  srcX: number;
  srcY: number;
  frameW: number;
  frameH: number;
  frames: number;
  startFrame: number;
  speed: number;

  draw: () => void;
  innerUpdate: () => void;
  switchState: (state: string) => void;
}

export interface IScene {
  scene: SceneConfig;

  init: () => void;
  updateNodes: () => void;
  update: () => void;
  draw: () => void;
  drawNodes: () => void;
  exit: () => void;
  clear: () => void;
}

export interface ILayer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  size: IVector;
  offset: IVector;
  view: IView;
  nodes: NodesType[];
  screen: string;

  toTop: (n?: number) => void;
  toBack: (n?: number) => void;

  drawRect: (RectConfig: any) => void;
  drawCircle: (CircleConfig: any) => void;
  drawText: (TextConfig: any) => void;
  drawImage: (ImageConfig: any) => void;
  clear: () => void;
  update: () => void;
}

export interface IView {
  position: IVector;
  layers: ILayer[];

  move: (IVector: any) => void;
  getPosition: (IVector: any) => IVector;
}

export interface NodeConfig {
  position: IVector;
  size: IVector;
  type: NodesTypeName;
  layer: ILayer;
  border?: string;
}

export interface RectNodeConfig extends NodeConfig {
  color?: string;
}

export interface CircleNodeConfig extends NodeConfig {
  color?: string;
  radius: number;
}

export interface TextNodeConfig extends NodeConfig {
  color?: string;
  font?: string;
  fontSize?: number;
  text: string;
}

export interface ImageNodeConfig extends NodeConfig {
  img: HTMLImageElement;
  srcPosition?: IVector;
  dh?: number;
}

export interface SpriteNodeConfig extends NodeConfig {
  img: HTMLImageElement;
  dh?: number;
  frames: number;
  startFrame?: number;
  speed?: number;
  states: SpriteStatesConfig;
}

export interface RectConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  border?: string;
}

export interface CircleConfig {
  x: number;
  y: number;
  radius: number;
  color?: string;
  border?: string;
}

export interface TextConfig {
  x: number;
  y: number;
  text: string;
  font?: string;
  size?: number;
  color?: string;
  border?: string;
}

export interface ImageConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  img: HTMLImageElement;
  srcX: number;
  srcY: number;
  dh: number;
  dw: number;
  border?: string;
}

export interface SceneConfig {
  layer: ILayer;
  nodes: NodesType[];

  init?: () => void;
  update?: () => void;
  draw?: () => void;
  exit?: () => void;
}
