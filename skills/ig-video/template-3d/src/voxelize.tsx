import {useLayoutEffect, useMemo, useRef} from 'react';
import {Color, InstancedMesh, Object3D} from 'three';

// Turn a smooth shape into small blocks: sample a signed-distance function on a
// grid and keep the cells on its surface. Fine detail, still clearly blocky.
// `sdf` is negative inside; `paint` picks a colour per surface block.

export type Sdf = (x: number, y: number, z: number) => number;

export const Voxelize: React.FC<{
  sdf: Sdf;
  min: [number, number, number];
  max: [number, number, number];
  step: number;
  paint: (x: number, y: number, z: number, shade: number) => string;
}> = ({sdf, min, max, step, paint}) => {
  const ref = useRef<InstancedMesh>(null);
  const cells = useMemo(() => {
    const out: [number, number, number, string][] = [];
    for (let x = min[0]; x <= max[0]; x += step)
      for (let y = min[1]; y <= max[1]; y += step)
        for (let z = min[2]; z <= max[2]; z += step) {
          if (sdf(x, y, z) > 0) continue;
          // Keep only blocks with an empty neighbour: the visible surface.
          let open = 0;
          for (const [dx, dy, dz] of [[step, 0, 0], [-step, 0, 0], [0, step, 0], [0, -step, 0], [0, 0, step], [0, 0, -step]])
            if (sdf(x + dx, y + dy, z + dz) > 0) open++;
          if (open === 0) continue;
          // Bake light into each block: the surface normal against a light from
          // the upper front left, plus darker creases where few sides are open.
          const e = step * 0.5;
          let nx = sdf(x + e, y, z) - sdf(x - e, y, z);
          let ny = sdf(x, y + e, z) - sdf(x, y - e, z);
          let nz = sdf(x, y, z + e) - sdf(x, y, z - e);
          const len = Math.hypot(nx, ny, nz) || 1;
          nx /= len;
          ny /= len;
          nz /= len;
          const light = Math.max(0, nx * -0.45 + ny * 0.6 + nz * 0.66);
          const ao = 0.62 + 0.38 * Math.min(1, open / 3);
          const col = new Color(paint(x, y, z, open)).multiplyScalar((0.42 + 0.75 * light) * ao);
          out.push([x, y, z, '#' + col.getHexString()]);
        }
    return out;
  }, [sdf, min, max, step, paint]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    cells.forEach(([x, y, z, col], i) => {
      o.position.set(x, y, z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(col));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cells.length]} castShadow receiveShadow>
      <boxGeometry args={[step * 1.02, step * 1.02, step * 1.02]} />
      <meshStandardMaterial flatShading roughness={0.95} />
    </instancedMesh>
  );
};

// Small helpers for building shapes out of distance functions.
export const ellipsoid = (x: number, y: number, z: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) => {
  const k = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2);
  return (k - 1) * Math.min(rx, ry, rz);
};

export const capsule = (x: number, y: number, z: number, a: [number, number, number], b: [number, number, number], r: number) => {
  const pa = [x - a[0], y - a[1], z - a[2]];
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2)));
  return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r;
};

// Smooth union, so parts melt into each other like carved stone.
export const blend = (a: number, b: number, k = 0.4) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
