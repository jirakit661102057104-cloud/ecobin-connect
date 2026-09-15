---
name: react-three-fiber-3d
description: Build performant 3D web experiences with React Three Fiber (R3F), drei, and Three.js — scenes, models, materials, lighting, camera controls, and post-processing, integrated cleanly into a Next.js/React app. Use whenever the user mentions "3D", "Three.js", "React Three Fiber", "R3F", "WebGL", 3D product viewers, 3D hero sections, GLTF/GLB models, or wants an immersive/interactive 3D web experience. Always check performance implications (draw calls, bundle size, mobile fallback) as part of this skill.
---

# React Three Fiber (R3F) 3D Experience Skill

Guides building production 3D web experiences that are performant, SSR-safe (Next.js), and don't tank Core Web Vitals or mobile framerate.

## Setup essentials
```bash
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
```
R3F components are client-only — the Canvas and everything inside it must live in a `"use client"` boundary. In Next.js, dynamically import the whole 3D scene with `ssr: false` to avoid hydration mismatches:
```tsx
const Scene = dynamic(() => import('@/components/three/Scene'), { ssr: false });
```

## Baseline scene structure
```tsx
<Canvas camera={{ position: [0, 1.5, 5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
  <Suspense fallback={<Loader />}>
    <Environment preset="city" />
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
    <Model url="/models/product.glb" />
    <OrbitControls enableZoom={false} enablePan={false} />
  </Suspense>
</Canvas>
```
- `dpr={[1, 2]}` caps device pixel ratio — never let it run uncapped on high-DPI mobile screens (kills framerate).
- Wrap async assets (`useGLTF`, `useTexture`) in `<Suspense>` with a real loading UI, not a blank canvas.

## Loading models
- Compress with `gltf-transform`/Draco before shipping (`useGLTF.preload`, use `-draco` variants).
- Load via `useGLTF(url)` (drei) — never `useLoader(GLTFLoader, url)` directly unless you need custom loader config.
- Preload critical models: `useGLTF.preload('/models/product.glb')` outside the component.

## Performance rules (check every time)
1. **Instance repeated geometry** (`<Instances>`/`InstancedMesh`) instead of mapping many `<mesh>` — one draw call vs. hundreds.
2. **Dispose properly**: R3F auto-disposes on unmount for most cases, but custom geometries/materials created imperatively need manual `.dispose()`.
3. **Limit real-time shadows**: prefer baked lighting or a single shadow-casting light; `castShadow` on many lights is expensive.
4. **Frameloop**: use `frameloop="demand"` on the Canvas for static/product-viewer scenes that only need to re-render on interaction, not `always` (60fps loop) when nothing is animating.
5. **Mobile fallback**: for low-end devices, detect via a capability check (WebGL2 support, `navigator.hardwareConcurrency`) and serve a static image/video poster instead of the full 3D scene — never assume every visitor can run a heavy scene smoothly.
6. **Bundle size**: three.js is large — dynamically import the 3D module so it doesn't block the initial page load/LCP for content that isn't 3D.

## Reference files (load when relevant)
- `references/animation-and-interaction.md` — useFrame patterns, GSAP/R3F integration, scroll-linked 3D, drei helpers (Html, Text3D, Scroll)
- `references/postprocessing-and-materials.md` — @react-three/postprocessing effects, custom shaders/materials, physically-based lighting recipes

## Anti-patterns to flag
- Rendering `<Canvas>` without SSR guard in a Next.js Server Component tree
- Uncompressed multi-MB GLTF models shipped directly
- `frameloop="always"` on a scene with no continuous animation
- No loading state / fallback while the model streams in
- No reduced-motion / low-power fallback

## Example prompt this skill should trigger on
> "Add an interactive 3D product viewer to the hero section of our Next.js landing page."
