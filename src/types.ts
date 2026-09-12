export type FloorId = "main" | "upper" | "outside";

export type Room = {
  id: string;
  name: string;
  floor: FloorId;
  still: string | null;
  notes: string[];
  links: string[];
  box: { x: number; z: number; w: number; d: number; h: number };
};

export type Beat = {
  id: string;
  title: string;
  bullets: string[];
  still: string;
  video: string | null;
};

export type Commute = {
  id: string;
  name: string;
  miles: number;
  minutes_typical: number;
  note: string;
};

export type Listing = {
  name: string;
  address: {
    street: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  lat: number;
  lng: number;
  price: string;
  status: string;
  mls: string;
  beds: number;
  baths: number;
  baths_full: number;
  baths_half: number;
  sqft: number;
  sqft_main: number;
  sqft_upper: number;
  lot_acres: number;
  lot_sqft: number;
  year_built: number;
  builder: string;
  style: string;
  community: string;
  subdivision: string;
  hoa_monthly: number;
  hoa_annual: number;
  hoa_name: string;
  hoa_required: boolean;
  roof: string;
  roof_replaced: string | null;
  story: string;
  description: string;
  interior: string[];
  appliances: string[];
  heating: string;
  cooling: string;
  parking: string;
  fireplace: string;
  schools_note: string;
  commute_note: string;
  commute: Commute[];
  agents: Array<{
    name: string;
    brokerage: string;
    phone: string;
    email: string;
  }>;
  cta: { label: string; phone: string; email: string };
  source_url: string;
  source_url_realtor: string;
  rooms: Room[];
  beats: Beat[];
  gallery: Array<{ src: string; alt: string }>;
  aerials: Array<{ src: string; alt: string; caption: string }>;
  walkthrough: string;
};

export type TwinMode = "dollhouse" | "floorplan" | "inside";
