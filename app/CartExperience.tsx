"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import * as THREE from "three";

type ProgressRef = { current: number };
type PointerRef = { current: { x: number; y: number } };

const CHAPTERS = [
  {
    eyebrow: "MORI CART / 03",
    title: "一台边柜，\n走到生活发生的地方。",
    body: "胡桃木、藤编与黄铜构成一辆轻巧的移动边柜。向右滑动，从完整形态看进它的结构。",
    calloutTitle: "三层结构 / 一体移动",
    calloutBody: "开放台面、藤编收纳与双轮系统沿同一框架组织，形成完整的使用动线。",
  },
  {
    eyebrow: "01 / TOP RAIL",
    title: "黄铜护栏，\n让移动更从容。",
    body: "细径金属管围合上层台面，瓶罐与器物不会在推行中轻易滑落；后侧把手同时保留舒适握距。",
    calloutTitle: "细径黄铜管 + 外伸握把",
    calloutBody: "护栏负责止滑，左侧握把沿车宽方向伸出，推行时手腕不必贴近柜体。",
  },
  {
    eyebrow: "02 / SOLID WOOD",
    title: "两层台面，\n各有自己的节奏。",
    body: "上层适合随手取放，中层承担展示与临时操作。圆润的胡桃木边缘回应日常触碰。",
    calloutTitle: "上下分层 / 圆角收边",
    calloutBody: "上层保持高频取放，中层留给展示与操作；木质边缘以小圆角降低磕碰感。",
  },
  {
    eyebrow: "03 / CANE CABINET",
    title: "藤编柜体，\n藏住杂物，留下呼吸。",
    body: "左右分舱收纳让物品保持秩序。通透藤编减轻柜体体量，也让织物与书籍自然通风。",
    calloutTitle: "双分舱藤编门",
    calloutBody: "藤编网面降低封闭柜体的视觉重量，同时给织物、书籍保留持续通风。",
  },
  {
    eyebrow: "04 / DUAL WHEELS",
    title: "大轮越过门槛，\n脚轮负责转身。",
    body: "木质主轮提供稳定支撑，前端万向脚轮完成细腻转向。两种轮组分工，让家具真正能够移动。",
    calloutTitle: "主轮承重 / 脚轮转向",
    calloutBody: "大轮轴心与右前立柱对齐承担越槛，左前万向脚轮与立柱同轴完成小半径转向。",
  },
  {
    eyebrow: "05 / ASSEMBLY",
    title: "看得见结构，\n也看得见长久。",
    body: "每个部件回到原位，形成完整推车。清楚的连接逻辑意味着更容易维护，也更适合长久使用。",
    calloutTitle: "轴线归位 / 模组可维护",
    calloutBody: "层板、柜体、护栏与轮组回到各自连接点，拆装路径清楚，后续维护更直接。",
  },
] as const;

const CHAPTER_LABELS = ["完整形态", "黄铜护栏", "胡桃木层板", "藤编柜体", "双轮系统", "重新组装"] as const;

const DESKTOP_FOCUS = [
  { y: -0.2, scale: 0.82 },
  { y: -0.88, scale: 0.97 },
  { y: -0.38, scale: 0.93 },
  { y: 0.12, scale: 0.99 },
  { y: 0.72, scale: 1.07 },
  { y: -0.05, scale: 0.88 },
] as const;

const MOBILE_FOCUS = [
  { y: 0.72, scale: 0.7 },
  { y: 0.28, scale: 0.78 },
  { y: 0.62, scale: 0.75 },
  { y: 0.88, scale: 0.79 },
  { y: 1.18, scale: 0.84 },
  { y: 0.72, scale: 0.72 },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothRange(value: number, start: number, end: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function useStoryProgress(
  storyRef: RefObject<HTMLElement | null>,
  scrollerRef: RefObject<HTMLDivElement | null>,
) {
  const progressRef = useRef(0);
  const [activeChapter, setActiveChapter] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const scrollable = Math.max(1, scroller.scrollWidth - scroller.clientWidth);
      const next = clamp01(scroller.scrollLeft / scrollable);
      progressRef.current = next;
      storyRef.current?.style.setProperty("--story-progress", String(next));

      const chapter = Math.min(CHAPTERS.length - 1, Math.round(next * (CHAPTERS.length - 1)));
      setActiveChapter((current) => (current === chapter ? current : chapter));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onWheel = (event: WheelEvent) => {
      const scroller = scrollerRef.current;
      const story = storyRef.current;
      if (!scroller || !story) return;

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 0.5) return;

      const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const movingForward = delta > 0;
      const canMove = movingForward ? scroller.scrollLeft < maxScroll - 2 : scroller.scrollLeft > 2;

      if (canMove) {
        event.preventDefault();
        scroller.scrollLeft += delta * 1.15;
      }
    };

    const scroller = scrollerRef.current;
    const story = storyRef.current;
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    story?.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      scroller?.removeEventListener("scroll", onScroll);
      story?.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scrollerRef, storyRef]);

  return { progressRef, activeChapter };
}

