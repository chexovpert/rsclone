import { platform } from 'os';
import Engine from '../engine';
import Level from '../models/Level';
import Cell from './Cell';
import { LevelConfig } from '../types';
import levels from '../data/levels.json';
import { COLS_NUM, ROWS_NUM } from '../constats';
import LoaderScreen from './screens/LoaderScreen';
import WinScene from '../models/scenes/WinScene';
import LooseScene from '../models/scenes/LooseScene';
import Pause from '../models/scenes/Pause';
import ModalWindow from './ModalWindow';
import { StartScreen } from './screens/StartScreen';

import sounds from '../data/audio.json';

const X_HOME = 150;

export default class Game {
  private engine: Engine;

  private cells: Cell[][];

  private win: WinScene;

  private loose: LooseScene;

  private modalWindow: ModalWindow;

  public currentLevel: Level;

  public pause: Pause;

  private timer: any;

  private isEnd: boolean;

  public restZombies: number;

  constructor(engine: Engine) {
    this.engine = engine;
    this.cells = [];
  }

  public init() {
    this.setupGame();
    // const loaderScreen = new LoaderScreen(this.engine, this.startGame.bind(this));
    const loaderScreen = new LoaderScreen(this.engine, this.runFirstScreen.bind(this));
    this.engine.preloadFiles(
      () => loaderScreen.create(),
      (percent: number) => loaderScreen.update(percent),
      () => this.engine.addAudio(sounds),
    );
  }

  setupGame() {
    const { engine } = this;
    engine.createView(['back', 'main', 'top']);
    engine.getLayer('main').view.move(engine.vector(0, 0));
    engine.createScene('scene', function Scene() {
      this.update = () => {
        // code;
      };
    });
    this.engine.start('scene');
  }

  runFirstScreen(): void {
    const startGameScreen = new StartScreen(this.engine, this.startGame.bind(this));
    this.engine.setScreen('startScreen');
  }

  startGame() {
    // this.engine.audioPlayer.playSound('menu');
    this.createCells();
    this.addPause();
    this.currentLevel = this.createLevel(0);
    this.engine.setScreen('first');
  }

  createCells() {
    for (let x = 0; x < COLS_NUM; x += 1) {
      const row: Cell[] = [];
      for (let y = 0; y < ROWS_NUM; y += 1) {
        const cell = new Cell({ x, y }, this.engine);
        cell.draw();
        row.push(cell);
      }
      this.cells.push(row);
    }
  }

  createLevel(levelIndex: number) {
    this.isEnd = false;
    this.currentLevel = new Level(levels[levelIndex] as LevelConfig, this.engine, this.cells);
    this.currentLevel.init();
    this.endGame();
    return this.currentLevel;
  }

  endGame() {
    const trackPosition = () => {
      if (this.currentLevel) {
        this.restZombies = this.currentLevel.getRestZombies();
        if (this.restZombies <= 0) {
          this.endWin();
        }

        this.currentLevel.zombiesArr.forEach((zombie) => {
          if (zombie.position && zombie.position.x < X_HOME) {
            this.endLoose();
          }
        });
      }
      if (!this.isEnd) this.timer = setTimeout(trackPosition, 1000);
    };
    trackPosition();
  }

  endWin() {
    this.isEnd = true;
    this.reducePlantsHealth();
    this.currentLevel.stopLevel();
    this.currentLevel.clearZombieArray();
    this.currentLevel.clearPlantsArray();
    this.engine.clearAllTimeouts();

    setTimeout(() => {
      this.createWinScene();
      this.currentLevel.updateSunCount(500);
    }, 5000);
    setTimeout(() => {
      this.clearLevel();
    }, 8000);
    setTimeout(() => {
      this.createLevel(0);
    }, 12000);

    clearTimeout(this.timer);
  }

  endLoose() {
    this.isEnd = true;
    this.currentLevel.stopLevel();
    this.destroySun();
    this.reducePlantsHealth();
    this.destroyPlants();
    this.engine.clearAllTimeouts();
    this.createLooseScene();
    this.currentLevel.clearZombieArray();
    this.currentLevel.clearPlantsArray();
    clearTimeout(this.timer);
  }

  clearLevel() {
    let allNodes = this.engine.getSceneNodes('scene');
    allNodes = allNodes.filter((el) => el.type === 'SpriteNode');

    allNodes.forEach((node) => {
      node.destroy();
    });

    this.engine.clearAllTimeouts();
  }

  destroySun() {
    let sun = this.engine.getSceneNodes('scene');
    sun = sun.filter((node) => node.type === 'SpriteNode');
    sun = sun.filter((node) => node.name === 'sun');
    sun.forEach((node) => node.destroy());
  }

  destroyPlants() {
    const plants = this.currentLevel.getPlants();
    plants.forEach((plant) => {
      plant.reduceAllHealth();
      plant.destroy();
    });
  }

  stopCreatingSuns() {
    const plants = this.currentLevel.getPlants();
    plants.forEach((plant) => {
      plant.stop();
    });
  }

  continueCreatingSuns() {
    const plants = this.currentLevel.getPlants();
    for (let i = 0; i < plants.length; i += 1) {
      setTimeout(() => {
        plants[i].continue();
      }, i * 2000);
    }
  }

  reducePlantsHealth() {
    const plants = this.currentLevel.getPlants();
    plants.forEach((plant) => {
      plant.reduceAllHealth();
      plant.stop();
    });
  }

  createWinScene() {
    this.win = new WinScene(this.engine);
    this.win.init();
  }

  public createLooseScene() {
    this.loose = new LooseScene(this.engine);
    this.loose.init();

    this.loose.restartLevel(() => {
      this.clearLevel();
      this.createLevel(0);
      this.currentLevel.updateSunCount(500);
    });
  }

  createPauseScene() {
    this.pause = new Pause(this.engine);
    this.pause.init();
  }

  stopGame() {
    this.engine.stop();
    this.engine.clearAllTimeouts();
    this.createPauseScene();
    this.stopCreatingSuns();
  }

  resumeGame() {
    this.engine.start('scene');
    this.currentLevel.resumeSunFall();
    this.currentLevel.continueCreatingZombies();
    this.continueCreatingSuns();
  }

  addPause() {
    let isOpen: boolean = false;

    document.addEventListener('visibilitychange', () => {
      if (!isOpen) {
        isOpen = true;
        this.stopGame();

        this.pause.resumeGame(() => {
          isOpen = false;
          this.resumeGame();
        });
      }
    });

    if (!isOpen) {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!isOpen) {
            isOpen = true;
            this.stopGame();

            this.pause.resumeGame(() => {
              isOpen = false;
              this.resumeGame();
            });
          }
        }
      });
    }
  }
}
