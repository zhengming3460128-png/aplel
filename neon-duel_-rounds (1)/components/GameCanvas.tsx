
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, AIR_RESISTANCE, 
  INITIAL_PLAYER_STATS, MAPS, TEXT_CONTENT 
} from '../constants';
import { PlayerEntity, Platform, Particle, GamePhase, Card, Projectile, MapData, Language, WeaponStats } from '../types';

interface GameCanvasProps {
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;
  onRoundOver: (winnerId: number, loserId: number) => void;
  activeRound: number;
  winner: number | null;
  selectedCardsP1: Card[];
  selectedCardsP2: Card[];
  language: Language;
  p1Weapon: WeaponStats;
  p2Weapon: WeaponStats;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
  phase, setPhase, onRoundOver, activeRound, selectedCardsP1, selectedCardsP2, language, p1Weapon, p2Weapon 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const text = TEXT_CONTENT[language];
  
  // Game State Refs
  const playersRef = useRef<PlayerEntity[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mapRef = useRef<MapData>(MAPS[0]);
  const keysRef = useRef<Set<string>>(new Set());
  
  // Logic Refs
  const phaseRef = useRef(phase);
  const onRoundOverRef = useRef(onRoundOver);
  const animationFrameRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const roundEndingRef = useRef<boolean>(false);
  const roundStartFrameRef = useRef<number>(0); // Safety check for instant win

  // Intro Refs
  const introFrameRef = useRef<number>(0);
  const rainRef = useRef<{x: number, y: number, speed: number, len: number}[]>([]);

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorialProgressRef = useRef<{move: boolean, jump: boolean, attack: boolean}>({move:false, jump:false, attack:false});

  // Sync refs with props
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { onRoundOverRef.current = onRoundOver; }, [onRoundOver]);
  
  // Visual & Feel Refs
  const cameraRef = useRef<{x: number, y: number, zoom: number}>({ x: 0, y: 0, zoom: 1 });
  const shakeRef = useRef<number>(0);
  const hitStopRef = useRef<number>(0); // Freeze frames

  // Initialize Rain for Intro
  useEffect(() => {
    rainRef.current = Array.from({length: 100}, () => ({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 15 + Math.random() * 10,
        len: 10 + Math.random() * 20
    }));
  }, []);

  // --- INITIALIZATION ---
  const initRound = useCallback(() => {
    let selectedMap = MAPS[0];
    
    if (phaseRef.current === GamePhase.TUTORIAL) {
        selectedMap = {
            id: 'tutorial',
            name: 'Training Simulation',
            theme: 'cyber',
            spawnPoints: [{x: 200, y: 500}, {x: 600, y: 300}],
            platforms: [
                { x: 100, y: 600, w: 1000, h: 50 },
                { x: 500, y: 400, w: 200, h: 20 }
            ]
        };
        setTutorialStep(0);
        tutorialProgressRef.current = {move:false, jump:false, attack:false};
    } else {
        const mapIndex = Math.floor(Math.random() * MAPS.length);
        selectedMap = JSON.parse(JSON.stringify(MAPS[mapIndex]));
    }
    
    mapRef.current = selectedMap;
    
    projectilesRef.current = [];
    particlesRef.current = [];
    shakeRef.current = 0;
    hitStopRef.current = 0;
    frameRef.current = 0;
    roundStartFrameRef.current = 0;
    roundEndingRef.current = false;

    // EXPLICIT SPAWN LOGIC - FIXES FLOATING BUG
    const p1Spawn = selectedMap.spawnPoints[0];
    const p2Spawn = selectedMap.spawnPoints[1];

    // Apply selected weapons
    const p1 = INITIAL_PLAYER_STATS(1, p1Spawn.x, p1Spawn.y, '#3b82f6', p1Weapon); // Blue
    const p2 = INITIAL_PLAYER_STATS(2, p2Spawn.x, p2Spawn.y, '#ef4444', p2Weapon); // Red

    // Re-apply cards
    if (phaseRef.current === GamePhase.PLAYING) {
        const applyCards = (player: PlayerEntity, cards: Card[]) => {
            cards.forEach(c => c.apply(player));
        };
        applyCards(p1, selectedCardsP1);
        applyCards(p2, selectedCardsP2);
    }

    // Initial HP calculation
    p1.hp = p1.maxHp;
    p2.hp = p2.maxHp;

    playersRef.current = [p1, p2];
  }, [selectedCardsP1, selectedCardsP2, p1Weapon, p2Weapon]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent scrolling with arrows
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
        keysRef.current.add(e.key.toLowerCase());
        
        // Skip Intro
        if (phaseRef.current === GamePhase.INTRO) {
            setPhase(GamePhase.MENU);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Init on mount if needed
    if (playersRef.current.length === 0) initRound();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initRound, setPhase]);

  // Phase Handling
  useEffect(() => {
    if (phase === GamePhase.PLAYING || phase === GamePhase.TUTORIAL) initRound();
  }, [phase, initRound]);

