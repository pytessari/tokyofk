import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping, type Group, type Mesh } from "three";
import { Text } from "@react-three/drei";
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

const EYE_SHAPES: Record<BuddyConfig["eyes"], string> = {
  happy: "^ ^",
  wink: "^ o",
  neutral: "• •",
  angry: "> <",
  sad: "ʘ ʘ",
  stars: "★ ★",
};

const MOUTH_SHAPES: Record<BuddyConfig["mouth"], string> = {
  smile: "‿",
  open: "o",
  smirk: "ᴗ",
  neutral: "—",
  sad: "︵",
  tongue: ":P",
};

export function BuddyModel({ config, animation = "idle" }: Props) {
  const group = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const head = useRef<Group>(null);
  const body = useRef<Mesh>(null);

  const skinColor = SKIN_HEX[config.skin];

  const shirtTexture = useLoader(
    TextureLoader,
    config.shirtPattern === "solid" ? SHIRT_TEXTURES.sakura : SHIRT_TEXTURES[config.shirtPattern],
  );
  shirtTexture.wrapS = shirtTexture.wrapT = RepeatWrapping;
  shirtTexture.repeat.set(2, 2);

  const useTexture = config.shirtPattern !== "solid";

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Idle: leve respiração
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.2) * 0.04;
    }
    if (body.current) {
      body.current.scale.y = 1 + Math.sin(t * 1.2) * 0.015;
    }

    // Reset arms
    if (leftArm.current) {
      leftArm.current.rotation.z = 0.2;
      leftArm.current.rotation.x = 0;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = -0.2;
      rightArm.current.rotation.x = 0;
    }
    if (head.current) {
      head.current.rotation.z = 0;
      head.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    if (animation === "wave" && rightArm.current) {
      rightArm.current.rotation.z = -1.8 + Math.sin(t * 8) * 0.3;
    }
    if (animation === "hug" && leftArm.current && rightArm.current) {
      leftArm.current.rotation.z = 1.4;
      rightArm.current.rotation.z = -1.4;
      leftArm.current.rotation.x = -0.6;
      rightArm.current.rotation.x = -0.6;
    }
    if (animation === "highfive" && rightArm.current) {
      rightArm.current.rotation.z = -2.2;
    }
    if (animation === "kiss" && head.current) {
      head.current.rotation.z = Math.sin(t * 4) * 0.2;
    }
    if (animation === "dance" && group.current && leftArm.current && rightArm.current) {
      group.current.rotation.z = Math.sin(t * 4) * 0.15;
      leftArm.current.rotation.z = 1.2 + Math.sin(t * 6) * 0.4;
      rightArm.current.rotation.z = -1.2 - Math.sin(t * 6) * 0.4;
    } else if (group.current) {
      group.current.rotation.z = 0;
    }
    if (animation === "slap" && rightArm.current) {
      rightArm.current.rotation.z = -0.2 - Math.abs(Math.sin(t * 6)) * 1.5;
    }
  });

  const hairMesh = useMemo(() => {
    const hair = config.hairColor;
    switch (config.hairStyle) {
      case "bald":
        return null;
      case "short":
        return (
          <mesh position={[0, 0.55, 0]} castShadow>
            <sphereGeometry args={[0.55, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={hair} roughness={0.6} />
          </mesh>
        );
      case "long":
        return (
          <group>
            <mesh position={[0, 0.55, 0]} castShadow>
              <sphereGeometry args={[0.56, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.1, -0.15]} castShadow>
              <cylinderGeometry args={[0.5, 0.4, 0.7, 16]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
          </group>
        );
      case "ponytail":
        return (
          <group>
            <mesh position={[0, 0.55, 0]} castShadow>
              <sphereGeometry args={[0.55, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.3, -0.5]} rotation={[0.3, 0, 0]} castShadow>
              <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
          </group>
        );
      case "bun":
        return (
          <group>
            <mesh position={[0, 0.55, 0]} castShadow>
              <sphereGeometry args={[0.55, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.95, 0]} castShadow>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
          </group>
        );
      case "spiky":
        return (
          <group position={[0, 0.55, 0]}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={i}
                  position={[Math.cos(angle) * 0.3, 0.2, Math.sin(angle) * 0.3]}
                  rotation={[Math.sin(angle) * 0.5, 0, Math.cos(angle) * 0.5]}
                  castShadow
                >
                  <coneGeometry args={[0.18, 0.5, 8]} />
                  <meshStandardMaterial color={hair} roughness={0.5} />
                </mesh>
              );
            })}
            <mesh castShadow>
              <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
              <meshStandardMaterial color={hair} roughness={0.6} />
            </mesh>
          </group>
        );
    }
  }, [config.hairStyle, config.hairColor]);

  const accessoryMesh = useMemo(() => {
    switch (config.accessory) {
      case "glasses":
        return (
          <group position={[0, 0.18, 0.45]}>
            <mesh position={[-0.2, 0, 0]}>
              <torusGeometry args={[0.13, 0.025, 8, 24]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0.2, 0, 0]}>
              <torusGeometry args={[0.13, 0.025, 8, 24]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.15, 0.025, 0.025]} />
              <meshStandardMaterial color="#1f2937" />
            </mesh>
          </group>
        );
      case "shades":
        return (
          <mesh position={[0, 0.18, 0.45]}>
            <boxGeometry args={[0.7, 0.18, 0.05]} />
            <meshStandardMaterial color="#000000" metalness={0.6} roughness={0.2} />
          </mesh>
        );
      case "headphones":
        return (
          <group position={[0, 0.6, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.55, 0.04, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#d90036" metalness={0.4} />
            </mesh>
            <mesh position={[-0.55, -0.05, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color="#d90036" />
            </mesh>
            <mesh position={[0.55, -0.05, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color="#d90036" />
            </mesh>
          </group>
        );
      case "halo":
        return (
          <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.04, 8, 32]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
          </mesh>
        );
      case "horns":
        return (
          <group position={[0, 0.95, 0]}>
            <mesh position={[-0.25, 0, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  }, [config.accessory]);

  return (
    <group ref={group} position={[0, -0.5, 0]}>
      {/* Pernas */}
      <mesh position={[-0.2, -0.6, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={config.pantsColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.2, -0.6, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial color={config.pantsColor} roughness={0.7} />
      </mesh>

      {/* Sapatos */}
      <mesh position={[-0.2, -1.05, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.32]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>
      <mesh position={[0.2, -1.05, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.32]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>

      {/* Tronco com camisa */}
      <mesh ref={body} position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.4, 0.5, 8, 16]} />
        {useTexture ? (
          <meshStandardMaterial map={shirtTexture} roughness={0.7} />
        ) : (
          <meshStandardMaterial color={config.shirtColor} roughness={0.7} />
        )}
      </mesh>

      {/* Braço esquerdo */}
      <group ref={leftArm} position={[-0.45, 0.2, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Braço direito */}
      <group ref={rightArm} position={[0.45, 0.2, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Cabeça */}
      <group ref={head} position={[0, 0.7, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.55} />
        </mesh>

        {/* Olhos como texto */}
        <Text
          position={[0, 0.18, 0.48]}
          fontSize={0.18}
          color="#0a0a0a"
          anchorX="center"
          anchorY="middle"
        >
          {EYE_SHAPES[config.eyes]}
        </Text>

        {/* Boca como texto */}
        <Text
          position={[0, -0.1, 0.48]}
          fontSize={0.14}
          color="#0a0a0a"
          anchorX="center"
          anchorY="middle"
        >
          {MOUTH_SHAPES[config.mouth]}
        </Text>

        {/* Bochechas */}
        <mesh position={[-0.28, -0.05, 0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fb7185" transparent opacity={0.45} />
        </mesh>
        <mesh position={[0.28, -0.05, 0.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#fb7185" transparent opacity={0.45} />
        </mesh>

        {hairMesh}
        {accessoryMesh}
      </group>
    </group>
  );
}
