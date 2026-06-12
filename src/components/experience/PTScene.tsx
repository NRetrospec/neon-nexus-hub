import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * PTScene — lightweight React Three Fiber centerpiece.
 * A glowing PT pedestal: floating crowned core, orbiting energy rings,
 * and a sparse particle field. Built for 60fps:
 *  - frameloop only while visible, dpr capped at 1.5
 *  - ~200 particles in one buffer geometry
 *  - no shadows, no postprocessing, basic materials only
 */

const LIME = new THREE.Color("hsl(78, 100%, 56%)");
const PURPLE = new THREE.Color("hsl(270, 100%, 65%)");

const Core = () => {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.25;
      group.current.position.y = Math.sin(t * 0.8) * 0.15;
    }
    if (inner.current) {
      inner.current.rotation.x = t * 0.4;
      inner.current.rotation.z = t * 0.18;
    }
  });

  return (
    <group ref={group}>
      {/* Crown spike */}
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.18, 0.45, 4]} />
        <meshStandardMaterial
          color={LIME}
          emissive={LIME}
          emissiveIntensity={1.4}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
      {/* Core icosahedron */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color={"#0c0a1e"}
          emissive={PURPLE}
          emissiveIntensity={0.35}
          metalness={0.7}
          roughness={0.2}
          flatShading
        />
      </mesh>
      {/* Wireframe shell */}
      <mesh scale={1.25}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial color={LIME} wireframe transparent opacity={0.22} />
      </mesh>
    </group>
  );
};

const Rings = () => {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (r1.current) {
      r1.current.rotation.z = t * 0.3;
      r1.current.rotation.x = Math.PI / 2.4 + Math.sin(t * 0.4) * 0.12;
    }
    if (r2.current) {
      r2.current.rotation.z = -t * 0.22;
      r2.current.rotation.x = Math.PI / 1.9 + Math.cos(t * 0.35) * 0.1;
    }
  });

  return (
    <>
      <mesh ref={r1}>
        <torusGeometry args={[1.15, 0.012, 8, 64]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.55} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[1.45, 0.01, 8, 64]} />
        <meshBasicMaterial color={PURPLE} transparent opacity={0.4} />
      </mesh>
    </>
  );
};

const ParticleField = () => {
  const points = useRef<THREE.Points>(null);

  const count = 200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 1.8 + Math.random() * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const c = Math.random() < 0.6 ? LIME : PURPLE;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

const Pedestal = () => {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glow.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 1.4) * 0.08;
      glow.current.scale.set(s, 1, s);
    }
  });
  return (
    <group position={[0, -1.35, 0]}>
      <mesh>
        <cylinderGeometry args={[0.85, 1.05, 0.18, 6]} />
        <meshStandardMaterial
          color={"#0e0b22"}
          emissive={PURPLE}
          emissiveIntensity={0.18}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh ref={glow} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.25, 48]} />
        <meshBasicMaterial
          color={LIME}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const PTScene = () => {
  return (
    <div className="w-full h-full" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.4, 4.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.35} />
          <pointLight position={[3, 3, 3]} intensity={28} color={LIME} />
          <pointLight position={[-3, -1, 2]} intensity={22} color={PURPLE} />
          <Core />
          <Rings />
          <ParticleField />
          <Pedestal />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default PTScene;
