import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import FloorPlan from "./FloorPlan";
import type { FloorId, Listing, Room, TwinMode } from "./types";

type Props = {
  listing: Listing;
  roomId: string;
  onRoom: (id: string) => void;
};

const WALL = 0xd9d0c3;
const WALL_ON = 0xf0e6d6;
const WOOD = 0x7a6854;
const GRASS = 0x3f4a36;
const THICK = 0.22;
const INNER = 0.12;
const EPS = 0.25;

type Edge = "n" | "s" | "w" | "e";

function roomCenter(r: Room) {
  return {
    x: r.box.x + r.box.w / 2,
    z: r.box.z + r.box.d / 2,
    y0: r.floor === "upper" ? 9.12 : r.floor === "outside" ? 0.04 : 0.06,
  };
}

function overlap(a0: number, a1: number, b0: number, b1: number) {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

function coveringNeighbor(r: Room, rooms: Room[], edge: Edge): Room | null {
  for (const o of rooms) {
    if (o.id === r.id || o.floor !== r.floor || o.floor === "outside") continue;
    const ovX = overlap(r.box.x, r.box.x + r.box.w, o.box.x, o.box.x + o.box.w);
    const ovZ = overlap(r.box.z, r.box.z + r.box.d, o.box.z, o.box.z + o.box.d);
    if (edge === "n" && Math.abs(r.box.z - (o.box.z + o.box.d)) < EPS && ovX > 1) return o;
    if (edge === "s" && Math.abs(r.box.z + r.box.d - o.box.z) < EPS && ovX > 1) return o;
    if (edge === "w" && Math.abs(r.box.x - (o.box.x + o.box.w)) < EPS && ovZ > 1) return o;
    if (edge === "e" && Math.abs(r.box.x + r.box.w - o.box.x) < EPS && ovZ > 1) return o;
  }
  return null;
}

function addWalls(
  group: THREE.Group,
  r: Room,
  rooms: Room[],
  y0: number,
  mats: THREE.Material[],
  pick: THREE.Object3D[],
  wallMats: Map<string, THREE.MeshStandardMaterial>,
) {
  const { x: cx, z: cz } = roomCenter(r);
  const { w, d, h } = r.box;
  let wallMat = wallMats.get(r.id);
  if (!wallMat) {
    wallMat = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.88 });
    wallMats.set(r.id, wallMat);
    mats.push(wallMat);
  }

  const specs: Array<[Edge, number, number, number, number, number, number]> = [
    ["n", w, h, THICK, cx, y0 + h / 2, cz - d / 2 + THICK / 2],
    ["s", w, h, THICK, cx, y0 + h / 2, cz + d / 2 - THICK / 2],
    ["w", THICK, h, d, cx - w / 2 + THICK / 2, y0 + h / 2, cz],
    ["e", THICK, h, d, cx + w / 2 - THICK / 2, y0 + h / 2, cz],
  ];

  for (const [edge, gw, gh, gd, px, py, pz] of specs) {
    const neighbor = coveringNeighbor(r, rooms, edge);
    if (neighbor && r.id > neighbor.id) continue;
    const thick = neighbor ? INNER : THICK;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(edge === "w" || edge === "e" ? thick : gw, gh, edge === "n" || edge === "s" ? thick : gd),
      wallMat,
    );
    mesh.position.set(px, py, pz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.roomId = r.id;
    group.add(mesh);
    pick.push(mesh);
  }
}

