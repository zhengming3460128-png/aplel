
import { Card, PlayerEntity, MapData, Language, WeaponStats } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const GRAVITY = 0.8;
export const FRICTION = 0.82;
export const AIR_RESISTANCE = 0.96;
export const WIN_SCORE = 10;

export const TEXT_CONTENT = {
  en: {
    intro_1: "YEAR 2150. THE NEON CITY SLEEPS.",
    intro_2: "BUT THE SYSTEM IS CORRUPTED.",
    intro_p1: "BLUE RONIN: KEEPER OF THE CODE.",
    intro_p2: "RED PHANTOM: AGENT OF CHAOS.",
    intro_final: "THERE CAN BE ONLY ONE.",
    intro_press: "PRESS ANY KEY TO START",
    menu_title: "NEON DUEL",
    menu_subtitle: "ROUNDS PROTOTYPE",
    menu_start: "START FIGHT",
    menu_tutorial: "TUTORIAL",
    menu_created: "CREATED BY APPLE",
    p1_controls: ["WASD to Move", "F to Attack", "G to Block"],
    p2_controls: ["ARROWS / IJKL to Move", "K / 1 to Attack", "L / 2 to Block"],
    tut_title: "TRAINING MODULE",
    tut_move: "PRESS A / D TO MOVE",
    tut_jump: "PRESS W TO JUMP (X2 FOR DOUBLE)",
    tut_attack: "PRESS F TO ATTACK",
    tut_complete: "COMPLETE!",
    tut_exit: "FINISH TUTORIAL",
    game_over_win: "WINS THE MATCH!",
    score: "Score",
    play_again: "PLAY AGAIN",
    weapon_select: "SELECT WEAPON",
    p1_select: "PLAYER 1",
    p2_select: "PLAYER 2",
    confirm_loadout: "CONFIRM LOADOUT"
  },
  zh: {
    intro_1: "公元2150年。霓虹之城沉睡中。",
    intro_2: "系统已然腐朽。",
    intro_p1: "蓝之浪人：代码守护者。",
    intro_p2: "赤色幽灵：混沌代理人。",
    intro_final: "决战时刻，胜者为王。",
    intro_press: "按任意键开始",
    menu_title: "霓虹决斗",
    menu_subtitle: "回合制格斗原型",
    menu_start: "开始战斗",
    menu_tutorial: "新手教程",
    menu_created: "Created by Apple",
    p1_controls: ["WASD 移动", "F 攻击", "G 格挡"],
    p2_controls: ["方向键 / IJKL 移动", "K / 1 攻击", "L / 2 格挡"],
    tut_title: "战斗模拟训练",
    tut_move: "按 A / D 左右移动",
    tut_jump: "按 W 跳跃 (按两次二段跳)",
    tut_attack: "按 F 进行攻击",
    tut_complete: "训练完成！",
    tut_exit: "结束教程",
    game_over_win: "赢得比赛！",
    score: "比分",
    play_again: "再战一局",
    weapon_select: "选择初始武器",
    p1_select: "玩家 1",
    p2_select: "玩家 2",
    confirm_loadout: "确认装备"
  }
};

export const STARTING_WEAPONS: WeaponStats[] = [
  {
    id: 'katana',
    name: 'Beam Katana',
    description: 'Balanced. The standard for duelists.',
    range: 100,
    damage: 15,
    knockback: 10,
    cooldown: 15,
    windup: 5,
    color: '#60a5fa', // Blue-ish default, will be overridden by player color
    type: 'sword',
    speedModifier: 1.0
  },
  {
    id: 'hammer',
    name: 'Grav-Hammer',
    description: 'High DMG & Knockback. Slow movement.',
    range: 80,
    damage: 25,
    knockback: 25,
    cooldown: 35,
    windup: 12,
    color: '#f59e0b',
    type: 'hammer',
    speedModifier: 0.85
  },
  {
    id: 'daggers',
    name: 'Twin Daggers',
    description: 'Fast ATK & Movement. Low Range.',
    range: 60,
    damage: 8,
    knockback: 5,
    cooldown: 5,
    windup: 2,
    color: '#10b981',
    type: 'daggers',
    speedModifier: 1.15
  },
  {
    id: 'spear',
    name: 'Plasma Pike',
    description: 'Long Range. Keep enemies at bay.',
    range: 160,
    damage: 12,
    knockback: 12,
    cooldown: 20,
    windup: 8,
    color: '#c084fc',
    type: 'spear',
    speedModifier: 0.95
  }
];

