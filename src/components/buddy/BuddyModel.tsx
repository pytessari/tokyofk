import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping, type Group, type Mesh } from "three";
import {
  type BuddyConfig,
  type PokeAction,
  SHIRT_TEXTURES,
  SKIN_HEX,
} from "@/lib/buddy/types";

type Props = {
  config: BuddyConfig;
  animation?: PokeAction | "idle";
};

// Cores das íris por estilo de "olhos" (estilo anime: olho grande com íris colorida)
const IRIS_COLOR: Record<BuddyConfig["eyes"], string> = {
  happy: "#7c3aed",
  wink: "#0ea5e9",
  neutral: "#1e293b",
  angry: "#b91c1c",
  sad: "#0891b2",
  stars: "#f59e0b",
};

export function BuddyModel({ config, animation = "idle" }: Props) {
  const group = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const head = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const leftEyelid = useRef<Mesh>(null);
  const rightEyelid = useRef<Mesh>(null);

  const skinColor = SKIN_HEX[config.skin];
  // Sombra de cabelo um tom mais escuro (cel-shading manual)
  const hairShadow = useMemo(() => {
    const c = config.hairColor.replace("#", "");
    if (c.length !== 6) return "#1a1a1a";
    const r = Math.max(0, parseInt(c.slice(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(c.slice(2, 4), 16) - 40);
    const b = Math.max(0, parseInt(c.slice(4, 6), 16) - 40);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }, [config.hairColor]);

  const shirtTexture = useLoader(
    TextureLoader,
    config.shirtPattern === "solid" ? SHIRT_TEXTURES.sakura : SHIRT_TEXTURES[config.shirtPattern],
  );
  shirtTexture.wrapS = shirtTexture.wrapT = RepeatWrapping;
  shirtTexture.repeat.set(2, 2);

  const useTexture = config.shirtPattern !== "solid";

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle: respiração + bobbing leve
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.4) * 0.04 - 0.4;
    }
    if (body.current) {
      body.current.scale.y = 1 + Math.sin(t * 1.4) * 0.02;
    }

    // Reset arms
    if (leftArm.current) {
      leftArm.current.rotation.z = 0.18;
      leftArm.current.rotation.x = 0;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = -0.18;
      rightArm.current.rotation.x = 0;
    }
    if (head.current) {
      head.current.rotation.z = 0;
      head.current.rotation.y = Math.sin(t * 0.5) * 0.12;
      head.current.rotation.x = Math.sin(t * 0.7) * 0.04;
    }

    // Piscadinha periódica
    const blinkCycle = (t % 4) / 4;
    const blinking = blinkCycle > 0.96;
    const eyelidScale = blinking ? 1 : 0.05;
    if (leftEyelid.current) leftEyelid.current.scale.y = eyelidScale;
    if (rightEyelid.current) rightEyelid.current.scale.y = config.eyes === "wink" ? 1 : eyelidScale;

    // Animações específicas
    if (animation === "wave" && rightArm.current) {
      rightArm.current.rotation.z = -1.9 + Math.sin(t * 9) * 0.35;
    }
    if (animation === "hug" && leftArm.current && rightArm.current) {
      leftArm.current.rotation.z = 1.5;
      rightArm.current.rotation.z = -1.5;
      leftArm.current.rotation.x = -0.7;
      rightArm.current.rotation.x = -0.7;
    }
    if (animation === "highfive" && rightArm.current) {
      rightArm.current.rotation.z = -2.3;
    }
    if (animation === "kiss" && head.current) {
      head.current.rotation.z = Math.sin(t * 4) * 0.22;
    }
    if (animation === "dance" && group.current && leftArm.current && rightArm.current) {
      group.current.rotation.z = Math.sin(t * 4) * 0.18;
      leftArm.current.rotation.z = 1.3 + Math.sin(t * 6) * 0.45;
      rightArm.current.rotation.z = -1.3 - Math.sin(t * 6) * 0.45;
    } else if (group.current) {
      group.current.rotation.z = 0;
    }
    if (animation === "slap" && rightArm.current) {
      rightArm.current.rotation.z = -0.2 - Math.abs(Math.sin(t * 6)) * 1.6;
    }
  });

  // ============ CABELO ESTILO ANIME ============
  // Cabeça com franja, mechas laterais, e variantes por estilo.
  const hairMesh = useMemo(() => {
    const hair = config.hairColor;

    // Calota base da cabeça (sempre presente exceto careca) — cobre o crânio
    const cap = (
      <mesh position={[0, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.62, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshToonMaterial color={hair} />
      </mesh>
    );

    // Franja: 3 mechas pontudas na frente
    const fringe = (
      <group position={[0, 0.18, 0.5]}>
        <mesh position={[-0.22, 0, 0]} rotation={[0.4, 0.2, 0.3]} castShadow>
          <coneGeometry args={[0.18, 0.42, 6]} />
          <meshToonMaterial color={hair} />
        </mesh>
        <mesh position={[0.05, 0.05, 0]} rotation={[0.5, -0.1, -0.2]} castShadow>
          <coneGeometry args={[0.16, 0.38, 6]} />
          <meshToonMaterial color={hair} />
        </mesh>
        <mesh position={[0.28, -0.02, -0.05]} rotation={[0.4, -0.3, -0.4]} castShadow>
          <coneGeometry args={[0.14, 0.36, 6]} />
          <meshToonMaterial color={hair} />
        </mesh>
        {/* destaque/highlight no cabelo */}
        <mesh position={[0, 0.15, 0.04]} rotation={[0.5, 0, 0]}>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
        </mesh>
      </group>
    );

    // Mechas laterais (cobrem orelhas)
    const sideLocks = (
      <group>
        <mesh position={[-0.46, -0.05, 0.15]} rotation={[0, 0, 0.2]} castShadow>
          <coneGeometry args={[0.13, 0.55, 6]} />
          <meshToonMaterial color={hairShadow} />
        </mesh>
        <mesh position={[0.46, -0.05, 0.15]} rotation={[0, 0, -0.2]} castShadow>
          <coneGeometry args={[0.13, 0.55, 6]} />
          <meshToonMaterial color={hairShadow} />
        </mesh>
      </group>
    );

    switch (config.hairStyle) {
      case "bald":
        return null;
      case "short":
        return (
          <group>
            {cap}
            {fringe}
            <mesh position={[-0.42, -0.02, 0.12]} rotation={[0, 0, 0.3]} castShadow>
              <coneGeometry args={[0.1, 0.32, 6]} />
              <meshToonMaterial color={hair} />
            </mesh>
            <mesh position={[0.42, -0.02, 0.12]} rotation={[0, 0, -0.3]} castShadow>
              <coneGeometry args={[0.1, 0.32, 6]} />
              <meshToonMaterial color={hair} />
            </mesh>
          </group>
        );
      case "long":
        return (
          <group>
            {cap}
            {fringe}
            {sideLocks}
            {/* costas: cabelo longo */}
            <mesh position={[0, -0.15, -0.25]} castShadow>
              <cylinderGeometry args={[0.55, 0.42, 0.95, 16]} />
              <meshToonMaterial color={hair} />
            </mesh>
            <mesh position={[0, -0.55, -0.3]} castShadow>
              <coneGeometry args={[0.42, 0.5, 12]} />
              <meshToonMaterial color={hair} />
            </mesh>
          </group>
        );
      case "ponytail":
        return (
          <group>
            {cap}
            {fringe}
            {sideLocks}
            <mesh position={[0, 0.05, -0.5]} rotation={[0.4, 0, 0]} castShadow>
              <capsuleGeometry args={[0.14, 0.7, 8, 16]} />
              <meshToonMaterial color={hair} />
            </mesh>
            <mesh position={[0, -0.32, -0.7]} rotation={[0.6, 0, 0]} castShadow>
              <coneGeometry args={[0.12, 0.3, 8]} />
              <meshToonMaterial color={hair} />
            </mesh>
          </group>
        );
      case "bun":
        return (
          <group>
            {cap}
            {fringe}
            {sideLocks}
            <mesh position={[0, 0.95, -0.05]} castShadow>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshToonMaterial color={hair} />
            </mesh>
            {/* fitinha */}
            <mesh position={[0, 0.95, -0.05]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.25, 0.025, 8, 24]} />
              <meshToonMaterial color="#d90036" />
            </mesh>
          </group>
        );
      case "spiky":
        return (
          <group>
            {cap}
            {/* espetos para cima/frente — estilo shounen */}
            {[
              { pos: [-0.25, 0.5, 0.25], rot: [-0.3, 0, -0.4] },
              { pos: [0, 0.55, 0.3], rot: [-0.3, 0, 0] },
              { pos: [0.25, 0.5, 0.25], rot: [-0.3, 0, 0.4] },
              { pos: [-0.4, 0.4, -0.05], rot: [-0.1, 0, -0.7] },
              { pos: [0.4, 0.4, -0.05], rot: [-0.1, 0, 0.7] },
              { pos: [-0.15, 0.55, -0.2], rot: [0.2, 0, -0.2] },
              { pos: [0.15, 0.55, -0.2], rot: [0.2, 0, 0.2] },
            ].map((s, i) => (
              <mesh
                key={i}
                position={s.pos as [number, number, number]}
                rotation={s.rot as [number, number, number]}
                castShadow
              >
                <coneGeometry args={[0.13, 0.45, 6]} />
                <meshToonMaterial color={hair} />
              </mesh>
            ))}
          </group>
        );
    }
  }, [config.hairStyle, config.hairColor, hairShadow]);

  const accessoryMesh = useMemo(() => {
    switch (config.accessory) {
      case "glasses":
        return (
          <group position={[0, 0.0, 0.55]}>
            <mesh position={[-0.22, 0, 0]}>
              <torusGeometry args={[0.16, 0.022, 8, 24]} />
              <meshStandardMaterial color="#1f2937" metalness={0.4} />
            </mesh>
            <mesh position={[0.22, 0, 0]}>
              <torusGeometry args={[0.16, 0.022, 8, 24]} />
              <meshStandardMaterial color="#1f2937" metalness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.13, 0.022, 0.022]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          </group>
        );
      case "shades":
        return (
          <mesh position={[0, 0.0, 0.55]}>
            <boxGeometry args={[0.78, 0.2, 0.05]} />
            <meshStandardMaterial color="#000000" metalness={0.7} roughness={0.15} />
          </mesh>
        );
      case "headphones":
        return (
          <group position={[0, 0.55, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.62, 0.045, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#d90036" metalness={0.5} />
            </mesh>
            <mesh position={[-0.62, -0.05, 0]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color="#d90036" />
            </mesh>
            <mesh position={[0.62, -0.05, 0]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color="#d90036" />
            </mesh>
          </group>
        );
      case "halo":
        return (
          <mesh position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45, 0.04, 8, 32]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} />
          </mesh>
        );
      case "horns":
        return (
          <group position={[0, 1.0, 0.05]}>
            <mesh position={[-0.28, 0, 0]} rotation={[0, 0, -0.35]}>
              <coneGeometry args={[0.11, 0.34, 8]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <mesh position={[0.28, 0, 0]} rotation={[0, 0, 0.35]}>
              <coneGeometry args={[0.11, 0.34, 8]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  }, [config.accessory]);

  // ============ OLHOS ESTILO ANIME ============
  // Esfera branca grande + íris colorida + pupila + 2 highlights
  const iris = IRIS_COLOR[config.eyes];
  const isStars = config.eyes === "stars";
  const isAngry = config.eyes === "angry";
  const isSad = config.eyes === "sad";
  const isWink = config.eyes === "wink";

  function Eye({ x, isWinking = false }: { x: number; isWinking?: boolean }) {
    return (
      <group position={[x, 0.05, 0.5]}>
        {/* esclera */}
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* íris */}
        <mesh position={[0, isSad ? -0.02 : 0, 0.07]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshBasicMaterial color={iris} />
        </mesh>
        {/* pupila */}
        <mesh position={[0, isSad ? -0.02 : 0, 0.13]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#0a0a0a" />
        </mesh>
        {/* highlight grande superior */}
        <mesh position={[0.025, 0.04, 0.16]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* highlight pequeno inferior */}
        <mesh position={[-0.03, -0.03, 0.16]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* estrelas */}
        {isStars && (
          <mesh position={[0, 0, 0.17]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.04, 0.012, 4, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
        {/* sobrancelha (bravo) */}
        {isAngry && (
          <mesh position={[0, 0.18, 0.05]} rotation={[0, 0, x > 0 ? 0.4 : -0.4]}>
            <boxGeometry args={[0.16, 0.025, 0.04]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        )}
        {/* lágrima (triste) */}
        {isSad && (
          <mesh position={[0.02, -0.18, 0.12]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} />
          </mesh>
        )}
        {/* pálpebra (piscar) — escala em y vai a 1 quando piscar */}
        <mesh
          ref={x < 0 ? leftEyelid : rightEyelid}
          position={[0, 0, 0.05]}
          scale={[1, isWinking ? 1 : 0.05, 1]}
        >
          <sphereGeometry args={[0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={skinColor} />
        </mesh>
      </group>
    );
  }

  // ============ BOCA ESTILO ANIME ============
  function Mouth() {
    const m = config.mouth;
    if (m === "open") {
      return (
        <group position={[0, -0.22, 0.55]}>
          <mesh>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#7f1d1d" />
          </mesh>
        </group>
      );
    }
    if (m === "tongue") {
      return (
        <group position={[0, -0.22, 0.55]}>
          <mesh>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color="#7f1d1d" />
          </mesh>
          <mesh position={[0.04, -0.04, 0.04]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ec4899" />
          </mesh>
        </group>
      );
    }
    // smile / smirk / neutral / sad — usar torus parcial
    const rot: [number, number, number] =
      m === "sad" ? [0, 0, Math.PI] : m === "smirk" ? [0, 0, -0.3] : [0, 0, 0];
    const arc = m === "neutral" ? Math.PI * 0.4 : Math.PI * 0.7;
    return (
      <mesh position={[0, -0.2, 0.55]} rotation={rot}>
        <torusGeometry args={[0.08, 0.014, 6, 16, arc]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
    );
  }

  return (
    <group ref={group}>
      {/* Pernas — mais finas, estilizadas */}
      <mesh position={[-0.18, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
        <meshToonMaterial color={config.pantsColor} />
      </mesh>
      <mesh position={[0.18, -0.55, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.55, 8, 16]} />
        <meshToonMaterial color={config.pantsColor} />
      </mesh>

      {/* Sapatos */}
      <mesh position={[-0.18, -1.0, 0.06]} castShadow>
        <boxGeometry args={[0.22, 0.13, 0.34]} />
        <meshToonMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0.18, -1.0, 0.06]} castShadow>
        <boxGeometry args={[0.22, 0.13, 0.34]} />
        <meshToonMaterial color="#0a0a0a" />
      </mesh>

      {/* Tronco — mais fino que cabeça (proporção chibi/anime) */}
      <mesh ref={body} position={[0, -0.05, 0]} castShadow>
        <capsuleGeometry args={[0.32, 0.45, 8, 16]} />
        {useTexture ? (
          <meshToonMaterial map={shirtTexture} />
        ) : (
          <meshToonMaterial color={config.shirtColor} />
        )}
      </mesh>

      {/* Pescoço pequeno */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.12, 12]} />
        <meshToonMaterial color={skinColor} />
      </mesh>

      {/* Braço esquerdo */}
      <group ref={leftArm} position={[-0.38, 0.15, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, -0.62, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Braço direito */}
      <group ref={rightArm} position={[0.38, 0.15, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, -0.62, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
      </group>

      {/* Cabeça — maior, proporção anime (~60% do tronco) */}
      <group ref={head} position={[0, 0.78, 0]}>
        {/* Crânio levemente achatado lateralmente */}
        <mesh castShadow scale={[1, 1.05, 1]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshToonMaterial color={skinColor} />
        </mesh>

        {/* Olhos anime (grandes, brilhantes) */}
        <Eye x={-0.22} />
        <Eye x={0.22} isWinking={isWink} />

        <Mouth />

        {/* Bochechas — círculos rosados translúcidos */}
        <mesh position={[-0.32, -0.1, 0.45]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.32, -0.1, 0.45]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#fb7185" transparent opacity={0.55} />
        </mesh>

        {/* Nariz sutil */}
        <mesh position={[0, -0.05, 0.58]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.5} />
        </mesh>

        {hairMesh}
        {accessoryMesh}
      </group>
    </group>
  );
}
