"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type ProgressRef = { current: number };

const CHAPTERS = [
  {
    eyebrow: "MORI CART / 03",
    title: "一台边柜，\n走到生活发生的地方。",
    body: "胡桃木、藤编与黄铜构成一辆轻巧的移动边柜。向下滑动，从完整形态看进它的结构。",
  },
  {
    eyebrow: "01 / TOP RAIL",
    title: "黄铜护栏，\n让移动更从容。",
    body: "细径金属管围合上层台面，瓶罐与器物不会在推行中轻易滑落；后侧把手同时保留舒适握距。",
  },
  {
    eyebrow: "02 / SOLID WOOD",
    title: "两层台面，\n各有自己的节奏。",
    body: "上层适合随手取放，中层承担展示与临时操作。圆润的胡桃木边缘回应日常触碰。",
  },
  {
    eyebrow: "03 / CANE CABINET",
    title: "藤编柜体，\n藏住杂物，留下呼吸。",
    body: "左右分舱收纳让物品保持秩序。通透藤编减轻柜体体量，也让织物与书籍自然通风。",
  },
  {
    eyebrow: "04 / DUAL WHEELS",
    title: "大轮越过门槛，\n脚轮负责转身。",
    body: "木质主轮提供稳定支撑，前端万向脚轮完成细腻转向。两种轮组分工，让家具真正能够移动。",
  },
  {
    eyebrow: "05 / ASSEMBLY",
    title: "看得见结构，\n也看得见长久。",
    body: "每个部件回到原位，形成完整推车。清楚的连接逻辑意味着更容易维护，也更适合长久使用。",
  },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothRange(value: number, start: number, end: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function useStoryProgress(storyRef: RefObject<HTMLElement | null>) {
  const progressRef = useRef(0);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const story = storyRef.current;
      if (!story) return;

      const rect = story.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const next = clamp01(-rect.top / scrollable);
      progressRef.current = next;

      const chapter = Math.min(CHAPTERS.length - 1, Math.floor(next * CHAPTERS.length));
      setActiveChapter((current) => (current === chapter ? current : chapter));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [storyRef]);

  return { progressRef, activeChapter };
}

function WoodShelf({ width = 3.8, depth = 1.6 }: { width?: number; depth?: number }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, depth]} />
        <meshStandardMaterial color="#50301f" roughness={0.42} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[width - 0.12, 0.018, depth - 0.08]} />
        <meshStandardMaterial color="#744b31" roughness={0.48} />
      </mesh>
      {[-0.43, -0.12, 0.21, 0.49].map((z) => (
        <mesh key={z} position={[0, 0.098, z]}>
          <boxGeometry args={[width - 0.22, 0.006, 0.012]} />
          <meshStandardMaterial color="#2f1d15" transparent opacity={0.32} />
        </mesh>
      ))}
    </group>
  );
}

function BrassRod({
  position,
  length,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  length: number;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.035, 0.035, length, 14]} />
      <meshStandardMaterial color="#aa8748" roughness={0.28} metalness={0.72} />
    </mesh>
  );
}