function usePointerTracking() {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const resetPointer = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  return pointerRef;
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

function PushHandle() {
  return (
    <group name="pushHandle">
      <BrassRod position={[-2.12, 2.72, 0.64]} length={0.82} rotation={[0, 0, Math.PI / 2]} />
      <mesh position={[-2.53, 2.72, 0.64]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.54, 18]} />
        <meshStandardMaterial color="#2f2119" roughness={0.72} />
      </mesh>
    </group>
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

function CartModel({ progressRef, pointerRef }: { progressRef: ProgressRef; pointerRef: PointerRef }) {
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
    const chapterPosition = p * (CHAPTERS.length - 1);
    const chapterIndex = Math.min(CHAPTERS.length - 1, Math.round(chapterPosition));
    const chapterProgress = chapterIndex === 0 ? 1 : clamp01((chapterPosition - chapterIndex + 0.5) * 2);
    const focus = (isMobile ? MOBILE_FOCUS : DESKTOP_FOCUS)[chapterIndex];
    const previousFocus = (isMobile ? MOBILE_FOCUS : DESKTOP_FOCUS)[Math.max(0, chapterIndex - 1)];
    const focusArrival = reducedMotion.current ? 1 : smoothRange(chapterProgress, 0.04, 0.28);
    const entryScale = chapterIndex === 0 ? focus.scale : focus.scale - (isMobile ? 0.055 : 0.085);
    const focusScale = THREE.MathUtils.lerp(entryScale, focus.scale, focusArrival);
    const focusY = THREE.MathUtils.lerp(previousFocus.y, focus.y, focusArrival);
    const pointerX = isMobile || reducedMotion.current ? 0 : pointerRef.current.x;
    const pointerY = isMobile || reducedMotion.current ? 0 : pointerRef.current.y;

    if (root.current) {
      const routeStart = isMobile ? -0.58 : -1.72;
      const routeEnd = isMobile ? 0.58 : 1.72;
      const targetX = THREE.MathUtils.lerp(routeStart, routeEnd, p) + pointerX * 0.12;
      const targetY = focusY - pointerY * 0.1;
      const targetScale = focusScale;
      root.current.position.x = THREE.MathUtils.damp(root.current.position.x, targetX, damping, delta);
      root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY, damping, delta);
      const nextScale = THREE.MathUtils.damp(root.current.scale.x, targetScale, damping, delta);
      root.current.scale.setScalar(nextScale);
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        -0.34 + p * 0.65 + pointerX * 0.17 + (reducedMotion.current ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.025),
        damping,
        delta,
      );
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -0.06 + p * 0.08 - pointerY * 0.07, damping, delta);
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
    <group ref={root} scale={0.82} position={[-1.72, -0.2, 0]}>
      <group ref={rail} position={[0, 0, 0]}>
        <BrassRod position={[-1.74, 2.08, -0.64]} length={1.28} />
        <BrassRod position={[1.74, 2.08, -0.64]} length={1.28} />
        <BrassRod position={[-1.74, 2.08, 0.64]} length={1.28} />
        <BrassRod position={[1.74, 2.08, 0.64]} length={1.28} />
        <BrassRod position={[0, 2.72, -0.64]} length={3.48} rotation={[0, 0, Math.PI / 2]} />
        <BrassRod position={[0, 2.72, 0.64]} length={3.48} rotation={[0, 0, Math.PI / 2]} />
        <BrassRod position={[-1.74, 2.72, 0]} length={1.28} rotation={[Math.PI / 2, 0, 0]} />
        <BrassRod position={[1.74, 2.72, 0]} length={1.28} rotation={[Math.PI / 2, 0, 0]} />
        <PushHandle />
      </group>

      <group ref={topShelf} position={[0, 0, 0]}>
        <group position={[0, 1.5, 0]}><WoodShelf /></group>
      </group>
      <group ref={middleShelf} position={[0, 0, 0]}>
        <group position={[0, 0.15, 0]}><WoodShelf width={3.95} depth={1.72} /></group>
      </group>

      <group ref={frame}>
        {[-1.72, 1.72].flatMap((x) => [-0.62, 0.62].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, -0.05, z]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 3.15, 14]} />
            <meshStandardMaterial color="#9d7b42" metalness={0.66} roughness={0.32} />
          </mesh>
        )))}
        <group position={[0, -1.52, 0]}><WoodShelf width={3.95} depth={1.72} /></group>
      </group>

      <group ref={leftCabinet}><CabinetPod side={-1} /></group>
      <group ref={rightCabinet}><CabinetPod side={1} /></group>

      <group ref={bigWheel} name="largeWheelModule" position={[0, 0, 0]}>
        <mesh position={[1.72, -1.46, 0.71]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.42, 24]} />
          <meshStandardMaterial color="#9d7b42" metalness={0.66} roughness={0.32} />
        </mesh>
        <group position={[1.72, -1.46, 0.86]}><Wheel /></group>
      </group>
      <group ref={caster} position={[0, 0, 0]}>
        <group position={[-1.72, -2.06, 0.62]}><Caster /></group>
      </group>
    </group>
  );
}

