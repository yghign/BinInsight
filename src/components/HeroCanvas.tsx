'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

type Mode = 'dark' | 'light';

function readMode(): Mode {
  return document.documentElement.getAttribute('data-mode') === 'light' ? 'light' : 'dark';
}

/**
 * 同一套几何结构在两种模式下渲染两套配色：
 * 深色模式偏发光（加色混合 + 辉光），浅色模式偏制图蓝本（正片叠底 + 清晰描边）。
 */
const palettes = {
  dark: {
    bg: 0x0b0b0c,
    ambient: 0x3a3a52,
    lights: [
      { color: 0x2266ff, intensity: 1.2, pos: [5, 5, 5] as const },
      { color: 0xffffff, intensity: 0.8, pos: [-5, -3, 5] as const },
      { color: 0x00aaff, intensity: 0.7, pos: [0, 0, -10] as const },
    ],
    core: { color: 0x0088ff, emissive: 0x003366, opacity: 0.8 },
    inner: { color: 0xffffff, emissive: 0x004488, opacity: 0.2 },
    rings: [
      { color: 0x00aaff, emissive: 0x004466, opacity: 0.6 },
      { color: 0xffffff, emissive: 0x555555, opacity: 0.7 },
      { color: 0x335577, emissive: 0x112233, opacity: 0.8 },
    ],
    shield: { color: 0x3388ff, opacity: 0.15 },
    shieldLines: [
      { color: 0x44aaff, opacity: 0.15 },
      { color: 0xffffff, opacity: 0.2 },
      { color: 0x44aaff, opacity: 0.25 },
      { color: 0xffffff, opacity: 0.3 },
      { color: 0x44aaff, opacity: 0.35 },
    ],
    particle: { sat: 1, light: 0.5, lightRange: 0.4, blending: THREE.AdditiveBlending },
    stars: { color: 0xffffff, opacity: 0.4, blending: THREE.AdditiveBlending },
    bloom: { strength: 1.2, radius: 0.5, threshold: 0.1 },
    toneMapping: true,
  },
  light: {
    bg: 0xfafaf9,
    ambient: 0xffffff,
    lights: [
      { color: 0x1f55e6, intensity: 1.1, pos: [5, 5, 5] as const },
      { color: 0x94a3b8, intensity: 0.7, pos: [-5, -3, 5] as const },
      { color: 0x0ea5e9, intensity: 0.6, pos: [0, 0, -10] as const },
    ],
    core: { color: 0x1d4ed8, emissive: 0x0a1f6b, opacity: 0.95 },
    inner: { color: 0x1e3a8a, emissive: 0x0b1f66, opacity: 0.14 },
    rings: [
      { color: 0x1f55e6, emissive: 0x0a2670, opacity: 0.85 },
      { color: 0x475569, emissive: 0x1e293b, opacity: 0.7 },
      { color: 0x2563eb, emissive: 0x10275c, opacity: 0.8 },
    ],
    shield: { color: 0x2563eb, opacity: 0.22 },
    shieldLines: [
      { color: 0x2563eb, opacity: 0.3 },
      { color: 0x64748b, opacity: 0.3 },
      { color: 0x2563eb, opacity: 0.36 },
      { color: 0x64748b, opacity: 0.36 },
      { color: 0x2563eb, opacity: 0.42 },
    ],
    particle: { sat: 0.9, light: 0.34, lightRange: 0.2, blending: THREE.NormalBlending },
    stars: { color: 0x64748b, opacity: 0.3, blending: THREE.NormalBlending },
    bloom: null,
    toneMapping: false,
  },
} as const;

