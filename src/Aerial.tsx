import type { Listing } from "./types";

type Props = { listing: Listing };

export default function Aerial({ listing }: Props) {
  return (
    <section className="aerial">
      <p className="eyebrow">Lot and surroundings</p>
      <h2>From above</h2>
      <p className="lede">
        {listing.lot_acres} acre ({listing.lot_sqft.toLocaleString()} sq ft) at {listing.address.street}. These are
        satellite frames of this geocode, not a listing drone flight. Imagery © Esri, Maxar.
      </p>
      <div className="aerial-grid">
        {listing.aerials.map((shot) => (
          <figure key={shot.src}>
            <img src={shot.src} alt={shot.alt} loading="lazy" />
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
