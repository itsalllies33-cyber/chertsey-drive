import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import FloorPlan from "./FloorPlan";
import type { FloorId, Listing, TwinMode } from "./types";

type Props = {
  listing: Listing;
  roomId: string;
  onRoom: (id: string) => void;
};

export default function Twin({ listing, roomId, onRoom }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onRoomRef = useRef(onRoom);
  onRoomRef.current = onRoom;
  const [mode, setMode] = useState<TwinMode>("dollhouse");
  const [floor, setFloor] = useState<FloorId>("main");
  const room = listing.rooms.find((r) => r.id === roomId) ?? listing.rooms[0];

  useEffect(() => {
    const found = listing.rooms.find((r) => r.id === roomId);
    if (found && found.floor !== "outside") setFloor(found.floor);
  }, [roomId, listing.rooms]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mode !== "dollhouse") return;
    const root = host;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0b0a);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    camera.position.set(42, 48, -28);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(28, 4, 32);
    controls.maxPolarAngle = Math.PI / 2.05;

    scene.add(new THREE.HemisphereLight(0xf4efe6, 0x2a241c, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.position.set(40, 60, 10);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const loader = new THREE.TextureLoader();
    const meshes: THREE.Mesh[] = [];
    const group = new THREE.Group();

    for (const r of listing.rooms) {
      const y = r.floor === "upper" ? 9 + r.box.h / 2 : r.box.h / 2;
      const geo = new THREE.BoxGeometry(r.box.w, r.box.h, r.box.d);
      const mat = new THREE.MeshStandardMaterial({
        color: r.id === roomId ? 0xc4b79a : 0x8a8174,
        roughness: 0.72,
        transparent: r.floor === "upper",
        opacity: r.floor === "upper" ? 0.82 : 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(r.box.x + r.box.w / 2, y, r.box.z + r.box.d / 2);
      mesh.userData.roomId = r.id;
      if (r.still) {
        loader.load(r.still, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.color.set(0xffffff);
          mat.needsUpdate = true;
        });
      }
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0xf4efe6, transparent: true, opacity: 0.35 }),
      );
      mesh.add(edges);
      group.add(mesh);
      meshes.push(mesh);
    }
    scene.add(group);

    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function fit() {
      const w = root.clientWidth || 1;
      const h = root.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    fit();

    function onClick(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      const id = hit?.object.userData.roomId as string | undefined;
      if (id) onRoomRef.current(id);
    }
    renderer.domElement.addEventListener("pointerdown", onClick);

    const ro = new ResizeObserver(fit);
    ro.observe(root);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onClick);
      controls.dispose();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, [listing.rooms, mode]);

  const links = (room?.links ?? [])
    .map((id) => listing.rooms.find((r) => r.id === id))
    .filter((r) => r && r.still);

  return (
    <section className="twin">
      <div className="twin-bar">
        <p className="twin-kicker">
          Schematic digital twin
          <span>Not a Matterport scan — rooms from listing photos and published floor facts</span>
        </p>
        <div className="twin-modes" role="tablist">
          {(["dollhouse", "floorplan", "inside"] as TwinMode[]).map((m) => (
            <button key={m} type="button" className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
              {m === "dollhouse" ? "Dollhouse" : m === "floorplan" ? "Floor plan" : "Inside"}
            </button>
          ))}
        </div>
        <div className="twin-floors">
          <button type="button" className={floor === "main" ? "on" : ""} onClick={() => setFloor("main")}>
            Main · {listing.sqft_main.toLocaleString()} sq ft
          </button>
          <button type="button" className={floor === "upper" ? "on" : ""} onClick={() => setFloor("upper")}>
            Upper · {listing.sqft_upper} sq ft
          </button>
        </div>
      </div>

      {mode === "dollhouse" ? <div className="twin-stage" ref={hostRef} /> : null}

      {mode === "floorplan" ? (
        <div className="twin-stage twin-plan">
          <FloorPlan listing={listing} floor={floor} selected={roomId} onSelect={onRoom} />
        </div>
      ) : null}

      {mode === "inside" ? (
        <div className="twin-stage twin-inside">
          {room?.still ? (
            <img src={room.still} alt={room.name} />
          ) : (
            <p className="twin-empty">No interior still for {room?.name ?? "this room"} in the listing set.</p>
          )}
          <div className="twin-hotspots">
            {links.map((r) =>
              r ? (
                <button key={r.id} type="button" onClick={() => onRoom(r.id)}>
                  {r.name}
                </button>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

      <div className="twin-rooms">
        {listing.rooms
          .filter((r) => (floor === "upper" ? r.floor === "upper" : r.floor !== "upper"))
          .map((r) => (
            <button key={r.id} type="button" className={r.id === roomId ? "on" : ""} onClick={() => onRoom(r.id)}>
              {r.name}
            </button>
          ))}
      </div>
      <p className="twin-caption">
        {room?.name}. {room?.notes.join(" · ")} Drag to orbit in dollhouse. Click a room to step inside.
      </p>
    </section>
  );
}