// Initial Stats
export const INITIAL_PLAYER_STATS = (id: number, x: number, y: number, color: string, weapon?: WeaponStats): PlayerEntity => ({
  id,
  pos: { x, y }, 
  prevPos: { x, y },
  vel: { x: 0, y: 0 },
  acc: { x: 0, y: 0 },
  width: 40,
  height: 60,
  color,
  hp: 100,
  maxHp: 100,
  speed: 1.5,
  jumpForce: 18,
  jumpsLeft: 2, // Double Jump enabled by default
  maxJumps: 2,
  facing: id === 1 ? 1 : -1,
  isGrounded: false,
  isBlocking: false,
  blockCooldown: 0,
  attackCooldown: 0,
  attackFrame: 0,
  comboCount: 0,
  lastAttackTime: 0,
  hitStun: 0,
  invincible: 60, // Start with 1 second of invincibility to prevent spawn kills
  squashX: 1,
  squashY: 1,
  rotation: 0,
  handOffset: { x: 0, y: 0 },
  trail: [],
  isDead: false,
  deathTimer: 0,
  modifiers: [],
  weapon: weapon ? {...weapon, color} : { ...STARTING_WEAPONS[0], color }
});

// Colors by Rarity
const COLOR_COMMON = '#e5e7eb'; // Gray 200
const COLOR_RARE = '#22d3ee';   // Cyan 400
const COLOR_LEGENDARY = '#facc15'; // Yellow 400

// Creative Card Database
export const AVAILABLE_CARDS: Card[] = [
  {
    id: 'black_hole_blade',
    name: 'Singularity Edge',
    description: 'Attacks have a 25% chance to spawn a Black Hole that sucks enemies in.',
    rarity: 'legendary',
    color: COLOR_LEGENDARY,
    apply: (p) => p.modifiers.push('black_hole')
  },
  {
    id: 'rocket_boots',
    name: 'Rocket Boots',
    description: 'Jumping creates an explosion at your feet. Deals damage and jumps higher.',
    rarity: 'rare',
    color: COLOR_RARE,
    apply: (p) => {
      p.modifiers.push('rocket_jump');
      p.jumpForce *= 1.2;
    }
  },
  {
    id: 'shotgun_blast',
    name: 'Buckshot',
    description: 'Attacks fire 5 inaccurate projectiles instead of 1.',
    rarity: 'rare',
    color: COLOR_RARE,
    apply: (p) => {
        p.modifiers.push('projectile_attack');
        p.modifiers.push('shotgun');
    }
  },
  {
    id: 'glass_titan',
    name: 'Glass Titan',
    description: '+400% Damage, +100% Size, but you have 10% HP.',
    rarity: 'legendary',
    color: COLOR_LEGENDARY,
    apply: (p) => {
      p.weapon.damage *= 5;
      p.weapon.range *= 1.5;
      p.width *= 1.5;
      p.height *= 1.5;
      p.maxHp = Math.floor(p.maxHp * 0.1);
      p.hp = Math.min(p.hp, p.maxHp);
    }
  },
  {
    id: 'ice_aspect',
    name: 'Permafrost',
    description: 'Attacks freeze enemies, slowing them by 60% for 2s.',
    rarity: 'rare',
    color: COLOR_RARE,
    apply: (p) => p.modifiers.push('freeze')
  },
  {
    id: 'phase_shield',
    name: 'Phase Shift',
    description: 'Blocking makes you invisible and intangible for 1s. Teleport forward slightly.',
    rarity: 'rare',
    color: COLOR_RARE,
    apply: (p) => p.modifiers.push('phase_block')
  },
  {
    id: 'homing_missiles',
    name: 'Smart Bullets',
    description: 'Your projectiles chase the enemy.',
    rarity: 'legendary',
    color: COLOR_LEGENDARY,
    apply: (p) => {
        p.modifiers.push('projectile_attack');
        p.modifiers.push('homing');
    }
  },
  {
    id: 'vampire_lord',
    name: 'Blood Lord',
    description: 'Lifesteal 50%. Max HP drains slowly over time.',
    rarity: 'legendary',
    color: COLOR_LEGENDARY,
    apply: (p) => p.modifiers.push('vampire')
  },
  {
    id: 'curse_aura',
    name: 'Thorns Aura',
    description: 'Enemies take damage when they are near you.',
    rarity: 'common',
    color: COLOR_COMMON,
    apply: (p) => p.modifiers.push('aura')
  },
  {
    id: 'triple_jump',
    name: 'Aerial Ace',
    description: '+1 Jump. Air control increased.',
    rarity: 'common',
    color: COLOR_COMMON,
    apply: (p) => {
        p.maxJumps += 1;
        p.jumpsLeft += 1;
    }
  }
];

