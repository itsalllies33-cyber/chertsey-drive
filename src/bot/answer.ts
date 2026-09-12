import listing from "../listing.json";
import type { Listing } from "../types";

const data = listing as Listing;

function norm(q: string) {
  return q.toLowerCase().replace(/[’']/g, "'").trim();
}

export function answer(question: string): { text: string; roomId?: string } {
  const q = norm(question);
  const agent = data.agents[0];

  if (!q) {
    return { text: "Ask about price, HOA, the roof, commute, rooms, or a showing." };
  }

  if (/(hoa|h\.o\.a|dues|association fee)/.test(q)) {
    return {
      text: `HOA is $${data.hoa_monthly} per month ($${data.hoa_annual} a year), mandatory, paid to ${data.hoa_name}. The listing does not itemize what the dues cover.`,
    };
  }

  if (/(roof|shingle|resurface|redone|replaced|reroof)/.test(q)) {
    if (!data.roof_replaced) {
      return {
        text: `The listing does not say when the roof was last replaced. It lists a ${data.roof.toLowerCase()} roof on a home built in ${data.year_built}. Ask ${agent.name} for permits or a roof inspection.`,
      };
    }
    return { text: `Roof last replaced: ${data.roof_replaced}. Type on the listing: ${data.roof}.` };
  }

  if (/(commute|drive time|how far|minutes to|traffic|i-?77)/.test(q) || /(charlotte|uptown|airport|clt|lowe|birkdale|lake norman|southpark|university|downtown)/.test(q)) {
    const hit = data.commute.find((c) => q.includes(c.id) || q.includes(c.name.toLowerCase()) || (c.id === "airport" && /airport|clt/.test(q)) || (c.id === "lowes" && /lowe/.test(q)) || (c.id === "uptown" && /uptown|charlotte/.test(q)));
    const row = hit ?? data.commute.find((c) => c.id === "uptown");
    const list = data.commute
      .slice(0, 6)
      .map((c) => `${c.name}: ~${c.minutes_typical} min (${c.miles} mi)`)
      .join("; ");
    if (hit) {
      return {
        text: `${hit.name} is about ${hit.minutes_typical} minutes typical (${hit.miles} miles). ${hit.note} ${data.commute_note}`,
      };
    }
    return {
      text: `Typical drives from this address: ${list}. ${row ? `Uptown Charlotte is ~${row.minutes_typical} min typical.` : ""} ${data.commute_note}`,
    };
  }

  if (/(price|cost|how much|asking|list price)/.test(q)) {
    return { text: `Listed at ${data.price}, MLS ${data.mls}, currently ${data.status.toLowerCase()}.` };
  }

  if (/(bed|bath|sq ?ft|square|lot|acre|size|layout|how many)/.test(q)) {
    return {
      text: `${data.beds} bedrooms, ${data.baths_full} full baths, ${data.sqft.toLocaleString()} sq ft (${data.sqft_main.toLocaleString()} main / ${data.sqft_upper} upper) on ${data.lot_acres} acre (${data.lot_sqft.toLocaleString()} sq ft). Two bedrooms and two full baths on the main floor; one bedroom, one full bath, and the loft upstairs.`,
      roomId: "great-room",
    };
  }

  if (/(year|built|age|when was|builder|lennar)/.test(q)) {
    return { text: `Built in ${data.year_built} by ${data.builder}. Site-built, slab, no basement.` };
  }

  if (/(kitchen|island|granite|stainless|pantry)/.test(q)) {
    return {
      text: `Gourmet kitchen on the listing: oversized island, stainless appliances, granite, pantry, and a breakfast area. Appliances listed: ${data.appliances.join(", ").toLowerCase()}.`,
      roomId: "kitchen",
    };
  }

  if (/(primary|master|main.?floor bedroom)/.test(q)) {
    return {
      text: `Primary suite is on the main floor with a walk-in closet and a spacious bath. A private guest suite is also on this floor.`,
      roomId: "primary",
    };
  }

  if (/(guest|in-law|multi-?gen)/.test(q)) {
    return {
      text: `The listing calls out a private guest suite on the main floor for visitors or multi-generational living. We do not have a separate still of that room in this set.`,
      roomId: "guest",
    };
  }

  if (/(loft|bonus|upstairs|media|gym|office)/.test(q)) {
    return {
      text: `Upstairs: one bedroom, a full bath, and a huge loft/bonus the listing leaves open as media room, play area, office, or gym.`,
      roomId: "loft",
    };
  }

  if (/(porch|yard|fence|outdoor|patio)/.test(q)) {
    return {
      text: `Covered front porch, screened back porch, patio, and a fenced backyard on ${data.lot_acres} acre.`,
      roomId: "screened",
    };
  }

  if (/(garage|parking|cars)/.test(q)) {
    return { text: data.parking, roomId: "garage" };
  }

  if (/(fireplace|fire place)/.test(q)) {
    return { text: `${data.fireplace}. Visible in the great-room listing photo.`, roomId: "great-room" };
  }

  if (/(school|district|elementary|high school)/.test(q)) {
    return { text: data.schools_note };
  }

  if (/(tax|assess)/.test(q)) {
    return {
      text: `Compass public records showed a 2025 tax record of $5,360 and an assessed value of $447,550. Confirm with Iredell County — those are not MLS marketing fields.`,
    };
  }

  if (/(appliance|washer|dryer|range|hvac|heat|cool|air)/.test(q)) {
    return {
      text: `Heat: ${data.heating}. Cool: ${data.cooling}. Appliances: ${data.appliances.join(", ").toLowerCase()}. The listing does not date the HVAC.`,
    };
  }

  if (/(3d|matterport|dollhouse|tour|twin)/.test(q)) {
    return {
      text: `This page has a schematic dollhouse and floor plan from listing photos and published room facts — not a Matterport camera scan of this address. No Matterport showcase ID was published on the MLS syndication we used.`,
    };
  }

  if (/(showing|visit|tour|see the house|agent|contact|email)/.test(q)) {
    return {
      text: `Showings by appointment. ${agent.name}, ${agent.brokerage}${agent.email ? `, ${agent.email}` : ""}. Use the request form on this page.`,
    };
  }

  if (/(wellesley|neighborhood|community)/.test(q)) {
    return {
      text: `${data.community} in Mooresville. Listing copy: close to shopping, dining, and Mooresville schools. HOA ${data.hoa_name}, $${data.hoa_monthly}/mo.`,
    };
  }

  return {
    text: `I only answer from this listing. I have price, HOA, roof type (no replacement date), commute estimates, rooms, and ${agent.name}'s email. Try “what's the HOA fee” or “how far is Uptown.”`,
  };
}
