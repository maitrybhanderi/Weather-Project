import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

const CURRENT_FIELDS =
  "temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,pressure_msl,surface_pressure,cloud_cover";

app.get("/", (req, res) => {
  res.render("index", { error: null });
});

app.post("/result", async (req, res) => {
  const place = req.body.place;

  try {
    const place_info = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1`,
    );
    const location_info = place_info.data;

    if (!location_info.results || location_info.results.length === 0) {
      return res.render("index", { error: "No such place exists." });
    }

    const loc_lat = location_info.results[0].latitude;
    const loc_long = location_info.results[0].longitude;
    const loc_name = location_info.results[0].name;
    const loc_country = location_info.results[0].country;

    const weather = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc_lat}&longitude=${loc_long}&current=${CURRENT_FIELDS}&timezone=auto`,
    );
    const loc_weather = weather.data;

    res.render("result", {
      place: loc_country ? `${loc_name}, ${loc_country}` : loc_name,
      time: loc_weather.current.time,
      temperature: loc_weather.current.temperature_2m,
      humidity: loc_weather.current.relative_humidity_2m,
      dew: loc_weather.current.dew_point_2m,
      app_temp: loc_weather.current.apparent_temperature,
      pressure: loc_weather.current.pressure_msl,
      surface_press: loc_weather.current.surface_pressure,
      cloud: loc_weather.current.cloud_cover,
    });
  } catch (err) {
    res.render("index", { error: "Request failed." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