function Scene({ progressRef, pointerRef }: { progressRef: ProgressRef; pointerRef: PointerRef }) {
  return (
    <>
      <color attach="background" args={["#d7b982"]} />
      <fog attach="fog" args={["#d7b982", 9, 17]} />
      <ambientLight intensity={1.7} color="#fff0d3" />
      <directionalLight position={[-4, 7, 5]} intensity={3.8} color="#fff0d0" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[5, 2, 4]} intensity={1.4} color="#e4b56c" />
      <spotLight position={[0, 7, -2]} angle={0.7} penumbra={0.8} intensity={2.2} color="#fff4d7" />
      <Suspense fallback={null}>
        <CartModel progressRef={progressRef} pointerRef={pointerRef} />
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { progressRef, activeChapter } = useStoryProgress(storyRef, scrollerRef);
  const pointerRef = usePointerTracking();

  const scrollToChapter = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    scroller.scrollTo({
      left: index * scroller.clientWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, []);

  const onScrollerKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    scrollToChapter(Math.min(CHAPTERS.length - 1, Math.max(0, activeChapter + direction)));
  }, [activeChapter, scrollToChapter]);

  return (
    <main>
      <a className="skip-link" href="#details">跳过动态展示</a>

      <section className="cart-story" id="top" ref={storyRef} aria-label="MORI 移动边柜拆解展示">
        <div className="story-sticky">
          <header className="site-header">
            <a className="wordmark" href="#top" aria-label="MORI 首页" onClick={() => scrollToChapter(0)}>MORI</a>
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
              <Scene progressRef={progressRef} pointerRef={pointerRef} />
            </Canvas>
          </div>

          <div
            className="horizontal-scroller"
            ref={scrollerRef}
            tabIndex={0}
            role="region"
            aria-label="横向滑动查看推车结构"
            onKeyDown={onScrollerKeyDown}
          >
            <div className="chapter-track">
              {CHAPTERS.map((item, index) => (
                <section
                  className={`chapter-panel chapter-panel-${index}`}
                  key={item.eyebrow}
                  aria-label={CHAPTER_LABELS[index]}
                  aria-current={index === activeChapter ? "step" : undefined}
                >
                  <div className={`chapter chapter-${index}`}>
                    <p className="chapter-eyebrow">{item.eyebrow}</p>
                    <h1>{item.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
                    <p className="chapter-body">{item.body}</p>
                    <aside className="detail-callout">
                      <i aria-hidden="true" />
                      <span>{item.calloutTitle}</span>
                      <p>{item.calloutBody}</p>
                    </aside>
                  </div>
                </section>
              ))}
            </div>
          </div>

          <nav className="chapter-index" aria-label="结构展示章节">
            <span>{String(activeChapter + 1).padStart(2, "0")}</span>
            <div className="chapter-steps">
              {CHAPTERS.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  className={index === activeChapter ? "is-active" : undefined}
                  aria-label={`前往${CHAPTER_LABELS[index]}`}
                  aria-current={index === activeChapter ? "step" : undefined}
                  onClick={() => scrollToChapter(index)}
                >
                  <i />
                </button>
              ))}
            </div>
            <span>{String(CHAPTERS.length).padStart(2, "0")}</span>
          </nav>

          <div className="scroll-prompt" aria-hidden="true">
            <span>从左向右 · 推动查看结构</span>
            <i />
          </div>

          <div className="push-route" aria-hidden="true">
            <span>START</span>
            <i><b /></i>
            <span>FINISH</span>
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
          <a href="#top" onClick={() => scrollToChapter(0)}>重新查看拆解 <span aria-hidden="true">↑</span></a>
        </div>
      </section>
    </main>
  );
}
