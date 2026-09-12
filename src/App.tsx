import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import BuyerBot from "./BuyerBot";
import Film from "./Film";
import listingJson from "./listing.json";
import ShowingForm from "./ShowingForm";
import type { Listing } from "./types";
import Walkthrough from "./Walkthrough";

const Twin = lazy(() => import("./Twin"));
const Aerial = lazy(() => import("./Aerial"));

const listing = listingJson as Listing;

const PLACE = {
  "@context": "https://schema.org",
  "@type": "SingleFamilyResidence",
  name: listing.name,
  address: {
    "@type": "PostalAddress",
    streetAddress: listing.address.street,
    addressLocality: listing.address.city,
    addressRegion: listing.address.region,
    postalCode: listing.address.postal,
    addressCountry: listing.address.country,
  },
  numberOfRooms: String(listing.beds),
  floorSize: {
    "@type": "QuantitativeValue",
    value: listing.sqft,
    unitCode: "FTK",
  },
  yearBuilt: String(listing.year_built),
};

const HOOK = "Main-floor primary · Wellesley East";

export default function App() {
  const [sent, setSent] = useState(false);
  const [tour, setTour] = useState(false);
  const [roomId, setRoomId] = useState("great-room");
  const agent = listing.agents[0];
  const line = `${listing.address.street}, ${listing.address.city}, ${listing.address.region}`;

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(PLACE);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = tour ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [tour]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  function commuteBits(c: Listing["commute"][number]) {
    if (c.miles_listing != null) return `${c.miles_listing} mi listing`;
    if (c.minutes_route != null) return `~${c.minutes_route} min est.`;
    return "see note";
  }

  return (
    <>
      <header className="chrome">
        <p>
          <strong>{listing.price}</strong>
          <span>{HOOK}</span>
        </p>
        <button type="button" onClick={() => setTour(true)}>
          Schedule a tour
        </button>
      </header>

      {tour ? (
        <div className="tour-modal" role="dialog" aria-label="Schedule a tour" id="tour">
          <button type="button" className="tour-dismiss" onClick={() => setTour(false)}>
            Close
          </button>
          <p className="eyebrow">Private showings</p>
          <h2>Schedule a tour</h2>
          <p className="lede">
            {line} · {listing.price}
          </p>
          <ShowingForm cta={listing.cta.label} sent={sent} onSubmit={onSubmit} />
        </div>
      ) : null}

      <Film beats={listing.beats} address={line} price={listing.price} />
      <Walkthrough listing={listing} />
      <Suspense fallback={<section className="twin" id="twin"><p className="twin-caption">Loading the schematic twin…</p></section>}>
        <Twin listing={listing} roomId={roomId} onRoom={setRoomId} />
      </Suspense>
      <Suspense fallback={null}>
        <Aerial listing={listing} />
      </Suspense>

      <section className="close" id="contact">
        <p className="eyebrow">Private showings by appointment</p>
        <h1>137 Chertsey Drive</h1>
        <p className="lede">
          {line} · {listing.beds} bd · {listing.baths} ba · {listing.sqft.toLocaleString()} sq ft ·{" "}
          {listing.lot_acres} acres · MLS {listing.mls}
        </p>
        <p className="story">{listing.story}</p>
        <ul className="commute">
          {listing.commute.slice(0, 6).map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong>
              <span>{commuteBits(c)}</span>
            </li>
          ))}
        </ul>
        <p className="commute-note">{listing.commute_note}</p>
        <p className="agent">
          {agent.name}
          <span>{agent.brokerage}</span>
          {agent.email ? <a href={`mailto:${agent.email}`}>{agent.email}</a> : null}
        </p>
        <ShowingForm cta={listing.cta.label} sent={sent} onSubmit={onSubmit} />
      </section>

      <section className="gallery">
        <h2>The house in stills</h2>
        <p className="lede">
          Photography from the official listing. {listing.gallery.length} frames shown here.
        </p>
        <div className="grid">
          {listing.gallery.map((shot) => (
            <figure key={shot.src}>
              <img src={shot.src} alt={shot.alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      <BuyerBot listing={listing} onRoom={setRoomId} onTour={() => setTour(true)} />
    </>
  );
}
