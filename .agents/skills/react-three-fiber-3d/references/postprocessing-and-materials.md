# R3F Post-Processing & Materials

## Post-processing effects
```bash
npm i @react-three/postprocessing postprocessing
```
```tsx
<EffectComposer>
  <Bloom intensity={0.6} luminanceThreshold={0.8} />
  <Vignette eskil={false} offset={0.1} darkness={0.9} />
</EffectComposer>
```
Post-processing is expensive — stack the minimum effects needed, and disable/reduce (e.g. skip Bloom) on detected low-power devices.

## Physically-based materials
Prefer `meshStandardMaterial`/`meshPhysicalMaterial` (PBR) over `meshBasicMaterial` for anything meant to look realistic under lighting. Key props:
- `roughness` / `metalness` — define surface response to light
- `envMapIntensity` — how strongly the environment map reflects
- `meshPhysicalMaterial` adds `clearcoat`, `transmission` (glass/translucency), `iridescence`

## Environment & lighting
Use drei's `<Environment preset="..." />` (or a custom HDRI) for realistic reflections instead of manually placing many lights. Combine with one directional "key" light for defined shadows plus low ambient/hemisphere fill — avoid more than 2-3 real-time lights for performance.

## Custom shaders (when drei/standard materials aren't enough)
```tsx
const material = useMemo(() => new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#5865f2') } },
  vertexShader, fragmentShader,
}), []);
useFrame((state) => { material.uniforms.uTime.value = state.clock.elapsedTime; });
```
Keep custom shaders behind a capability check — some low-end/older mobile GPUs don't handle complex fragment shaders well; provide a simpler material fallback.
