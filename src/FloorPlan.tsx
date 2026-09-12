import type { FloorId, Listing } from "./types";

type Props = {
  listing: Listing;
  floor: FloorId;
  selected: string;
  onSelect: (id: string) => void;
};

export default function FloorPlan({ listing, floor, selected, onSelect }: Props) {
  const rooms = listing.rooms.filter((r) => (floor === "upper" ? r.floor === "upper" : r.floor !== "upper"));
  const maxX = Math.max(...rooms.map((r) => r.box.x + r.box.w), 1) + 4;
  const maxZ = Math.max(...rooms.map((r) => r.box.z + r.box.d), 1) + 4;

  return (
    <svg className="floorplan" viewBox={`0 0 ${maxX} ${maxZ}`} role="img" aria-label={`${floor} floor plan`}>
      <rect width={maxX} height={maxZ} fill="#161412" />
      {rooms.map((r) => {
        const on = r.id === selected;
        return (
          <g
            key={r.id}
            className={on ? "fp-room on" : "fp-room"}
            onClick={() => onSelect(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(r.id);
            }}
          >
            <rect
              x={r.box.x}
              y={r.box.z}
              width={r.box.w}
              height={r.box.d}
              fill={on ? "rgba(244,239,230,0.22)" : "rgba(244,239,230,0.06)"}
              stroke="rgba(244,239,230,0.45)"
              strokeWidth={0.35}
            />
            <text
              x={r.box.x + r.box.w / 2}
              y={r.box.z + r.box.d / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#f4efe6"
              fontSize={2.2}
            >
              {r.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
