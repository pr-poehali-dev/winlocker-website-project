import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const createAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContext();
};

const playShootSound = () => {
  try {
    const ctx = createAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const playHitSound = () => {
  try {
    const ctx = createAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const playPickupSound = () => {
  try {
    const ctx = createAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const playBackgroundMusic = (audioContextRef: React.MutableRefObject<AudioContext | null>) => {
  try {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    const ctx = createAudioContext();
    audioContextRef.current = ctx;
    
    const notes = [220, 233, 196, 185, 174, 185, 196, 233];
    let noteIndex = 0;
    
    const playNote = () => {
      if (ctx.state === 'closed') return;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(notes[noteIndex], ctx.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
      
      noteIndex = (noteIndex + 1) % notes.length;
    };
    
    const interval = setInterval(() => {
      if (ctx.state === 'closed') {
        clearInterval(interval);
        return;
      }
      playNote();
    }, 500);
    
    return () => {
      clearInterval(interval);
      ctx.close();
    };
  } catch (e) {
    console.log('Audio not supported');
    return () => {};
  }
};

type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
  speed: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  angle: number;
  active: boolean;
  attackTimer: number;
}

interface HealthPack {
  x: number;
  y: number;
  collected: boolean;
}

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [player, setPlayer] = useState<Player>({
    x: 2,
    y: 2,
    angle: 0,
    health: 100,
    ammo: 50,
    speed: 0.05,
  });
  
  const [enemies, setEnemies] = useState<Enemy[]>([
    { x: 8, y: 8, health: 100, angle: 0, active: true, attackTimer: 0 },
    { x: 12, y: 3, health: 100, angle: 0, active: true, attackTimer: 0 },
    { x: 3, y: 13, health: 100, angle: 0, active: true, attackTimer: 0 },
  ]);

  const [healthPacks, setHealthPacks] = useState<HealthPack[]>([
    { x: 5, y: 5, collected: false },
    { x: 10, y: 10, collected: false },
  ]);

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const [shooting, setShooting] = useState(false);
  const [recoil, setRecoil] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' && gameState === 'playing') {
        handleShoot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      updateGame();
      renderGame();
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState]);

  const updateGame = () => {
    setPlayer((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      let newAngle = prev.angle;

      if (keysRef.current['w']) {
        const nextX = prev.x + Math.cos(prev.angle) * prev.speed;
        const nextY = prev.y + Math.sin(prev.angle) * prev.speed;
        if (MAP[Math.floor(nextY)][Math.floor(nextX)] === 0) {
          newX = nextX;
          newY = nextY;
        }
      }
      if (keysRef.current['s']) {
        const nextX = prev.x - Math.cos(prev.angle) * prev.speed;
        const nextY = prev.y - Math.sin(prev.angle) * prev.speed;
        if (MAP[Math.floor(nextY)][Math.floor(nextX)] === 0) {
          newX = nextX;
          newY = nextY;
        }
      }
      if (keysRef.current['a']) {
        newAngle -= 0.05;
      }
      if (keysRef.current['d']) {
        newAngle += 0.05;
      }

      healthPacks.forEach((pack) => {
        if (!pack.collected) {
          const dist = Math.sqrt(
            Math.pow(newX - pack.x, 2) + Math.pow(newY - pack.y, 2)
          );
          if (dist < 0.5) {
            pack.collected = true;
            playPickupSound();
            setPlayer((p) => ({ ...p, health: Math.min(100, p.health + 30) }));
          }
        }
      });

      return { ...prev, x: newX, y: newY, angle: newAngle };
    });

    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => {
        if (!enemy.active) return enemy;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToPlayer = Math.atan2(dy, dx);

        let newX = enemy.x;
        let newY = enemy.y;
        let newAttackTimer = enemy.attackTimer - 1;

        if (dist > 0.5 && dist < 8) {
          const moveSpeed = 0.02;
          const nextX = enemy.x + Math.cos(angleToPlayer) * moveSpeed;
          const nextY = enemy.y + Math.sin(angleToPlayer) * moveSpeed;
          
          if (MAP[Math.floor(nextY)][Math.floor(nextX)] === 0) {
            newX = nextX;
            newY = nextY;
          }
        }

        if (dist < 1.5 && newAttackTimer <= 0) {
          playHitSound();
          setPlayer((p) => {
            const newHealth = p.health - 5;
            if (newHealth <= 0) {
              setGameState('gameover');
              if (score > highScore) {
                setHighScore(score);
              }
            }
            return { ...p, health: Math.max(0, newHealth) };
          });
          newAttackTimer = 60;
        }

        return {
          ...enemy,
          x: newX,
          y: newY,
          angle: angleToPlayer,
          attackTimer: newAttackTimer,
        };
      })
    );

    if (recoil > 0) {
      setRecoil((prev) => prev - 1);
    }
  };

  const handleShoot = () => {
    if (player.ammo <= 0 || shooting) return;

    playShootSound();
    setShooting(true);
    setRecoil(10);
    setPlayer((prev) => ({ ...prev, ammo: prev.ammo - 1 }));

    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) => {
        if (!enemy.active) return enemy;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleToEnemy = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToEnemy - player.angle);

        if (dist < 10 && angleDiff < 0.2) {
          const newHealth = enemy.health - 25;
          if (newHealth <= 0) {
            setScore((prev) => prev + 100);
            return { ...enemy, active: false };
          }
          return { ...enemy, health: newHealth };
        }
        return enemy;
      })
    );

    setTimeout(() => setShooting(false), 200);
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height / 2);

    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, height / 2, width, height / 2);

    const fov = Math.PI / 3;
    const numRays = width / 2;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - fov / 2 + (fov * i) / numRays;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      let rayX = player.x;
      let rayY = player.y;
      let hit = false;
      let wallType = 0;
      let distance = 0;

      while (!hit && distance < 20) {
        rayX += rayDirX * 0.05;
        rayY += rayDirY * 0.05;
        distance += 0.05;

        const mapX = Math.floor(rayX);
        const mapY = Math.floor(rayY);

        if (mapX < 0 || mapX >= MAP[0].length || mapY < 0 || mapY >= MAP.length) {
          hit = true;
        } else if (MAP[mapY][mapX] > 0) {
          hit = true;
          wallType = MAP[mapY][mapX];
        }
      }

      const correctedDistance = distance * Math.cos(rayAngle - player.angle);
      const wallHeight = (height / correctedDistance) * 0.5;

      let wallColor = wallType === 1 ? '#4a4a5a' : '#6a4a4a';
      const brightness = Math.max(0.2, 1 - correctedDistance / 10);
      const r = parseInt(wallColor.slice(1, 3), 16) * brightness;
      const g = parseInt(wallColor.slice(3, 5), 16) * brightness;
      const b = parseInt(wallColor.slice(5, 7), 16) * brightness;
      wallColor = `rgb(${r}, ${g}, ${b})`;

      ctx.fillStyle = wallColor;
      ctx.fillRect(
        i * 2,
        height / 2 - wallHeight / 2 - recoil,
        2,
        wallHeight
      );

      enemies.forEach((enemy) => {
        if (!enemy.active) return;

        const enemyDx = enemy.x - player.x;
        const enemyDy = enemy.y - player.y;
        const enemyDist = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);
        const enemyAngle = Math.atan2(enemyDy, enemyDx);
        const angleDiff = enemyAngle - player.angle;

        if (Math.abs(angleDiff) < fov / 2 && enemyDist < distance) {
          const enemyScreenPos = (angleDiff / fov) * width + width / 2;
          const enemySize = (height / enemyDist) * 0.3;

          if (Math.abs(enemyScreenPos - i * 2) < enemySize / 2) {
            ctx.fillStyle = '#ea384c';
            ctx.fillRect(
              i * 2,
              height / 2 - enemySize / 2,
              2,
              enemySize
            );
          }
        }
      });
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setPlayer({
      x: 2,
      y: 2,
      angle: 0,
      health: 100,
      ammo: 50,
      speed: 0.05,
    });
    setEnemies([
      { x: 8, y: 8, health: 100, angle: 0, active: true, attackTimer: 0 },
      { x: 12, y: 3, health: 100, angle: 0, active: true, attackTimer: 0 },
      { x: 3, y: 13, health: 100, angle: 0, active: true, attackTimer: 0 },
    ]);
    setHealthPacks([
      { x: 5, y: 5, collected: false },
      { x: 10, y: 10, collected: false },
    ]);
    playBackgroundMusic(audioContextRef);
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {gameState === 'menu' && (
        <Card className="p-8 max-w-2xl w-full bg-card border-2 border-primary shadow-2xl">
          <div className="text-center space-y-8">
            <h1 className="text-7xl font-bold text-primary tracking-wider animate-pulse">
              DOOM CLONE
            </h1>
            <p className="text-2xl text-muted-foreground">
              RETRO FPS SHOOTER
            </p>
            
            <div className="space-y-4 text-left text-lg text-foreground bg-secondary/50 p-6 rounded border border-border">
              <div className="flex items-center gap-3">
                <Icon name="Crosshair" className="text-primary" size={24} />
                <span>УНИЧТОЖЬ ВСЕХ ВРАГОВ</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Heart" className="text-destructive" size={24} />
                <span>СОБИРАЙ АПТЕЧКИ</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="Zap" className="text-accent" size={24} />
                <span>НЕ ДАЙ СЕБЯ УБИТЬ</span>
              </div>
            </div>

            <div className="space-y-3 text-left text-lg bg-secondary/30 p-6 rounded border border-border">
              <p className="text-primary font-bold mb-3">УПРАВЛЕНИЕ:</p>
              <div className="grid grid-cols-2 gap-2">
                <span>W / S - ДВИЖЕНИЕ</span>
                <span>A / D - ПОВОРОТ</span>
                <span>ПРОБЕЛ - ВЫСТРЕЛ</span>
                <span>ESC - ПАУЗА</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                onClick={startGame}
                size="lg"
                className="text-2xl py-8 bg-primary hover:bg-primary/80 text-primary-foreground font-bold tracking-wider"
              >
                <Icon name="Play" size={32} className="mr-2" />
                НАЧАТЬ ИГРУ
              </Button>
              
              {highScore > 0 && (
                <div className="text-2xl text-accent">
                  РЕКОРД: {highScore}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {gameState === 'playing' && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-4 border-primary shadow-2xl"
          />
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/80 p-4 rounded border-2 border-primary space-y-2 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Icon name="Heart" className="text-destructive" size={20} />
                <div className="flex-1 bg-secondary h-6 rounded overflow-hidden border border-border">
                  <div
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${player.health}%` }}
                  />
                </div>
                <span className="text-foreground font-bold">{player.health}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Icon name="Zap" className="text-accent" size={20} />
                <span className="text-foreground font-bold">AMMO: {player.ammo}</span>
              </div>
            </div>

            <div className="bg-black/80 p-4 rounded border-2 border-accent space-y-1 min-w-[150px] text-right">
              <div className="text-2xl font-bold text-accent">
                {score}
              </div>
              <div className="text-sm text-muted-foreground">SCORE</div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-2 rounded border-2 border-primary">
            <div className="flex items-center gap-4">
              <Icon name="Crosshair" className="text-primary" size={32} />
              <span className="text-foreground text-lg">
                ВРАГИ: {enemies.filter(e => e.active).length}
              </span>
            </div>
          </div>

          {shooting && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-accent/30 animate-pulse" />
            </div>
          )}
        </div>
      )}

      {gameState === 'gameover' && (
        <Card className="p-8 max-w-2xl w-full bg-card border-2 border-destructive shadow-2xl">
          <div className="text-center space-y-8">
            <h1 className="text-7xl font-bold text-destructive tracking-wider animate-pulse">
              GAME OVER
            </h1>
            
            <div className="space-y-4 text-3xl">
              <div className="text-foreground">
                СЧЁТ: <span className="text-accent font-bold">{score}</span>
              </div>
              {score === highScore && score > 0 && (
                <div className="text-primary animate-pulse">
                  🏆 НОВЫЙ РЕКОРД! 🏆
                </div>
              )}
              {highScore > 0 && (
                <div className="text-muted-foreground text-2xl">
                  РЕКОРД: {highScore}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Button
                onClick={startGame}
                size="lg"
                className="text-2xl py-8 bg-primary hover:bg-primary/80 text-primary-foreground font-bold tracking-wider"
              >
                <Icon name="RotateCcw" size={32} className="mr-2" />
                ИГРАТЬ СНОВА
              </Button>
              
              <Button
                onClick={() => setGameState('menu')}
                size="lg"
                variant="outline"
                className="text-2xl py-8 border-2 font-bold tracking-wider"
              >
                <Icon name="Home" size={32} className="mr-2" />
                ГЛАВНОЕ МЕНЮ
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Index;