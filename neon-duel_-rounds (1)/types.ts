
export enum GamePhase {
  INTRO,
  MENU,
  TUTORIAL,
  WEAPON_SELECT,
  PLAYING,
  ROUND_OVER,
  CARD_SELECT,
  GAME_OVER
}

export type Language = 'en' | 'zh';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: string;
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'blood' | 'dust' | 'text' | 'ring' | 'slash' | 'black_hole' | 'debris' | 'rain';
  text?: string;
  rotation?: number; // For slash effects
}

export interface Projectile {
  id: string;
  ownerId: number;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  damage: number;
  color: string;
  life: number;
  onHitEffect?: (target: PlayerEntity, shooter: PlayerEntity) => void;
  isBlockable: boolean;
  homing?: boolean;
}

export interface WeaponStats {
  id: string;
  name: string;
  description: string;
  range: number;
  damage: number;
  knockback: number;
  cooldown: number; // frames
  windup: number; // frames before hit
  color: string;
  type: 'sword' | 'spear' | 'hammer' | 'daggers';
  speedModifier: number; // 1.0 is normal, 0.8 is slow, 1.2 is fast
}

export interface PlayerEntity {
  id: number;
  pos: Vector2;
  prevPos: Vector2; // For raycast collision
  deathPos?: Vector2; // Where they died (for camera lock)
  vel: Vector2;
  acc: Vector2; // Accumulate forces
  width: number;
  height: number;
  color: string;
  
  // Stats
  hp: number;
  maxHp: number;
  speed: number;
  jumpForce: number;
  jumpsLeft: number;
  maxJumps: number;
  
  // Combat State
  facing: 1 | -1;
  isGrounded: boolean;
  isBlocking: boolean;
  blockCooldown: number;
  attackCooldown: number;
  
  // Combo System
  attackFrame: number; // 0 = idle, > 0 = attacking
  comboCount: number; // 0, 1, 2
  lastAttackTime: number; // For resetting combos

  hitStun: number;
  invincible: number;
  
  // Visuals
  squashX: number;
  squashY: number;
  rotation: number;
  handOffset: Vector2; // For floating hands
  trail: Vector2[]; // Weapon tip history for drawing trails
  
  // Life State
  isDead: boolean;
  deathTimer: number;

  // Equipment/Buffs
  weapon: WeaponStats;
  modifiers: string[]; // List of card IDs applied
}

export interface Card {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  color: string;
  apply: (player: PlayerEntity) => void;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapElement {
    type: 'jumppad' | 'fan';
    x: number;
    y: number;
    w: number;
    h: number;
    power: number; // Force magnitude
    direction?: Vector2; // For fans
}
  
export interface RotatingHazard {
    x: number;
    y: number;
    length: number;
    speed: number;
    angle: number; // Current angle
    size: number; // Ball size
}

export interface MapData {
  id: string;
  name: string;
  theme: 'cyber' | 'magma' | 'sky' | 'factory';
  platforms: Platform[];
  spawnPoints: [Vector2, Vector2]; // Explicit P1 and P2 spawns
  hazardY?: number; // Y level where hazard (lava) starts
  elements?: MapElement[];
  hazards?: RotatingHazard[];
}

export interface GameState {
  phase: GamePhase;
  players: PlayerEntity[];
  round: number;
  scores: [number, number];
  winnerId: number | null;
  loserId: number | null;
  map: MapData;
}
