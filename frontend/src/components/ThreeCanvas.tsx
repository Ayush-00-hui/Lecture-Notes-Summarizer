import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeCanvasProps {
  isDark: boolean;
  className?: string;
  interactive?: boolean;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  isDark,
  className = '',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Configuration (Knowledge Constellation)
    const particleCount = 110;
    const maxDistance = 55;
    const bounds = { x: 180, y: 90, z: 120 };

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const x = (Math.random() - 0.5) * bounds.x * 2;
      const y = (Math.random() - 0.5) * bounds.y * 2;
      const z = (Math.random() - 0.5) * bounds.z * 2;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      initialPositions[idx] = x;
      initialPositions[idx + 1] = y;
      initialPositions[idx + 2] = z;

      velocities[idx] = (Math.random() - 0.5) * 0.25;
      velocities[idx + 1] = (Math.random() - 0.5) * 0.25;
      velocities[idx + 2] = (Math.random() - 0.5) * 0.25;
    }

    // Node Points
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const nodeColor = isDark ? 0x94a3b8 : 0x475569;
    const nodeMaterial = new THREE.PointsMaterial({
      color: nodeColor,
      size: isDark ? 3.5 : 3.0,
      transparent: true,
      opacity: isDark ? 0.85 : 0.75,
      blending: THREE.NormalBlending,
    });

    const pointCloud = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(pointCloud);

    // Dynamic Connections (Lines)
    const maxLineConnections = 300;
    const linePositions = new Float32Array(maxLineConnections * 2 * 3);
    const lineColors = new Float32Array(maxLineConnections * 2 * 3);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    lineGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.NormalBlending,
      linewidth: 1,
    });

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = normX * 25;
      targetY = normY * 15;
    };

    if (interactive) {
      window.addEventListener('pointermove', onPointerMove);
    }

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 280;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationId: number;
    let clock = new THREE.Clock();

    const lineBaseR = isDark ? 0.58 : 0.28;
    const lineBaseG = isDark ? 0.64 : 0.35;
    const lineBaseB = isDark ? 0.76 : 0.45;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX;
      camera.position.y = mouseY;
      camera.lookAt(0, 0, 0);

      // Rotate point cloud gently
      pointCloud.rotation.y = elapsed * 0.04;
      linesMesh.rotation.y = elapsed * 0.04;

      // Update positions
      const posArray = nodeGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;

        // Subtle harmonic oscillation
        posArray[idx] += velocities[idx] + Math.sin(elapsed + i) * 0.04;
        posArray[idx + 1] += velocities[idx + 1] + Math.cos(elapsed * 0.8 + i) * 0.04;
        posArray[idx + 2] += velocities[idx + 2];

        // Soft bounce boundaries
        if (Math.abs(posArray[idx]) > bounds.x) velocities[idx] *= -1;
        if (Math.abs(posArray[idx + 1]) > bounds.y) velocities[idx + 1] *= -1;
        if (Math.abs(posArray[idx + 2]) > bounds.z) velocities[idx + 2] *= -1;
      }
      nodeGeometry.attributes.position.needsUpdate = true;

      // Calculate Connections
      let lineVertexIdx = 0;
      let connectionCount = 0;
      const linePosArray = lineGeometry.attributes.position.array as Float32Array;
      const lineColArray = lineGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (connectionCount >= maxLineConnections) break;

          const i3 = i * 3;
          const j3 = j * 3;

          const dx = posArray[i3] - posArray[j3];
          const dy = posArray[i3 + 1] - posArray[j3 + 1];
          const dz = posArray[i3 + 2] - posArray[j3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isDark ? 0.35 : 0.22);

            // Vertex 1
            linePosArray[lineVertexIdx] = posArray[i3];
            linePosArray[lineVertexIdx + 1] = posArray[i3 + 1];
            linePosArray[lineVertexIdx + 2] = posArray[i3 + 2];

            lineColArray[lineVertexIdx] = lineBaseR * alpha;
            lineColArray[lineVertexIdx + 1] = lineBaseG * alpha;
            lineColArray[lineVertexIdx + 2] = lineBaseB * alpha;

            // Vertex 2
            linePosArray[lineVertexIdx + 3] = posArray[j3];
            linePosArray[lineVertexIdx + 4] = posArray[j3 + 1];
            linePosArray[lineVertexIdx + 5] = posArray[j3 + 2];

            lineColArray[lineVertexIdx + 3] = lineBaseR * alpha;
            lineColArray[lineVertexIdx + 4] = lineBaseG * alpha;
            lineColArray[lineVertexIdx + 5] = lineBaseB * alpha;

            lineVertexIdx += 6;
            connectionCount++;
          }
        }
      }

      lineGeometry.setDrawRange(0, connectionCount * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      if (interactive) {
        window.removeEventListener('pointermove', onPointerMove);
      }

      scene.remove(pointCloud);
      scene.remove(linesMesh);

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark, interactive]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    />
  );
};
