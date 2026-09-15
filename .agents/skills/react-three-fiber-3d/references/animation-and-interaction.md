# R3F Animation & Interaction Patterns

## useFrame for per-frame animation
```tsx
function SpinningModel() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.3; // frame-rate independent via delta
  });
  return <mesh ref={ref}><Model /></mesh>;
}
```
Always multiply by `delta` — never assume a fixed 60fps.

## Combining GSAP with R3F
Use GSAP to animate a ref's Three.js object properties (position, rotation, material.opacity) — it composes cleanly with useFrame-driven scenes:
```tsx
useEffect(() => {
  gsap.to(meshRef.current.position, { y: 1.2, duration: 1.2, ease: 'power3.out' });
}, []);
```
Don't run GSAP's own RAF loop AND a competing useFrame animation on the same property — pick one driver per property to avoid fighting updates.

## Scroll-linked 3D (product storytelling scenes)
- Use `@react-three/drei`'s `ScrollControls`/`Scroll` for camera moves tied to page scroll, or drive a GSAP ScrollTrigger that updates a shared React ref/store the Canvas reads via useFrame.
- Keep scroll-driven state in a ref (not React state) to avoid re-render thrash — read it inside `useFrame`.

## Pointer interaction
```tsx
<mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={handleClick}>
```
R3F raycasts automatically for `onPointer*`/`onClick` on meshes — no manual raycaster setup needed for basic interaction. For custom raycasting (e.g. drag-to-rotate), use `useThree(({ raycaster, camera }) => ...)`.

## HTML overlays inside the 3D scene
Use drei's `<Html>` for tooltips/labels anchored to 3D positions — set `transform` for it to scale/occlude correctly with the 3D content, and `distanceFactor` to scale with camera distance.