export const MAPS: MapData[] = [
  {
    id: 'cyber_arena',
    name: 'Neon Arena',
    theme: 'cyber',
    spawnPoints: [{x: 200, y: 500}, {x: 1000, y: 500}],
    platforms: [
      { x: 100, y: 600, w: 1000, h: 50 }, // Main floor
      { x: 300, y: 450, w: 200, h: 20 }, // Left Plat
      { x: 700, y: 450, w: 200, h: 20 }, // Right Plat
      { x: 500, y: 250, w: 200, h: 20 }, // Top Plat
    ],
    elements: [
        { type: 'jumppad', x: 550, y: 590, w: 100, h: 10, power: 25 } // Center jump pad
    ]
  },
  {
    id: 'magma_chamber',
    name: 'Magma Core',
    theme: 'magma',
    hazardY: 720,
    spawnPoints: [{x: 150, y: 400}, {x: 950, y: 400}],
    platforms: [
      { x: 50, y: 500, w: 300, h: 40 }, // Left Island
      { x: 850, y: 500, w: 300, h: 40 }, // Right Island
      { x: 450, y: 600, w: 300, h: 20 }, // Low mid stone
      { x: 500, y: 200, w: 200, h: 20 }, // High mid
    ],
    hazards: [
        { x: 600, y: 400, length: 150, speed: 0.05, angle: 0, size: 30 } // Rotating death ball in middle
    ]
  },
  {
    id: 'sky_sanctuary',
    name: 'Sky Sanctuary',
    theme: 'sky',
    spawnPoints: [{x: 150, y: 400}, {x: 1000, y: 400}],
    platforms: [
      { x: 400, y: 700, w: 400, h: 40 }, // Base
      { x: 100, y: 500, w: 150, h: 20 }, // Far Left
      { x: 950, y: 500, w: 150, h: 20 }, // Far Right
      { x: 300, y: 350, w: 100, h: 20 }, 
      { x: 800, y: 350, w: 100, h: 20 },
      { x: 500, y: 150, w: 200, h: 20 }, // Top
    ],
    elements: [
        { type: 'fan', x: 100, y: 600, w: 100, h: 200, power: 1.5, direction: {x: 0, y: -1} }, // Left Updraft
        { type: 'fan', x: 1000, y: 600, w: 100, h: 200, power: 1.5, direction: {x: 0, y: -1} }, // Right Updraft
    ]
  },
  {
    id: 'factory_forge',
    name: 'Hazard Factory',
    theme: 'factory',
    spawnPoints: [{x: 100, y: 250}, {x: 1100, y: 250}],
    platforms: [
        { x: 0, y: 300, w: 250, h: 20 }, // Top Left Spawn
        { x: 950, y: 300, w: 250, h: 20 }, // Top Right Spawn
        { x: 300, y: 500, w: 600, h: 20 }, // Middle Belt
        { x: 100, y: 700, w: 300, h: 20 }, // Low Left
        { x: 800, y: 700, w: 300, h: 20 }  // Low Right
    ],
    elements: [
        { type: 'fan', x: 300, y: 490, w: 600, h: 10, power: 2, direction: {x: 1, y: 0} }, // Conveyor Belt (Right)
    ],
    hazards: [
        { x: 600, y: 510, length: 120, speed: 0.08, angle: 0, size: 25 },
        { x: 600, y: 510, length: 120, speed: 0.08, angle: 3.14, size: 25 } // Double Blade
    ]
  }
];