export default function HeroCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;

    let mode: Mode = readMode();
    let teardown: () => void = () => {};

    const build = (m: Mode) => {
      const p = palettes[m];
      const width = host.clientWidth || window.innerWidth;
      const height = host.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(p.bg);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 2, 12);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.toneMapping = p.toneMapping ? THREE.ReinhardToneMapping : THREE.NoToneMapping;
      if (p.toneMapping) renderer.toneMappingExposure = 1.15;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      host.appendChild(renderer.domElement);

      // 后期处理：深色模式走辉光，浅色模式直接渲染保持锐利
      let composer: EffectComposer | null = null;
      let bloomPass: UnrealBloomPass | null = null;
      if (p.bloom) {
        composer = new EffectComposer(renderer);
        composer.setSize(width, height);
        composer.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(
          new THREE.Vector2(width, height),
          p.bloom.strength,
          p.bloom.radius,
          p.bloom.threshold
        );
        composer.addPass(bloomPass);
        composer.addPass(new OutputPass());
      }

      // 灯光
      scene.add(new THREE.AmbientLight(p.ambient));
      p.lights.forEach((l) => {
        const light = new THREE.PointLight(l.color, l.intensity, 30);
        light.position.set(l.pos[0], l.pos[1], l.pos[2]);
        scene.add(light);
      });

      const disposables: Array<{ dispose: () => void }> = [];

      // 旋转的数据核心
      const coreGroup = new THREE.Group();
      const innerGeo = new THREE.IcosahedronGeometry(1.2, 2);
      const innerMat = new THREE.MeshStandardMaterial({
        color: p.core.color,
        emissive: p.core.emissive,
        wireframe: true,
        transparent: true,
        opacity: p.core.opacity,
      });
      const innerCore = new THREE.Mesh(innerGeo, innerMat);
      coreGroup.add(innerCore);
      disposables.push(innerGeo, innerMat);

      const innerSphereGeo = new THREE.SphereGeometry(0.8, 24, 24);
      const innerSphereMat = new THREE.MeshStandardMaterial({
        color: p.inner.color,
        emissive: p.inner.emissive,
        transparent: true,
        opacity: p.inner.opacity,
      });
      const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
      coreGroup.add(innerSphere);
      disposables.push(innerSphereGeo, innerSphereMat);

      // 环绕的环
      const rings: THREE.Mesh[] = [];
      p.rings.forEach((r, i) => {
        const ringGeo = new THREE.TorusGeometry(1.8 + i * 0.6, 0.03, 48, 128);
        const ringMat = new THREE.MeshStandardMaterial({
          color: r.color,
          emissive: r.emissive,
          transparent: true,
          opacity: r.opacity,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = i * 0.8;
        ring.userData = {
          speedX: 0.06 + i * 0.03,
          speedY: 0.09 - i * 0.02,
          speedZ: 0.04 + i * 0.02,
          phaseOffset: i * 2.1,
        };
        coreGroup.add(ring);
        rings.push(ring);
        disposables.push(ringGeo, ringMat);
      });

      // 核心外围小粒子
      const haloCount = isSmall ? 160 : 400;
      const haloGeo = new THREE.BufferGeometry();
      const haloPos = new Float32Array(haloCount * 3);
      const haloCol = new Float32Array(haloCount * 3);
      for (let i = 0; i < haloCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 2.5 + Math.random() * 2.5;
        haloPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        haloPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        haloPos[i * 3 + 2] = r * Math.cos(phi);
        const c = new THREE.Color().setHSL(
          0.55 + Math.random() * 0.1,
          p.particle.sat,
          p.particle.light + Math.random() * p.particle.lightRange
        );
        haloCol[i * 3] = c.r;
        haloCol[i * 3 + 1] = c.g;
        haloCol[i * 3 + 2] = c.b;
      }
      haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
      haloGeo.setAttribute('color', new THREE.BufferAttribute(haloCol, 3));
      const haloMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        blending: p.particle.blending,
        depthWrite: false,
      });
      const halo = new THREE.Points(haloGeo, haloMat);
      coreGroup.add(halo);
      disposables.push(haloGeo, haloMat);

      coreGroup.position.y = -0.2;
      scene.add(coreGroup);

      // 防护网球体
      const shieldGroup = new THREE.Group();
      const shieldGeo = new THREE.SphereGeometry(4.2, 28, 20);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: p.shield.color,
        wireframe: true,
        transparent: true,
        opacity: p.shield.opacity,
      });
      shieldGroup.add(new THREE.Mesh(shieldGeo, shieldMat));
      disposables.push(shieldGeo, shieldMat);

      const shieldLines: THREE.Line[] = [];
      p.shieldLines.forEach((s, i) => {
        const radius = 3.8 + i * 0.3;
        const points: THREE.Vector3[] = [];
        const segments = 110;
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          const wave = Math.sin(angle * 8 + i) * 0.1;
          points.push(
            new THREE.Vector3(
              Math.cos(angle) * (radius + wave),
              Math.sin(angle) * (radius + wave) * 0.6,
              Math.sin(angle * 3) * 0.5
            )
          );
        }
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: s.color,
          transparent: true,
          opacity: s.opacity,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.rotation.x = 0.3 * i;
        line.rotation.y = 0.5 * i;
        line.userData = { speed: 0.04 + i * 0.015, phaseOffset: i * 1.5 };
        shieldGroup.add(line);
        shieldLines.push(line);
        disposables.push(lineGeo, lineMat);
      });
      scene.add(shieldGroup);

      // 可交互方形粒子
      const count = isSmall ? 1600 : 5000;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const data: Array<{
        baseX: number;
        baseY: number;
        baseZ: number;
        velocityX: number;
        velocityY: number;
        velocityZ: number;
      }> = [];

      for (let i = 0; i < count; i++) {
        const r = 5.5 + Math.random() * 14;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta) * 0.7;
        const z = r * Math.cos(phi);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        const c = new THREE.Color().setHSL(
          0.55 + Math.random() * 0.1,
          p.particle.sat,
          p.particle.light + Math.random() * p.particle.lightRange
        );
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
        sizes[i] = 0.1 + Math.random() * 0.25;
        data.push({ baseX: x, baseY: y, baseZ: z, velocityX: 0, velocityY: 0, velocityZ: 0 });
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // 方形粒子纹理
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillRect(4, 4, 24, 24);
      const squareTexture = new THREE.CanvasTexture(canvas);

      const pointMat = new THREE.ShaderMaterial({
        uniforms: { pointTexture: { value: squareTexture } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z) * 1.5;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D pointTexture;
          varying vec3 vColor;
          void main() {
            vec4 texColor = texture2D(pointTexture, gl_PointCoord);
            if (texColor.a < 0.1) discard;
            gl_FragColor = vec4(vColor, 1.0) * texColor;
          }
        `,
        transparent: true,
        blending: p.particle.blending,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, pointMat);
      scene.add(points);
      disposables.push(geo, pointMat, squareTexture);

      // 星点背景
      const starsGeo = new THREE.BufferGeometry();
      const starsCount = isSmall ? 300 : 600;
      const starsPos = new Float32Array(starsCount * 3);
      for (let i = 0; i < starsCount * 3; i++) {
        starsPos[i] = (Math.random() - 0.5) * 200;
      }
      starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
      const starsMat = new THREE.PointsMaterial({
        color: p.stars.color,
        size: 0.12,
        transparent: true,
        opacity: p.stars.opacity,
        blending: p.stars.blending,
        sizeAttenuation: true,
      });
      const stars = new THREE.Points(starsGeo, starsMat);
      scene.add(stars);
      disposables.push(starsGeo, starsMat);

      // 鼠标交互：轻轻扫过即触发连锁反应
      const pointer = new THREE.Vector2(0, 0);
      const hasPointer = { current: false };
      const raycaster = new THREE.Raycaster();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const hit = new THREE.Vector3();

      const applyInfluence = (center: THREE.Vector3) => {
        const pos = geo.attributes.position.array as Float32Array;
        const influenceRadius = isSmall ? 7.5 : 6.0;
        const baseForce = isSmall ? 0.4 : 0.32;
        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const dx = pos[ix] - center.x;
          const dy = pos[ix + 1] - center.y;
          const dz = pos[ix + 2] - center.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < influenceRadius && dist > 0.01) {
            const strength = (1 - dist / influenceRadius) * baseForce;
            const d = data[i];
            d.velocityX += (dx / dist) * strength * 0.8 + (Math.random() - 0.5) * strength * 0.3;
            d.velocityY += (dy / dist) * strength * 0.8 + (Math.random() - 0.5) * strength * 0.3;
            d.velocityZ += (dz / dist) * strength * 0.8 + (Math.random() - 0.5) * strength * 0.3;
            const maxVel = 0.8;
            if (Math.abs(d.velocityX) > maxVel) d.velocityX = Math.sign(d.velocityX) * maxVel;
            if (Math.abs(d.velocityY) > maxVel) d.velocityY = Math.sign(d.velocityY) * maxVel;
            if (Math.abs(d.velocityZ) > maxVel) d.velocityZ = Math.sign(d.velocityZ) * maxVel;
          }
        }
      };

      const onPointerMove = (clientX: number, clientY: number) => {
        const rect = host.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        hasPointer.current = true;
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(plane, hit)) applyInfluence(hit);
      };

      const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      };
      host.addEventListener('mousemove', handleMouseMove);
      host.addEventListener('touchmove', handleTouchMove, { passive: true });

      // 动画循环
      let raf = 0;
      let last = performance.now();
      let visible = true;
      let running = false;

      const draw = () => {
        if (composer) composer.render();
        else renderer.render(scene, camera);
      };

      const animate = () => {
        const now = performance.now();
        const delta = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = now * 0.001;

        coreGroup.rotation.y = t * 0.04;
        coreGroup.rotation.x = Math.sin(t * 0.1) * 0.06;
        halo.rotation.y = t * 0.03;
        halo.rotation.x = Math.sin(t * 0.08) * 0.05;

        rings.forEach((ring) => {
          const d = ring.userData;
          const sf = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.6 + d.phaseOffset));
          ring.rotation.x += d.speedX * sf * delta;
          ring.rotation.y += d.speedY * sf * delta;
          ring.rotation.z += d.speedZ * sf * delta;
        });

        const s = 1 + Math.sin(t * 3) * 0.03;
        innerCore.scale.set(s, s, s);
        const s2 = 1 + Math.sin(t * 2) * 0.06;
        innerSphere.scale.set(s2, s2, s2);

        shieldGroup.rotation.y = t * 0.03;
        shieldGroup.rotation.x = Math.sin(t * 0.08) * 0.12;
        shieldLines.forEach((line, idx) => {
          const d = line.userData;
          const sf = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.4 + d.phaseOffset));
          line.rotation.x += Math.sin(t * 0.3 + idx) * 0.0015 * sf;
          line.rotation.y += Math.cos(t * 0.2 + idx) * 0.002 * sf;
          line.rotation.z += 0.0008 * sf;
        });

        const pos = geo.attributes.position.array as Float32Array;
        const damping = 0.982;
        const returnForce = 0.008;
        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const d = data[i];
          pos[ix] += d.velocityX;
          pos[ix + 1] += d.velocityY;
          pos[ix + 2] += d.velocityZ;
          d.velocityX *= damping;
          d.velocityY *= damping;
          d.velocityZ *= damping;
          d.velocityX += (d.baseX - pos[ix]) * returnForce;
          d.velocityY += (d.baseY - pos[ix + 1]) * returnForce;
          d.velocityZ += (d.baseZ - pos[ix + 2]) * returnForce;
          const dx = pos[ix] - d.baseX;
          const dy = pos[ix + 1] - d.baseY;
          const dz = pos[ix + 2] - d.baseZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > 20) {
            pos[ix] = d.baseX + (dx / dist) * 20;
            pos[ix + 1] = d.baseY + (dy / dist) * 20;
            pos[ix + 2] = d.baseZ + (dz / dist) * 20;
            d.velocityX *= 0.5;
            d.velocityY *= 0.5;
            d.velocityZ *= 0.5;
          }
        }
        geo.attributes.position.needsUpdate = true;

        points.rotation.y = t * 0.015;
        points.rotation.x = Math.sin(t * 0.06) * 0.04;

        if (bloomPass) bloomPass.strength = 1.0 + Math.sin(t * 1.5) * 0.15;

        camera.position.x = Math.sin(t * 0.2) * 0.6;
        camera.position.y = 2 + Math.sin(t * 0.3) * 0.2;
        camera.lookAt(0, 0, 0);

        draw();
        raf = requestAnimationFrame(animate);
      };

      const play = () => {
        if (running || reduced || !visible) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(animate);
      };
      const pause = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      camera.lookAt(0, 0, 0);
      draw();

      const resize = () => {
        const w = host.clientWidth || window.innerWidth;
        const h = host.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        composer?.setSize(w, h);
        draw();
      };
      window.addEventListener('resize', resize);

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) play();
          else pause();
        },
        { threshold: 0.02 }
      );
      io.observe(host);

      const onVisibility = () => {
        if (document.hidden) pause();
        else play();
      };
      document.addEventListener('visibilitychange', onVisibility);

      if (!reduced) play();

      teardown = () => {
        pause();
        io.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', resize);
        host.removeEventListener('mousemove', handleMouseMove);
        host.removeEventListener('touchmove', handleTouchMove);
        disposables.forEach((d) => d.dispose());
        composer?.dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    };

    build(mode);

    // 主题切换时重建配色（切换频率低，重建成本可接受）
    const observer = new MutationObserver(() => {
      const next = readMode();
      if (next === mode) return;
      mode = next;
      teardown();
      build(mode);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });

    return () => {
      observer.disconnect();
      teardown();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden"
    />
  );
}
