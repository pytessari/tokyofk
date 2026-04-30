import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { BuddyModel } from "./BuddyModel";
import type { BuddyConfig, PokeAction } from "@/lib/buddy/types";

type Props = {
  config: BuddyConfig;
  animation?: PokeAction | "idle";
  interactive?: boolean;
  className?: string;
};

export function BuddyCanvas({ config, animation = "idle", interactive = true, className }: Props) {
  return (
    <div className={className ?? "h-full w-full"}>
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 4], fov: 35 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#0a0a12"]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#d90036" />
        <Suspense fallback={null}>
          <BuddyModel config={config} animation={animation} />
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.5}
            scale={6}
            blur={2}
            far={2}
          />
          <Environment preset="city" />
        </Suspense>
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
}
