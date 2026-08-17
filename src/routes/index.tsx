import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weather Grid — Live City Conditions" },
      {
        name: "description",
        content:
          "Search any city and see live temperature, humidity, dew point, pressure and cloud cover in a clean weather grid.",
      },
      { property: "og:title", content: "Weather Grid — Live City Conditions" },
      {
        property: "og:description",
        content:
          "Search any city and see live temperature, humidity, dew point, pressure and cloud cover in a clean weather grid.",
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
        { label: "Observed", value: String(c.time).replace("T", " "), hint: "Local station time" },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background bg-aurora px-5 py-16 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Open-Meteo live data
          </p>
          <h1 className="mt-4 font-display text-5xl leading-tight tracking-tight sm:text-6xl">
            Weather<span className="text-primary">Grid</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Type a city and get its current atmospheric readout, laid out as a clean grid.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-border bg-card/70 p-3 shadow-glow backdrop-blur sm:flex-row"
        >
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter a city name, e.g. Rajkot"
            aria-label="City name"
            className="h-12 flex-1 rounded-xl border border-input bg-background/60 px-4 text-base outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-primary px-7 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Fetching…" : "Submit"}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-center text-sm font-medium text-destructive">{error}</p>
        )}

        {c && (
          <section className="mt-12">
            <h2 className="text-center font-display text-2xl tracking-tight">{result!.place}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((m) => (
                <article
                  key={m.label}
                  className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {m.label}
                  </p>
                  <p className="mt-3 font-display text-2xl tracking-tight text-foreground">
                    {m.value}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{m.hint}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {!c && !error && (
          <div className="mt-12 grid grid-cols-1 gap-4 opacity-40 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-dashed border-border" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