function RattanPanel({ width = 1.2, height = 1.2 }: { width?: number; height?: number }) {
  const verticals = Array.from({ length: 9 }, (_, index) => -width / 2 + 0.1 + index * ((width - 0.2) / 8));
  const horizontals = Array.from({ length: 7 }, (_, index) => -height / 2 + 0.1 + index * ((height - 0.2) / 6));

  return (
    <group position={[0, 0, 0.616]}>
      <mesh position={[0, 0, -0.026]}>
        <planeGeometry args={[width - 0.08, height - 0.08]} />
        <meshStandardMaterial color="#c79a56" side={THREE.DoubleSide} roughness={0.82} />
      </mesh>
      {verticals.map((x) => (
        <mesh key={`v-${x}`} position={[x, 0, 0]}>
          <boxGeometry args={[0.025, height - 0.12, 0.028]} />
          <meshStandardMaterial color="#855d32" roughness={0.8} />
        </mesh>
      ))}
      {horizontals.map((y) => (
        <mesh key={`h-${y}`} position={[0, y, 0.018]}>
          <boxGeometry args={[width - 0.12, 0.022, 0.026]} />
          <meshStandardMaterial color="#e0b96d" roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function CabinetPod({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * 1.12, -0.74, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.32, 1.35, 1.25]} />
        <meshStandardMaterial color="#382217" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0.63]}>
        <boxGeometry args={[1.1, 1.08, 0.055]} />
        <meshStandardMaterial color="#2b1b13" roughness={0.58} />
      </mesh>
      <RattanPanel width={1.05} height={1.02} />
      <mesh position={[0, -0.73, 0]} castShadow>
        <boxGeometry args={[1.42, 0.13, 1.34]} />
        <meshStandardMaterial color="#5b3824" roughness={0.45} />
      </mesh>
    </group>
  );
}

function Wheel({ radius = 0.66 }: { radius?: number }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.18, 48]} />
        <meshStandardMaterial color="#3c2419" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[radius * 0.68, 0.032, 10, 48]} />
        <meshStandardMaterial color="#17110e" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.035, 32]} />
        <meshStandardMaterial color="#69442b" roughness={0.38} />
      </mesh>
    </group>
  );
}

function Caster() {
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.35, 12]} />
        <meshStandardMaterial color="#9f9a8c" roughness={0.25} metalness={0.75} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.14, 24]} />
        <meshStandardMaterial color="#35332f" roughness={0.65} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.17, 18]} />
        <meshStandardMaterial color="#b6afa0" roughness={0.25} metalness={0.7} />
      </mesh>
    </group>
  );
}

