import { COLS_NUM, ROWS_NUM } from '../constats';
import Engine from '../engine';
import Cell from '../game/Cell';
import PlantCard from '../game/PlantCard';
import SunCount from '../game/SunCount';
import { LevelConfig, PlantType, ZombieConfig } from '../types';
import Plant from './Plant';
import Zombie from './Zombie';
import { FallingSun } from '../game/mechanics/FallingSun';
import { SunFlower } from './plants/SunFlower';
import { Peashooter } from './plants/Peashooter';

export default class Level {
  private zombiesArr: Zombie[] = [];

  private plantsArr: Plant[] = [];

  public sunCount: {suns: number} = { suns: 500 };

  public width: number = COLS_NUM;

  public height: number = ROWS_NUM;

  private zombiesConfig: ZombieConfig[];

  public plantTypes: PlantType[];

  private plantCards: PlantCard[];

  private engine: Engine;

  private cells: Cell[][];

  private preparedToPlant: PlantType | null;

  private occupiedCells: Map<Cell, Plant>;

  private sunCounter: SunCount;

  private sunFall: FallingSun;

  constructor(levelConfig: LevelConfig, engine: Engine, cells: Cell[][]) {
    this.zombiesConfig = levelConfig.zombies;
    this.plantTypes = levelConfig.plantTypes;
    this.engine = engine;
    this.plantCards = [];
    this.preparedToPlant = null;
    this.cells = cells;
    this.occupiedCells = new Map();
  }

  public init() {
    this.createSunCount();
    this.createPlantCards();
    this.listenCellClicks();
    this.createZombies();
    this.startLevel();
    return this;
  }

  public get zombies() {
    return this.zombiesArr;
  }

  public get plants() {
    return this.plantsArr;
  }

  public createPlant(type: PlantType) {
    let newPlant: Plant;
    switch (type) {
      case 'SunFlower':
        newPlant = new SunFlower(this.engine, this.updateSunCount.bind(this), this.sunCount);
        break;
      case 'Peashooter':
        newPlant = new Peashooter({ type }, this.engine);
        break;
      default:
        newPlant = new Plant({ type }, this.engine);
        break;
    }
    this.plantsArr.push(newPlant);
    return newPlant;
  }

  public createZombies() {
    const MS = 1000;

    function getRandomNumber(min: number, max: number) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const trackPosition = () => {
      this.zombies.forEach((zombieNode) => {
        if (zombieNode.node.position.x < 150 && zombieNode.node.position.x > 100) {
          this.zombies.forEach((zombie) => {
            zombie.stop();
          });
        } else {
          zombieNode.attack(this.occupiedCells);
        }
      });
      setTimeout(trackPosition, 1000);
    };

    for (let i: number = 0; i < this.zombiesConfig.length; i += 1) {
      let cell: Cell;
      let row: number;

      setTimeout(() => {
        row = getRandomNumber(0, ROWS_NUM - 1);
        const newZombie: Zombie = new Zombie(this.zombiesConfig[i], this.engine);
        cell = this.cells[i][row];
        newZombie.draw(cell, this.occupiedCells);
        this.zombiesArr.push(newZombie);
        trackPosition();
      }, this.zombiesConfig[i].startDelay * MS);
    }
  }

  private createSunCount() {
    this.sunCounter = new SunCount(this.engine, this.sunCount);
    this.sunCounter.draw();
  }

  public updateSunCount(newCount:number) {
    this.sunCount.suns = newCount;
    this.reDrawCardsAndCount();
  }

  private reDrawCardsAndCount() {
    this.plantCards.forEach((card) => {
      card.updateCardState();
    });
    this.sunCounter.update();
  }

  public prepareToPlant(plantType: PlantType) {
    this.preparedToPlant = plantType;
  }

  public resetPreparedPlant() {
    this.prepareToPlant = null;
  }

  private createPlantCards() {
    this.plantTypes.forEach((type, index) => {
      const card = new PlantCard(
        type, index, this.engine, this.sunCount, this.prepareToPlant.bind(this),
      );
      card.draw();
      this.plantCards.push(card);
    });
  }

  private listenCellClicks() {
    for (let x = 0; x < this.cells.length; x += 1) {
      for (let y = 0; y < this.cells[x].length; y += 1) {
        const cell = this.cells[x][y];
        this.engine.on(cell.node, 'click', () => {
          if (this.occupiedCells.has(cell)) {
            const plant = this.occupiedCells.get(cell);
            plant.switchState('attack');
          }
          if (this.preparedToPlant && !this.occupiedCells.has(cell)) {
            const plant = this.createPlant(this.preparedToPlant);
            plant.draw(cell);

            this.occupiedCells.set(cell, plant);

            this.updateSunCount(this.sunCount.suns - plant.cost);

            this.preparedToPlant = null;
          }
        });
      }
    }
  }

  startLevel() {
    this.dropSuns();
  }

  stopLevel() {
    this.sunFall.stop();
  }

  dropSuns() {
    this.sunFall = new FallingSun(
      this.engine, this.sunCount, this.cells, this.updateSunCount.bind(this),
    );
    this.sunFall.init();
  }
}