export default function Twin({ listing, roomId, onRoom }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onRoomRef = useRef(onRoom);
  onRoomRef.current = onRoom;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  const [mode, setMode] = useState<TwinMode>("dollhouse");
  const [floor, setFloor] = useState<FloorId>("main");
  const floorRef = useRef(floor);
  floorRef.current = floor;
  const room = listing.rooms.find((r) => r.id === roomId) ?? listing.rooms[0];

  useEffect(() => {
    const found = listing.rooms.find((r) => r.id === roomId);
    if (found && found.floor !== "outside") setFloor(found.floor);
  }, [roomId, listing.rooms]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mode !== "dollhouse") return;
    const root = host;
    root.style.position = "relative";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0b0a);
    scene.fog = new THREE.Fog(0x0c0b0a, 80, 160);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 400);
    camera.position.set(42, 32, -28);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.domElement.className = "twin-labels";
    labels.domElement.style.position = "absolute";
    labels.domElement.style.inset = "0";
    labels.domElement.style.pointerEvents = "none";
    root.appendChild(labels.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(22, 6, 28);
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minDistance = 18;
    controls.maxDistance = 90;

    scene.add(new THREE.HemisphereLight(0xf4efe6, 0x2a2a22, 0.85));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
    sun.position.set(30, 55, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 4;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);

    const mats: THREE.Material[] = [];
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1c1a16, roughness: 1 });
    mats.push(groundMat);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const lotMat = new THREE.MeshStandardMaterial({ color: 0x4d5c42, roughness: 0.95 });
    mats.push(lotMat);
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(56, 72), lotMat);
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(22, 0.02, 30);
    lot.receiveShadow = true;
    scene.add(lot);

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
    mats.push(shadowMat);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(28, 36), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(22, 0.05, 28);
    scene.add(shadow);

    const driveMat = new THREE.MeshStandardMaterial({ color: 0x3a3834, roughness: 1 });
    mats.push(driveMat);
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), driveMat);
    drive.rotation.x = -Math.PI / 2;
    drive.position.set(32, 0.04, -6);
    drive.receiveShadow = true;
    scene.add(drive);

    const pick: THREE.Object3D[] = [];
    const group = new THREE.Group();
    const labelNodes: HTMLButtonElement[] = [];
    const wallMats = new Map<string, THREE.MeshStandardMaterial>();

    for (const r of listing.rooms) {
      const { x: cx, z: cz, y0 } = roomCenter(r);
      const floorMat = new THREE.MeshStandardMaterial({
        color: r.floor === "outside" ? GRASS : WOOD,
        roughness: 0.9,
      });
      mats.push(floorMat);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(r.box.w, 0.18, r.box.d), floorMat);
      slab.position.set(cx, y0, cz);
      slab.receiveShadow = true;
      slab.castShadow = true;
      slab.userData.roomId = r.id;
      group.add(slab);
      pick.push(slab);

      if (r.floor !== "outside") {
        addWalls(group, r, listing.rooms, y0, mats, pick, wallMats);
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className = "twin-label";
      el.dataset.room = r.id;
      el.dataset.floor = r.floor;
      el.textContent = r.name;
      el.style.pointerEvents = "auto";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onRoomRef.current(r.id);
      });
      const tag = new CSS2DObject(el);
      const lift = r.floor === "outside" ? 1.2 : r.box.h + 0.45;
      tag.position.set(cx, y0 + lift, cz + (r.id === "yard" ? 8 : 0));
      group.add(tag);
      labelNodes.push(el);
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
      labels.setSize(w, h);
    }
    fit();

    function onClick(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(pick, false)[0];
      const id = hit?.object.userData.roomId as string | undefined;
      if (id) onRoomRef.current(id);
    }
    renderer.domElement.addEventListener("pointerdown", onClick);

    const ro = new ResizeObserver(fit);
    ro.observe(root);

    let raf = 0;
    const tick = () => {
      controls.update();
      const selected = roomIdRef.current;
      const fl = floorRef.current;
      for (const el of labelNodes) {
        const roomFloor = el.dataset.floor;
        const show = fl === "upper" ? roomFloor === "upper" : roomFloor !== "upper";
        el.hidden = !show;
        el.classList.toggle("on", el.dataset.room === selected);
      }
      for (const [id, mat] of wallMats) {
        mat.color.set(id === selected ? WALL_ON : WALL);
      }
      renderer.render(scene, camera);
      labels.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onClick);
      controls.dispose();
      renderer.dispose();
      for (const m of mats) m.dispose();
      labels.domElement.remove();
      renderer.domElement.remove();
    };
  }, [listing.rooms, mode]);

  const links = (room?.links ?? [])
    .map((id) => listing.rooms.find((r) => r.id === id))
    .filter((r) => r && r.still);

  return (
    <section className="twin" id="twin">
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
        {room?.name}. {room?.notes.join(" · ")} Drag to orbit. Tap a label on the model to step inside.
      </p>
    </section>
  );
}