function CartModel({ progressRef }: { progressRef: ProgressRef }) {
  const root = useRef<THREE.Group>(null);
  const rail = useRef<THREE.Group>(null);
  const topShelf = useRef<THREE.Group>(null);
  const middleShelf = useRef<THREE.Group>(null);
  const leftCabinet = useRef<THREE.Group>(null);
  const rightCabinet = useRef<THREE.Group>(null);
  const bigWheel = useRef<THREE.Group>(null);
  const caster = useRef<THREE.Group>(null);
  const frame = useRef<THREE.Group>(null);
  const reducedMotion = useRef(false);
  const viewportWidth = useThree((state) => state.size.width);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = media.matches;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const returnFactor = 1 - smoothRange(p, 0.86, 0.985);
    const railT = smoothRange(p, 0.12, 0.26) * returnFactor;
    const shelfT = smoothRange(p, 0.27, 0.43) * returnFactor;
    const cabinetT = smoothRange(p, 0.43, 0.6) * returnFactor;
    const wheelT = smoothRange(p, 0.6, 0.78) * returnFactor;
    const frameT = smoothRange(p, 0.72, 0.86) * returnFactor;
    const damping = reducedMotion.current ? 40 : 8;
    const isMobile = viewportWidth < 900;

    if (root.current) {
      const targetX = isMobile ? 0 : p < 0.14 ? 1.45 : -1.22;
      const targetY = isMobile ? 0.72 : -0.2;
      const targetScale = isMobile ? 0.7 : 0.82;
      root.current.position.x = THREE.MathUtils.damp(root.current.position.x, targetX, damping, delta);
      root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY, damping, delta);
      const nextScale = THREE.MathUtils.damp(root.current.scale.x, targetScale, damping, delta);
      root.current.scale.setScalar(nextScale);
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        -0.34 + p * 0.65 + (reducedMotion.current ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.025),
        damping,
        delta,
      );
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -0.06 + p * 0.08, damping, delta);
    }
    if (rail.current) {
      rail.current.position.y = THREE.MathUtils.damp(rail.current.position.y, railT * 1.25, damping, delta);
      rail.current.position.z = THREE.MathUtils.damp(rail.current.position.z, railT * 0.35, damping, delta);
    }
    if (topShelf.current) {
      topShelf.current.position.set(
        THREE.MathUtils.damp(topShelf.current.position.x, -shelfT * 0.9, damping, delta),
        THREE.MathUtils.damp(topShelf.current.position.y, shelfT * 0.48, damping, delta),
        THREE.MathUtils.damp(topShelf.current.position.z, shelfT * 0.15, damping, delta),
      );
    }
    if (middleShelf.current) {
      middleShelf.current.position.set(
        THREE.MathUtils.damp(middleShelf.current.position.x, shelfT * 0.9, damping, delta),
        THREE.MathUtils.damp(middleShelf.current.position.y, -shelfT * 0.34, damping, delta),
        THREE.MathUtils.damp(middleShelf.current.position.z, shelfT * 0.1, damping, delta),
      );
    }
    if (leftCabinet.current) leftCabinet.current.position.x = THREE.MathUtils.damp(leftCabinet.current.position.x, -cabinetT * 1.05, damping, delta);
    if (rightCabinet.current) rightCabinet.current.position.x = THREE.MathUtils.damp(rightCabinet.current.position.x, cabinetT * 1.05, damping, delta);
    if (bigWheel.current) {
      bigWheel.current.position.x = THREE.MathUtils.damp(bigWheel.current.position.x, wheelT * 1.25, damping, delta);
      bigWheel.current.position.y = THREE.MathUtils.damp(bigWheel.current.position.y, -wheelT * 0.25, damping, delta);
    }
    if (caster.current) {
      caster.current.position.x = THREE.MathUtils.damp(caster.current.position.x, -wheelT * 0.8, damping, delta);
      caster.current.position.y = THREE.MathUtils.damp(caster.current.position.y, -wheelT * 0.34, damping, delta);
    }
    if (frame.current) frame.current.scale.z = THREE.MathUtils.damp(frame.current.scale.z, 1 + frameT * 0.28, damping, delta);
  });

  return (
    <group ref={root} scale={0.82} position={[1.45, -0.2, 0]}>
      <group ref={rail} position={[0, 0, 0]}>
        <BrassRod position={[-1.74, 2.08, -0.64]} length={1.28} />
        <BrassRod position={[1.74, 2.08, -0.64]} length={1.28} />
        <BrassRod position={[-1.74, 2.08, 0.64]} length={1.28} />
        <BrassRod position={[1.74, 2.08, 0.64]} length={1.28} />
        <BrassRod position={[0, 2.72, -0.64]} length={3.48} rotation={[0, 0, Math.PI / 2]} />
        <BrassRod position={[0, 2.72, 0.64]} length={3.48} rotation={[0, 0, Math.PI / 2]} />
        <BrassRod position={[-1.74, 2.72, 0]} length={1.28} rotation={[Math.PI / 2, 0, 0]} />
        <BrassRod position={[1.74, 2.72, 0]} length={1.28} rotation={[Math.PI / 2, 0, 0]} />
        <mesh position={[-1.75, 2.78, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.72, 18]} />
          <meshStandardMaterial color="#2f2119" roughness={0.7} />
        </mesh>
      </group>

      <group ref={topShelf} position={[0, 0, 0]}>
        <group position={[0, 1.5, 0]}><WoodShelf /></group>
      </group>
      <group ref={middleShelf} position={[0, 0, 0]}>
        <group position={[0, 0.15, 0]}><WoodShelf width={3.95} depth={1.72} /></group>
      </group>

      <group ref={frame}>
        {[-1.72, 1.72].flatMap((x) => [-0.62, 0.62].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.35, z]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 3.65, 14]} />
            <meshStandardMaterial color="#9d7b42" metalness={0.66} roughness={0.32} />
          </mesh>
        )))}
        <group position={[0, -1.52, 0]}><WoodShelf width={3.95} depth={1.72} /></group>
      </group>

      <group ref={leftCabinet}><CabinetPod side={-1} /></group>
      <group ref={rightCabinet}><CabinetPod side={1} /></group>

      <group ref={bigWheel} position={[0, 0, 0]}>
        <group position={[1.98, -1.65, 0.78]}><Wheel /></group>
      </group>
      <group ref={caster} position={[0, 0, 0]}>
        <group position={[-1.58, -2.15, 0.58]}><Caster /></group>
      </group>
    </group>
  );
}