  // --- HELPER FUNCTIONS ---
  const createParticles = (x: number, y: number, count: number, color: string, type: Particle['type'], options?: { speed?: number, size?: number, text?: string }) => {
    for (let i = 0; i < count; i++) {
      const speed = options?.speed || 10;
      particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: { 
            x: (Math.random() - 0.5) * speed, 
            y: (Math.random() - 0.5) * speed 
        },
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color,
        size: options?.size || (Math.random() * 4 + 2),
        type,
        text: options?.text
      });
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
      // Debris
      for(let i=0; i<30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 5;
          particlesRef.current.push({
              id: Math.random().toString(),
              pos: {x, y},
              vel: {x: Math.cos(angle)*speed, y: Math.sin(angle)*speed},
              life: 60 + Math.random() * 20,
              maxLife: 80,
              color: color,
              size: Math.random() * 8 + 4,
              type: 'debris'
          });
      }
      // Flash
      createParticles(x, y, 20, '#fff', 'spark', {speed: 15, size: 3});
      // Shockwave
      createParticles(x, y, 1, '#fff', 'ring', {size: 10});
  };

  const createSlash = (x: number, y: number, facing: number, color: string, type: 'up' | 'down' | 'heavy') => {
      let rotation = 0;
      if (type === 'down') rotation = facing === 1 ? 0 : Math.PI; // Standard
      if (type === 'up') rotation = facing === 1 ? -0.5 : Math.PI + 0.5;
      if (type === 'heavy') rotation = facing === 1 ? 0.2 : Math.PI - 0.2;

      particlesRef.current.push({
          id: Math.random().toString(),
          pos: { x, y },
          vel: { x: facing * 2, y: 0 },
          life: 12,
          maxLife: 12,
          color,
          size: 100,
          type: 'slash',
          rotation
      });
  };

  const createBlackHole = (x: number, y: number) => {
    particlesRef.current.push({
        id: Math.random().toString(),
        pos: { x, y },
        vel: { x: 0, y: 0 },
        life: 180, // 3 seconds
        maxLife: 180,
        color: '#000',
        size: 5, // Grows
        type: 'black_hole'
    });
  };

  const createJumpRing = (x: number, y: number) => {
    particlesRef.current.push({
      id: Math.random().toString(),
      pos: { x, y },
      vel: { x: 0, y: 0 },
      life: 15,
      maxLife: 15,
      color: '#fff',
      size: 10,
      type: 'ring'
    });
  };

  // --- GAME LOOP ---
  const update = () => {
    if (phaseRef.current === GamePhase.INTRO) {
        introFrameRef.current++;
        // Update Rain
        rainRef.current.forEach(r => {
            r.y += r.speed;
            if (r.y > CANVAS_HEIGHT) {
                r.y = -r.len;
                r.x = Math.random() * CANVAS_WIDTH;
            }
        });
        if (introFrameRef.current > 700) setPhase(GamePhase.MENU);
        return;
    }

    frameRef.current++;
    roundStartFrameRef.current++; // Grace period tracking
    const players = playersRef.current;
    
    // Safety check for race condition spawn bug
    if (players.length < 2) {
        if (roundStartFrameRef.current < 10) initRound();
        return;
    }

    // 1. Hit Stop Check
    if (hitStopRef.current > 0) {
        hitStopRef.current--;
        shakeRef.current *= 0.9;
        return;
    }

    // 2. Camera Logic (Modified for Death)
    if (players.length === 2) {
        const p1 = players[0];
        const p2 = players[1];
        
        let targetX = (p1.pos.x + p2.pos.x) / 2;
        let targetY = (p1.pos.y + p2.pos.y) / 2;
        let zoomTargetDist = Math.abs(p1.pos.x - p2.pos.x) + 400;
        
        // Lock camera on death location
        if (p1.isDead && p1.deathPos) { 
            targetX = p1.deathPos.x; 
            targetY = p1.deathPos.y; 
            zoomTargetDist = 400; // Zoom in on kill
        }
        else if (p2.isDead && p2.deathPos) { 
            targetX = p2.deathPos.x; 
            targetY = p2.deathPos.y; 
            zoomTargetDist = 400;
        }

        const targetZoom = Math.min(1.5, Math.max(0.6, CANVAS_WIDTH / zoomTargetDist));
        
        cameraRef.current.x += (targetX - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (targetY - cameraRef.current.y) * 0.1;
        cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.05;
    }

    // 3. Shake Decay
    if (shakeRef.current > 0) shakeRef.current *= 0.9;
    if (Math.abs(shakeRef.current) < 0.5) shakeRef.current = 0;

    // 4. Update Hazards
    if (mapRef.current.hazards) {
        mapRef.current.hazards.forEach(h => {
            h.angle += h.speed;
            const ballX = h.x + Math.cos(h.angle) * h.length;
            const ballY = h.y + Math.sin(h.angle) * h.length;

            players.forEach(p => {
                if (p.isDead) return;
                const dx = p.pos.x - ballX;
                const dy = (p.pos.y - 40) - ballY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < h.size + p.width/2 && p.invincible <= 0) {
                     p.hp -= 20;
                     const angleToPlayer = Math.atan2(dy, dx);
                     p.vel.x = Math.cos(angleToPlayer) * 20;
                     p.vel.y = Math.sin(angleToPlayer) * 20;
                     p.hitStun = 20;
                     p.invincible = 30;
                     shakeRef.current = 15;
                     createParticles(p.pos.x, p.pos.y, 20, p.color, 'blood');
                }
            });
        });
    }

    // 5. Update Projectiles
    for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        
        if (proj.homing) {
            const target = players.find(p => p.id !== proj.ownerId && !p.isDead);
            if (target) {
                const angle = Math.atan2(target.pos.y - proj.pos.y, target.pos.x - proj.pos.x);
                proj.vel.x += Math.cos(angle) * 1.5;
                proj.vel.y += Math.sin(angle) * 1.5;
                const speed = Math.sqrt(proj.vel.x**2 + proj.vel.y**2);
                if (speed > 15) {
                    proj.vel.x = (proj.vel.x / speed) * 15;
                    proj.vel.y = (proj.vel.y / speed) * 15;
                }
            }
        }

        proj.pos.x += proj.vel.x;
        proj.pos.y += proj.vel.y;
        proj.life--;

        let hitMap = false;
        for (const plat of mapRef.current.platforms) {
            if (proj.pos.x > plat.x && proj.pos.x < plat.x + plat.w &&
                proj.pos.y > plat.y && proj.pos.y < plat.y + plat.h) {
                hitMap = true;
            }
        }

        let hitPlayer = false;
        for (const p of players) {
            if (p.id !== proj.ownerId && !p.isDead) {
                const dx = p.pos.x - proj.pos.x;
                const dy = p.pos.y - 50 - proj.pos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < p.width + proj.radius) {
                    if (p.isBlocking && Math.sign(p.facing) !== Math.sign(proj.vel.x)) {
                        createParticles(proj.pos.x, proj.pos.y, 10, '#fff', 'spark');
                    } else {
                        p.hp -= proj.damage;
                        p.vel.x += (proj.vel.x > 0 ? 1 : -1) * 5;
                        p.hitStun = 10;
                        createParticles(proj.pos.x, proj.pos.y, 15, p.color, 'blood');
                        hitStopRef.current = 5;
                        shakeRef.current = 5;
                    }
                    hitPlayer = true;
                }
            }
        }

        if (proj.life <= 0 || hitMap || hitPlayer) {
            projectilesRef.current.splice(i, 1);
        }
    }

    // 6. Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life--;
        if (p.type === 'black_hole') {
            p.size += 0.5; 
            players.forEach(pl => {
                if(pl.isDead) return;
                const dx = p.pos.x - pl.pos.x;
                const dy = p.pos.y - pl.pos.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 300) {
                    pl.vel.x += dx * 0.05;
                    pl.vel.y += dy * 0.05;
                }
            });
        } else if (p.type === 'ring') {
            p.size += 5; 
        } else if (p.type === 'debris') {
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.vel.y += GRAVITY;
            p.rotation = (p.rotation || 0) + 0.1;
            // Floor collision for debris
             for (const plat of mapRef.current.platforms) {
                if (p.pos.x > plat.x && p.pos.x < plat.x + plat.w &&
                    p.pos.y >= plat.y && p.pos.y <= plat.y + 20) {
                     p.vel.y *= -0.5;
                     p.vel.x *= 0.8;
                     p.pos.y = plat.y;
                }
            }
        } else if (p.type !== 'text' && p.type !== 'slash') {
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.vel.y += 0.2; 
        }
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // 7. Update Players
    players.forEach(p => {
        // DEATH LOGIC - VISUALS
        if (p.hp <= 0 && !p.isDead) {
            p.isDead = true;
            p.deathPos = { ...p.pos }; // Record where they died
            p.deathTimer = 60; // Wait 1 second before ending round
            createExplosion(p.pos.x, p.pos.y - 30, p.color);
            shakeRef.current = 30;
            hitStopRef.current = 10;
        }

        if (p.isDead) {
            p.deathTimer--;
            // Ghost fall physics if in sky map
            p.vel.y += GRAVITY;
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            return; // Skip input/collision
        }

        // Store previous position for collision raycast
        p.prevPos = { ...p.pos };
        
        // --- PHYSICS UPDATE ---
        if (p.hitStun > 0) {
            p.hitStun--;
            p.squashX = 0.8;
            p.squashY = 1.2;
            p.vel.x *= FRICTION;
            p.vel.y += GRAVITY;
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
        } else {
            // Stats Recovery
            if (p.blockCooldown > 0) p.blockCooldown--;
            if (p.attackCooldown > 0) p.attackCooldown--;
            if (p.invincible > 0) p.invincible--;
            
            // Passives
            if (p.modifiers.includes('vampire') && frameRef.current % 60 === 0 && p.hp > 1) p.hp -= 1;
            if (p.modifiers.includes('aura') && frameRef.current % 30 === 0) {
                 const enemy = players.find(e => e.id !== p.id);
                 if (enemy && !enemy.isDead) {
                     const dist = Math.abs(p.pos.x - enemy.pos.x) + Math.abs(p.pos.y - enemy.pos.y);
                     if (dist < 200) {
                         enemy.hp -= 2;
                         createParticles(enemy.pos.x, enemy.pos.y - 40, 3, enemy.color, 'blood', {speed: 2});
                     }
                 }
            }

            // --- ROBUST CONTROLS (SUPPORT IJKL AND ARROWS) ---
            const keys = keysRef.current;
            let left, right, up, attack, block;

            if (p.id === 1) {
                left = keys.has('a');
                right = keys.has('d');
                up = keys.has('w');
                attack = keys.has('f');
                block = keys.has('g');
            } else {
                // Support both Arrow Keys and IJKL for P2
                left = keys.has('arrowleft') || keys.has('j');
                right = keys.has('arrowright') || keys.has('l');
                up = keys.has('arrowup') || keys.has('i');
                attack = keys.has('k') || keys.has('1') || keys.has('numpad1'); // Flexible attack
                block = keys.has('m') || keys.has('2') || keys.has('numpad2');
            }

            // Tutorial Tracking
            if (phaseRef.current === GamePhase.TUTORIAL && p.id === 1) {
                if ((left || right) && !tutorialProgressRef.current.move) {
                    tutorialProgressRef.current.move = true;
                    setTutorialStep(1);
                }
                if (up && tutorialProgressRef.current.move && !tutorialProgressRef.current.jump) {
                    tutorialProgressRef.current.jump = true;
                    setTutorialStep(2);
                }
                if (attack && tutorialProgressRef.current.jump && !tutorialProgressRef.current.attack) {
                    tutorialProgressRef.current.attack = true;
                    setTutorialStep(3); // Complete
                }
            }

            const currentSpeed = p.speed * p.weapon.speedModifier; // Apply weapon weight
            if (left) { p.vel.x -= currentSpeed; p.facing = -1; }
            if (right) { p.vel.x += currentSpeed; p.facing = 1; }

            // Apply Map Elements
            if (mapRef.current.elements) {
                mapRef.current.elements.forEach(el => {
                    if (p.pos.x > el.x && p.pos.x < el.x + el.w &&
                        p.pos.y - 40 > el.y && p.pos.y - 40 < el.y + el.h) {
                            if (el.type === 'jumppad') {
                                 if (p.vel.y > 0) {
                                     p.vel.y = -el.power;
                                     p.jumpsLeft = p.maxJumps;
                                     createParticles(p.pos.x, p.pos.y, 15, '#0ff', 'ring');
                                 }
                            } else if (el.type === 'fan' && el.direction) {
                                p.vel.x += el.direction.x * el.power;
                                p.vel.y += el.direction.y * el.power;
                            }
                    }
                });
            }

            // Jump
            if (up && !keys.has(`jump_lock_${p.id}`)) {
                if (p.jumpsLeft > 0) {
                    const isAirJump = !p.isGrounded && p.jumpsLeft < p.maxJumps;
                    p.vel.y = -p.jumpForce;
                    p.jumpsLeft--;
                    keys.add(`jump_lock_${p.id}`);
                    p.squashX = 0.7; p.squashY = 1.3;
                    
                    if (isAirJump) {
                        createJumpRing(p.pos.x, p.pos.y);
                        p.rotation = Math.PI * 2 * p.facing;
                    } else {
                        createParticles(p.pos.x, p.pos.y, 10, '#fff', 'dust');
                    }
                    
                    if (p.modifiers.includes('rocket_jump')) {
                         createParticles(p.pos.x, p.pos.y, 20, '#f97316', 'spark');
                         const enemy = players.find(e => e.id !== p.id);
                         if (enemy) {
                             const dist = Math.sqrt((p.pos.x - enemy.pos.x)**2 + (p.pos.y - enemy.pos.y)**2);
                             if (dist < 150) {
                                 enemy.vel.y -= 10;
                                 enemy.hp -= 10;
                                 createParticles(enemy.pos.x, enemy.pos.y - 40, 5, enemy.color, 'blood');
                             }
                         }
                    }
                }
            }
            if (!up) keys.delete(`jump_lock_${p.id}`);

            // Block
            p.isBlocking = block && p.blockCooldown === 0;

            // Attack
            if (attack && p.attackCooldown === 0 && !p.isBlocking && !keys.has(`atk_lock_${p.id}`)) {
                const now = Date.now();
                if (now - p.lastAttackTime > 1000) p.comboCount = 0;
                
                p.attackFrame = p.weapon.windup + 10;
                p.lastAttackTime = now;
                p.attackCooldown = p.weapon.cooldown;
                keys.add(`atk_lock_${p.id}`);
                p.vel.x += p.facing * 10;

                let slashType: 'down' | 'up' | 'heavy' = 'down';
                if (p.comboCount === 1) slashType = 'up';
                if (p.comboCount === 2) slashType = 'heavy';
                
                createSlash(p.pos.x + p.facing * 40, p.pos.y - 40, p.facing, p.color, slashType);
                
                const enemy = players.find(e => e.id !== p.id && !e.isDead);
                if (enemy) {
                    const range = p.weapon.range;
                    const dx = enemy.pos.x - p.pos.x;
                    const dy = enemy.pos.y - p.pos.y;
                    const isFacingEnemy = Math.sign(dx) === Math.sign(p.facing);
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < range && isFacingEnemy && Math.abs(dy) < 80) {
                        const blocked = enemy.isBlocking && (enemy.facing !== p.facing);
                        
                        if (blocked) {
                            createParticles(enemy.pos.x + (enemy.facing * 20), enemy.pos.y - 40, 15, '#fff', 'spark');
                            enemy.vel.x += p.facing * 5; 
                            p.vel.x -= p.facing * 5; 
                            shakeRef.current = 5;
                            hitStopRef.current = 3;
                            if (enemy.modifiers.includes('phase_block')) {
                                enemy.pos.x += enemy.facing * 150; 
                                enemy.attackCooldown = 0; 
                            }
                        } else if (enemy.invincible <= 0) {
                            let dmg = p.weapon.damage;
                            if (p.comboCount === 2) dmg *= 1.5; 
                            if (p.modifiers.includes('vampire')) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.5);
                            
                            enemy.hp -= dmg;
                            enemy.vel.x = p.facing * (p.weapon.knockback + (p.comboCount * 5));
                            enemy.vel.y = -5;
                            enemy.hitStun = 15;
                            createParticles(enemy.pos.x, enemy.pos.y - 40, 20, enemy.color, 'blood');
                            createParticles(enemy.pos.x, enemy.pos.y - 40, 1, '#fff', 'text', { text: Math.floor(dmg).toString() });
                            shakeRef.current = 10 + (p.comboCount * 5);
                            hitStopRef.current = 6 + p.comboCount; 
                            if (p.modifiers.includes('freeze')) {
                                enemy.speed *= 0.4;
                                setTimeout(() => { if(enemy) enemy.speed = INITIAL_PLAYER_STATS(1,0,0,'').speed; }, 2000);
                                createParticles(enemy.pos.x, enemy.pos.y - 40, 10, '#38bdf8', 'spark');
                            }
                            if (p.modifiers.includes('black_hole') && Math.random() < 0.25) {
                                createBlackHole(enemy.pos.x, enemy.pos.y - 50);
                            }
                        }
                    }
                }

                if (p.modifiers.includes('projectile_attack')) {
                    const count = p.modifiers.includes('shotgun') ? 5 : 1;
                    for (let i = 0; i < count; i++) {
                        const angleSpread = (Math.random() - 0.5) * (count > 1 ? 1 : 0);
                        projectilesRef.current.push({
                            id: Math.random().toString(),
                            ownerId: p.id,
                            pos: { x: p.pos.x + p.facing * 40, y: p.pos.y - 40 },
                            vel: { x: p.facing * 15, y: angleSpread * 5 },
                            radius: 5,
                            damage: 5,
                            color: p.color,
                            life: 60,
                            isBlockable: true,
                            homing: p.modifiers.includes('homing')
                        });
                    }
                }
                p.comboCount = (p.comboCount + 1) % 3;
            }
            if (!attack) keys.delete(`atk_lock_${p.id}`);

            // Integrate Physics
            p.vel.x *= FRICTION;
            
            // GRAVITY LOCK: Prevent falling through map during spawn
            if (roundStartFrameRef.current < 30) {
                p.vel.y = 1; // Slight push down to trigger collision, but no acceleration
            } else {
                p.vel.y += GRAVITY;
            }
            
            p.vel.y *= AIR_RESISTANCE;
            p.vel.y = Math.min(p.vel.y, 20);
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.squashX += (1 - p.squashX) * 0.1;
            p.squashY += (1 - p.squashY) * 0.1;
            p.rotation *= 0.8;
        }

        // --- IMPROVED COLLISION (Raycasting Logic) ---
        p.isGrounded = false;
        let groundY = -999;
        
        for (const plat of mapRef.current.platforms) {
            // Check if within X bounds
            if (p.pos.x + p.width/2 > plat.x && p.pos.x - p.width/2 < plat.x + plat.w) {
                // Check if crossed the top surface downwards
                const wasAbove = p.prevPos.y <= plat.y + 5; // Tolerance
                const isBelow = p.pos.y >= plat.y;
                const isFalling = p.vel.y >= 0;

                if (wasAbove && isBelow && isFalling) {
                    p.pos.y = plat.y;
                    p.vel.y = 0;
                    p.isGrounded = true;
                    p.jumpsLeft = p.maxJumps;
                    p.rotation = 0;
                    groundY = plat.y;
                }
            }
        }

        if (mapRef.current.hazardY && p.pos.y >= mapRef.current.hazardY && !p.isDead) {
            p.vel.y = -20;
            p.hp -= 20;
            p.hitStun = 20;
            createParticles(p.pos.x, p.pos.y, 10, '#f59e0b', 'spark');
            shakeRef.current = 10;
        }

        // Void Death Check - Improved visual feedback
        // GRAVITY LOCK: Disable void death during spawn grace period
        if (p.pos.y > CANVAS_HEIGHT + 100 && !p.isDead && roundStartFrameRef.current > 60) {
            p.hp = 0; // Trigger death next frame logic
            p.deathPos = { x: p.pos.x, y: CANVAS_HEIGHT - 50 }; // Lock camera to bottom
            // Visual feedback for falling death
            createExplosion(p.pos.x, CANVAS_HEIGHT - 50, p.color);
        }
    });

    // 8. Check Round End
    if (phaseRef.current === GamePhase.TUTORIAL) {
        if (players[1].hp <= 0) {
            // Respawn dummy
            players[1].hp = 100;
            players[1].pos = { x: 600, y: 300 };
            players[1].vel = {x:0, y:0};
        }
    } else {
        // Only check win condition if grace period passed
        if (roundStartFrameRef.current > 60) {
            const alive = players.filter(p => !p.isDead);
            // Wait for death animation (deathTimer)
            const animatingDeaths = players.some(p => p.isDead && p.deathTimer > 0);

            if (alive.length <= 1 && phaseRef.current === GamePhase.PLAYING && !roundEndingRef.current && !animatingDeaths) {
                if (alive.length === 1) {
                    roundEndingRef.current = true;
                    const winner = alive[0];
                    const loser = players.find(p => p.id !== winner.id);
                    // Slight delay for impact
                    setTimeout(() => {
                        if (loser) onRoundOverRef.current(winner.id, loser.id);
                    }, 500);
                } else if (alive.length === 0) {
                    // Draw? Reset
                    initRound();
                }
            }
        }
    }
  };

  // --- RENDER ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // INTRO RENDER
    if (phaseRef.current === GamePhase.INTRO) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Background - Dark City
        const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bgGrad.addColorStop(0, '#020617'); bgGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // City Skyline
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        for (let x = 0; x < CANVAS_WIDTH; x+=40) {
            const h = 100 + Math.sin(x * 0.1) * 50 + Math.random() * 50;
            ctx.fillRect(x, CANVAS_HEIGHT - h, 45, h);
            // Windows
            ctx.fillStyle = '#facc15';
            if (Math.random() > 0.8) ctx.fillRect(x + 10, CANVAS_HEIGHT - h + 20, 5, 5);
            ctx.fillStyle = '#0f172a';
        }

        // Rain
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
        rainRef.current.forEach(r => {
            ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 2, r.y + r.len); ctx.stroke();
        });
        ctx.globalAlpha = 1;

        const t = introFrameRef.current;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';

        // Scene 1: The World (0 - 150)
        if (t < 150) {
             ctx.font = 'bold 50px Rajdhani, sans-serif';
             ctx.globalAlpha = Math.min(1, t/50);
             ctx.fillText(text.intro_1, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
             if (t > 50) ctx.fillText(text.intro_2, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        } 
        // Scene 2: P1 Blue Ronin (150 - 300)
        else if (t < 300) {
             const fade = Math.min(1, (t-150)/20);
             ctx.globalAlpha = fade;
             // Draw P1 Large
             ctx.save(); ctx.translate(CANVAS_WIDTH/2 - 200 + (t-150), CANVAS_HEIGHT/2);
             ctx.scale(2, 2); 
             // Simple Character Render for Intro
             ctx.fillStyle = '#3b82f6'; ctx.shadowBlur = 20; ctx.shadowColor = '#3b82f6';
             ctx.beginPath(); ctx.roundRect(-20, -60, 40, 60, 10); ctx.fill();
             ctx.fillStyle = '#fff'; ctx.fillRect(5, -50, 20, 5); // Visor
             ctx.restore();
             
             ctx.font = 'bold 40px Rajdhani, sans-serif';
             ctx.fillStyle = '#60a5fa';
             ctx.fillText(text.intro_p1, CANVAS_WIDTH/2 + 50, CANVAS_HEIGHT/2 + 150);
        }
        // Scene 3: P2 Red Phantom (300 - 450)
        else if (t < 450) {
             const fade = Math.min(1, (t-300)/20);
             ctx.globalAlpha = fade;
             // Draw P2 Large
             ctx.save(); ctx.translate(CANVAS_WIDTH/2 + 200 - (t-300), CANVAS_HEIGHT/2);
             ctx.scale(2, 2); ctx.scale(-1, 1);
             ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444';
             ctx.beginPath(); ctx.roundRect(-20, -60, 40, 60, 10); ctx.fill();
             ctx.fillStyle = '#fff'; ctx.fillRect(5, -50, 20, 5); // Visor
             ctx.restore();
             
             ctx.font = 'bold 40px Rajdhani, sans-serif';
             ctx.fillStyle = '#f87171';
             ctx.fillText(text.intro_p2, CANVAS_WIDTH/2 - 50, CANVAS_HEIGHT/2 + 150);
        }
        // Scene 4: Clash (450 - 700)
        else {
             if (t === 450) shakeRef.current = 20; // Initial Shake
             
             const shakeX = (Math.random()-0.5) * 5;
             const shakeY = (Math.random()-0.5) * 5;
             ctx.translate(shakeX, shakeY);

             // Flash
             if (t < 460) {
                 ctx.fillStyle = '#fff'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
             }

             ctx.fillStyle = '#fff';
             ctx.font = 'bold 60px Rajdhani, sans-serif';
             ctx.fillText(text.intro_final, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
             
             if (Math.floor(t/20) % 2 === 0) {
                 ctx.font = '20px Rajdhani, sans-serif';
                 ctx.fillStyle = '#94a3b8';
                 ctx.fillText(text.intro_press, CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
             }
        }
        return;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // -- BACKGROUND --
    const theme = mapRef.current.theme;
    if (theme === 'magma') {
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#1a0505'); bg.addColorStop(0.8, '#450a0a'); bg.addColorStop(1, '#ef4444');
        ctx.fillStyle = bg; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'sky') {
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#0284c7'); bg.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = bg; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'factory') {
        const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        bg.addColorStop(0, '#111'); bg.addColorStop(1, '#333');
        ctx.fillStyle = bg; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Grid pattern
        ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
        for(let i=0; i<CANVAS_WIDTH; i+=100) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
        for(let i=0; i<CANVAS_HEIGHT; i+=100) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }
    } else {
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
        for(let i=0; i<CANVAS_WIDTH; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
    }

    const cam = cameraRef.current;
    const shakeX = (Math.random() - 0.5) * shakeRef.current;
    const shakeY = (Math.random() - 0.5) * shakeRef.current;
    
    ctx.save();
    ctx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x + shakeX, -cam.y + shakeY);

    // Draw Map
    ctx.shadowBlur = 15;
    ctx.shadowColor = theme === 'magma' ? '#ef4444' : theme === 'sky' ? '#bae6fd' : '#0ea5e9';
    if (theme === 'factory') ctx.shadowColor = '#fbbf24';

    for (const plat of mapRef.current.platforms) {
        if (theme === 'factory') {
            ctx.fillStyle = '#1c1917'; ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            ctx.fillStyle = '#fbbf24'; 
            // Hazard stripes
            for(let i=0; i<plat.w; i+=20) ctx.fillRect(plat.x + i, plat.y, 10, 5);
        } else {
            ctx.fillStyle = theme === 'magma' ? '#290e0e' : theme === 'sky' ? '#f8fafc' : '#0f172a';
            ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
            ctx.fillStyle = theme === 'magma' ? '#b91c1c' : theme === 'sky' ? '#7dd3fc' : '#38bdf8';
            ctx.fillRect(plat.x, plat.y, plat.w, 5);
        }
    }

    // Hazards/Elements
    if (mapRef.current.hazardY) {
        ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 40; ctx.shadowColor = '#f59e0b';
        ctx.fillRect(-1000, mapRef.current.hazardY, 4000, 1000);
    }
    if (mapRef.current.elements) {
        mapRef.current.elements.forEach(el => {
            if (el.type === 'jumppad') {
                ctx.fillStyle = '#22d3ee'; ctx.shadowBlur = 20; ctx.shadowColor = '#22d3ee';
                ctx.fillRect(el.x, el.y, el.w, el.h);
            } else if (el.type === 'fan' && el.direction) {
                ctx.save(); ctx.translate(el.x + el.w/2, el.y + el.h/2);
                ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-el.w/2, -el.h/2, el.w, el.h);
                // Rotate fan blades
                ctx.rotate(frameRef.current * 0.5); 
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(-40, -5, 80, 10); ctx.fillRect(-5, -40, 10, 80);
                ctx.restore();
                
                // Wind particles
                if (Math.random() < 0.2) {
                    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
                    const px = el.x + Math.random() * el.w;
                    const py = el.y + Math.random() * el.h;
                    ctx.fillRect(px, py, 2, 20);
                    ctx.globalAlpha = 1;
                }
            }
        });
    }
    // Rotating Hazards
    if (mapRef.current.hazards) {
        mapRef.current.hazards.forEach(h => {
             const ballX = h.x + Math.cos(h.angle) * h.length;
             const ballY = h.y + Math.sin(h.angle) * h.length;
             ctx.strokeStyle = '#444'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ballX, ballY); ctx.stroke();
             ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(h.x, h.y, 10, 0, Math.PI*2); ctx.fill();
             ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444'; ctx.fillStyle = '#111';
             ctx.beginPath(); ctx.arc(ballX, ballY, h.size, 0, Math.PI*2); ctx.fill();
             for(let i=0; i<8; i++) {
                 const a = i * (Math.PI/4) + frameRef.current * 0.1;
                 const sx = ballX + Math.cos(a) * (h.size + 10);
                 const sy = ballY + Math.sin(a) * (h.size + 10);
                 ctx.beginPath(); ctx.moveTo(ballX, ballY); ctx.lineTo(sx, sy); ctx.strokeStyle = '#ef4444'; ctx.stroke();
             }
        });
    }

    // Entities
    ctx.shadowBlur = 0;
    particlesRef.current.forEach(p => {
        ctx.save(); ctx.translate(p.pos.x, p.pos.y); ctx.fillStyle = p.color;
        if (p.type === 'slash') {
             ctx.rotate(p.rotation || 0);
             ctx.globalAlpha = p.life / p.maxLife;
             ctx.beginPath();
             ctx.moveTo(0, 0);
             ctx.quadraticCurveTo(50, -50, 100, 0);
             ctx.quadraticCurveTo(50, -30, 0, 0);
             ctx.fill();
        } else if (p.type === 'text') {
            ctx.font = 'bold 20px Rajdhani';
            ctx.fillText(p.text || '', 0, 0);
        } else if (p.type === 'ring') {
            ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0, p.size, 0, Math.PI*2); ctx.stroke();
        } else if (p.type === 'black_hole') {
             ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0,0, p.size, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0, p.size + Math.sin(frameRef.current*0.5)*5, 0, Math.PI*2); ctx.stroke();
        } else {
            ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    });

    projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI*2); ctx.fill();
    });

    // Players
    playersRef.current.forEach(p => {
        if (p.isDead && p.deathTimer <= 0) return;

        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.scale(p.facing * p.squashX, p.squashY);
        if (p.isDead) ctx.globalAlpha = 0.5;

        // Draw Player Body (Bean Style)
        const gradient = ctx.createRadialGradient(0, -30, 5, 0, -30, 30);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, p.id === 1 ? '#1e3a8a' : '#7f1d1d');
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 15; ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.roundRect(-20, -60, 40, 60, 20);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
        ctx.beginPath(); ctx.roundRect(5, -50, 20, 10, 2); ctx.fill();

        // Jetpack
        ctx.fillStyle = '#475569'; ctx.shadowBlur = 0;
        ctx.fillRect(-25, -50, 5, 30);
        if (!p.isGrounded && p.vel.y < 0) {
            ctx.fillStyle = '#f97316';
            ctx.fillRect(-25, -20, 5, 10 + Math.random()*10);
        }

        // --- WEAPON RENDERING ---
        ctx.save();
        // Weapon Animation State
        const isAttacking = p.attackFrame > 0;
        const windupProgress = isAttacking ? Math.max(0, (p.attackFrame - 10) / p.weapon.windup) : 0;
        const swingProgress = isAttacking && p.attackFrame <= 10 ? (10 - p.attackFrame) / 10 : 0;
        
        let rotation = 0;
        let offsetX = 10;
        let offsetY = -30;

        if (windupProgress > 0) {
            // Pull back
            rotation = -Math.PI / 2 * windupProgress;
            offsetX -= 10 * windupProgress;
        } else if (swingProgress > 0) {
            // Swing forward
            rotation = Math.PI * swingProgress;
            offsetX += 30 * swingProgress;
            offsetY += 20 * swingProgress;
        } else if (p.isBlocking) {
            rotation = -Math.PI / 4;
            offsetX = 20;
        }

        ctx.translate(offsetX, offsetY);
        ctx.rotate(rotation);

        // Weapon Style Switch
        ctx.fillStyle = p.weapon.color; 
        ctx.shadowColor = p.weapon.color; ctx.shadowBlur = 20;

        if (p.weapon.type === 'hammer') {
            // Handle
            ctx.fillStyle = '#555'; ctx.fillRect(0, -5, 60, 10);
            // Head
            ctx.fillStyle = p.weapon.color;
            ctx.fillRect(40, -20, 40, 40);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(40, -20, 40, 40);
        } else if (p.weapon.type === 'daggers') {
            // Reverse grip dagger
            ctx.rotate(Math.PI); 
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(30, -5); ctx.lineTo(40, 0); ctx.lineTo(30, 5); ctx.fill();
        } else if (p.weapon.type === 'spear') {
            // Long shaft
            ctx.fillStyle = '#555'; ctx.fillRect(0, -3, 100, 6);
            // Tip
            ctx.fillStyle = p.weapon.color;
            ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(130, -5); ctx.lineTo(150, 0); ctx.lineTo(130, 5); ctx.fill();
        } else {
            // Default Sword (Beam Katana)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(20, -5, 80, -10, 90, 0);
            ctx.lineTo(85, 5);
            ctx.bezierCurveTo(75, -5, 20, 0, 0, 5);
            ctx.fill();
            // Core
            ctx.fillStyle = '#fff'; ctx.shadowBlur = 5;
            ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(80, 0); ctx.lineTo(5, 2); ctx.fill();
        }

        // Shield Effect
        if (p.isBlocking) {
             ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 40, -Math.PI/3, Math.PI/3); ctx.stroke();
             ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff'; ctx.fill();
        }

        ctx.restore();
        ctx.restore();

        // HP Bar
        ctx.fillStyle = '#334155'; ctx.fillRect(p.pos.x - 25, p.pos.y - 75, 50, 5);
        ctx.fillStyle = p.hp > 30 ? '#22c55e' : '#ef4444'; ctx.fillRect(p.pos.x - 25, p.pos.y - 75, 50 * (p.hp/p.maxHp), 5);
        
        // Block Indicator
        if (p.blockCooldown > 0) {
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(p.pos.x - 25, p.pos.y - 70, 50 * (p.blockCooldown/100), 2);
        }
    });

    ctx.restore();

    // Loop
    animationFrameRef.current = requestAnimationFrame(update);
    // Render loop separately to allow high FPS physics? No, coupled for now.
    draw();
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameRef.current);
  });

  return (
    <div className="w-full h-full relative">
        <canvas 
            ref={canvasRef} 
            width={CANVAS_WIDTH} 
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain bg-black"
        />
        
        {/* Tutorial Overlay */}
        {phase === GamePhase.TUTORIAL && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/80 p-6 rounded border border-blue-500 text-center">
                <h3 className="text-xl font-bold mb-2 neon-text text-blue-400">{text.tut_title}</h3>
                {tutorialStep === 0 && <p>{text.tut_move}</p>}
                {tutorialStep === 1 && <p>{text.tut_jump}</p>}
                {tutorialStep === 2 && <p>{text.tut_attack}</p>}
                {tutorialStep === 3 && (
                    <div>
                        <p className="text-green-400 font-bold mb-4">{text.tut_complete}</p>
                        <button 
                            className="px-4 py-2 bg-blue-500 text-black font-bold hover:bg-white"
                            onClick={() => setPhase(GamePhase.MENU)}
                        >
                            {text.tut_exit}
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
