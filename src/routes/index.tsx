import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pastel Weather — Current Conditions by City" },
      {
        name: "description",
        content:
          "Search any city for a calm, pastel readout of temperature, humidity, dew point, pressure and cloud cover.",
      },
      { property: "og:title", content: "Pastel Weather — Current Conditions by City" },
      {
        property: "og:description",
        content:
          "Search any city for a calm, pastel readout of temperature, humidity, dew point, pressure and cloud cover.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Current = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  dew_point_2m: number;
  apparent_temperature: number;
  pressure_msl: number;
  surface_pressure: number;
  cloud_cover: number;
};

type Result = { place: string; current: Current };

const CURRENT_FIELDS =
  "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,pressure_msl,surface_pressure,cloud_cover";

function Index() {
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = place.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`,
      );
      const geo = await geoRes.json();
      if (!geo.results || geo.results.length === 0) {
        setResult(null);
        setError("No such place exists.");
        return;
      }
      const { latitude, longitude, name, country } = geo.results[0];
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${CURRENT_FIELDS}&timezone=auto`,
      );
      const weather = await wRes.json();
      setResult({
        place: country ? `${name}, ${country}` : name,
        current: weather.current,
      });
    } catch {
      setResult(null);
      setError("Request failed.");
    } finally {
      setLoading(false);
    }
  }

  const c = result?.current;

  const metrics = c
    ? [
        { label: "Temperature", value: `${c.temperature_2m}°C`, hint: "Air temperature at 2 m" },
        { label: "Feels like", value: `${c.apparent_temperature}°C`, hint: "Apparent temperature" },
        { label: "Humidity", value: `${c.relative_humidity_2m}%`, hint: "Relative humidity" },
        { label: "Dew point", value: `${c.dew_point_2m}°C`, hint: "Condensation threshold" },
        { label: "Pressure", value: `${c.pressure_msl} hPa`, hint: "Mean sea level" },
        { label: "Surface pressure", value: `${c.surface_pressure} hPa`, hint: "At station level" },
        { label: "Cloud cover", value: `${c.cloud_cover}%`, hint: "Total sky coverage" },
      ]
    : [];

  return (
    <main className="wx-page">
      <div className="wx-shell">
        <header className="wx-header">
          <p className="wx-eyebrow">Open-Meteo live data</p>
          <h1 className="wx-title">
            A gentle look at <em>today&rsquo;s sky</em>
          </h1>
          <p className="wx-lede">
            Type a city name and see its current conditions laid out in a calm, readable grid.
          </p>
        </header>

        <form className="wx-form" onSubmit={onSubmit}>
          <input
            className="wx-input"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter a city name, e.g. Rajkot"
            aria-label="City name"
          />
          <button className="wx-button" type="submit" disabled={loading}>
            {loading ? "Fetching…" : "Submit"}
          </button>
        </form>

        {error && <p className="wx-error">{error}</p>}

        {c && (
          <section>
            <h2 className="wx-place">{result!.place}</h2>
            <p className="wx-place-sub">
              Observed at {String(c.time).replace("T", " ")} (local time)
            </p>
            <div className="wx-grid">
              {metrics.map((m) => (
                <article className="wx-card" key={m.label}>
                  <p className="wx-card-label">
                    <span className="wx-dot" aria-hidden="true" />
                    {m.label}
                  </p>
                  <p className="wx-card-value">{m.value}</p>
                  <p className="wx-card-hint">{m.hint}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {!c && !error && (
          <div className="wx-empty" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="wx-ghost" key={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