function Scene({ progressRef }: { progressRef: ProgressRef }) {
  return (
    <>
      <color attach="background" args={["#d7b982"]} />
      <fog attach="fog" args={["#d7b982", 9, 17]} />
      <ambientLight intensity={1.7} color="#fff0d3" />
      <directionalLight position={[-4, 7, 5]} intensity={3.8} color="#fff0d0" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[5, 2, 4]} intensity={1.4} color="#e4b56c" />
      <spotLight position={[0, 7, -2]} angle={0.7} penumbra={0.8} intensity={2.2} color="#fff4d7" />
      <Suspense fallback={null}>
        <CartModel progressRef={progressRef} />
      </Suspense>
      <mesh position={[0, -2.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <shadowMaterial color="#3a2113" transparent opacity={0.28} />
      </mesh>
    </>
  );
}

export default function CartExperience() {
  const storyRef = useRef<HTMLElement>(null);
  const { progressRef, activeChapter } = useStoryProgress(storyRef);
  const chapter = CHAPTERS[activeChapter];

  return (
    <main>
      <a className="skip-link" href="#details">跳过动态展示</a>

      <section className="cart-story" ref={storyRef} aria-label="MORI 移动边柜拆解展示">
        <div className="story-sticky">
          <header className="site-header">
            <a className="wordmark" href="#top" aria-label="MORI 首页">MORI</a>
            <div className="header-note">OBJECTS FOR A MOVING HOME</div>
            <a className="header-link" href="#details">查看规格</a>
          </header>

          <div className="canvas-wrap" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 0.15, 8.7], fov: 35 }}
              dpr={[1, 1.6]}
              shadows
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            >
              <Scene progressRef={progressRef} />
            </Canvas>
          </div>

          <div className={`chapter chapter-${activeChapter}`} aria-live="polite">
            <p className="chapter-eyebrow">{chapter.eyebrow}</p>
            <h1>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
            <p className="chapter-body">{chapter.body}</p>
          </div>

          <div className="chapter-index" aria-hidden="true">
            <span>{String(activeChapter + 1).padStart(2, "0")}</span>
            <div className="index-line"><i style={{ transform: `scaleX(${(activeChapter + 1) / CHAPTERS.length})` }} /></div>
            <span>{String(CHAPTERS.length).padStart(2, "0")}</span>
          </div>

          <div className="scroll-prompt" aria-hidden="true">
            <span>SCROLL TO DISASSEMBLE</span>
            <i />
          </div>
        </div>
      </section>

      <section className="details" id="details">
        <div className="details-heading">
          <p>移动边柜 / 03</p>
          <h2>为家的变化，<br />留出一点余地。</h2>
        </div>
        <div className="spec-table" aria-label="产品规格">
          <div><span>材质</span><strong>胡桃木 / 藤编 / 黄铜</strong></div>
          <div><span>尺寸</span><strong>W 860 × D 420 × H 980 mm</strong></div>
          <div><span>轮组</span><strong>木质主轮 + 万向脚轮</strong></div>
          <div><span>适用</span><strong>餐边 / 客厅 / 工作室</strong></div>
        </div>
        <div className="details-footer">
          <p>这是一份网页交互与 3D 产品展示练习。模型由浏览器实时生成。</p>
          <a href="#top">重新查看拆解 <span aria-hidden="true">↑</span></a>
        </div>
      </section>
    </main>
  );
}
