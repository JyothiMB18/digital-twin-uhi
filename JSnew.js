//import * as Cesium from "https://cesium.com/downloads/cesiumjs/releases/1.133/Build/Cesium/Cesium.js";

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZmY4YzlhZS1kZDhjLTRmOWEtOTk3NS0zNDI1NjA3ZmNkNjciLCJpZCI6MzQzMTU0LCJpYXQiOjE3NTgzOTEyNDJ9.xz2T_vo6eAnPf3C5ln3ZjecNTwlU21EYt6nOqFyJZlY";


let viewer, osm;
let index = 0;
let playing = true;
let fadeTimer;

const default3DView = {
  destination: Cesium.Cartesian3.fromDegrees(77.59384, 12.98346, 1100), 
  orientation: { pitch: Cesium.Math.toRadians(-30) }
};
const layers = [
  { id:"toggleLayer5", year: 2004, min:22.9, max:44.8, asset:3870041 },
  { id:"toggleLayer4", year: 2009, min:22.5, max:40.3, asset:3870042 },
  { id:"toggleLayer3", year: 2014, min:21.4, max:39.6, asset:3870044 },
  { id:"toggleLayer2", year: 2019, min:25.3, max:49.7, asset:3870046 },
  { id:"toggleLayer1", year: 2024, min:21.9, max:38.3, asset:3870048 }
];

const predictedLayers = [
  { id: "togglePred1", min: 25.9, max: 46.6, year: 2029 }, // 2029
  { id: "togglePred2", min: 26.9, max: 48.7, year: 2034 }  // 2034
];

const lstWeatherDates = [
  { year: 2004, date: "20040303" },
  { year: 2009, date: "20090213" },
  { year: 2014, date: "20140211" },
  { year: 2019, date: "20190225" },
  { year: 2024, date: "20240215" }
];

//weather
const lat = 12.99;
const lon = 77.59;

let charts = {};

let timeLabels = [];
let tempData = [];
let humData = [];
let windData = [];

async function fetchWeatherForDate(dateStr){

  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,WS2M&community=RE&longitude=${lon}&latitude=${lat}&start=${dateStr}&end=${dateStr}&format=JSON`;

  const res = await fetch(url);
  const data = await res.json();

  const tempObj = data.properties.parameter.T2M;
  const humObj  = data.properties.parameter.RH2M;
  const windObj = data.properties.parameter.WS2M;

  timeLabels = Object.keys(tempObj).map(d => d.slice(8,10) + ":00");

  tempData = Object.values(tempObj).map(v => v === -999 ? null : v);
  humData  = Object.values(humObj).map(v => v === -999 ? null : v);
  windData = Object.values(windObj).map(v => v === -999 ? null : v);

  updateCharts();
}

async function fetchRecentWeather(){

  try {

    const today = new Date();

    const start = new Date();
    start.setDate(today.getDate() - 5);

    const end = new Date();
    end.setDate(today.getDate() + 5);

    const format = d =>
      d.getFullYear() + "-" +
      String(d.getMonth()+1).padStart(2,'0') + "-" +
      String(d.getDate()).padStart(2,'0');

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,relative_humidity_2m_mean,windspeed_10m_max&start_date=${format(start)}&end_date=${format(end)}&timezone=auto`;

    const res = await fetch(url);
    const data = await res.json();

    const labels = data.daily.time.map(d => d.slice(5)); // MM-DD

    const temp = data.daily.temperature_2m_max;
    const hum  = data.daily.relative_humidity_2m_mean;
    const wind = data.daily.windspeed_10m_max;

    // 🔥 CREATE ALL 3 CHARTS
    createChartRealtime("tempChartRealtime","Temp (°C)", temp, labels);
    createChartRealtime("humidityChartRealtime","Humidity (%)", hum, labels);
    createChartRealtime("windChartRealtime","Wind (m/s)", wind, labels);

  } catch (e) {
    console.error("Realtime weather error:", e);
  }
}

function createChartRealtime(id, label, dataArray, labels) {

  const ctx = document.getElementById(id).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: labels, // ✅ correct labels
      datasets: [{
        label: label,
        data: dataArray,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderColor: "#4fc3f7",
        backgroundColor: "rgba(79,195,247,0.2)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#ffffff" } }
      },
      scales: {
        x: {
          ticks: { color: "#cccccc" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          ticks: { color: "#cccccc" },
          grid: { color: "rgba(255,255,255,0.05)" }
        }
      }
    }
  });
}


const today = new Date();
document.getElementById("todayDate").innerText =
  today.toDateString();

const currentYearData = lstWeatherDates[index];
fetchWeatherForDate(currentYearData.date);

// Update date label
document.getElementById("weatherDate").innerText =
  `Date: ${currentYearData.date.slice(6,8)}-${currentYearData.date.slice(4,6)}-${currentYearData.date.slice(0,4)}`;

function createChart(id, label, dataArray) {

  const ctx = document.getElementById(id).getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [{
        label: label,
        data: dataArray,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        borderColor: "#4fc3f7",
        backgroundColor: "rgba(79,195,247,0.2)"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          labels: {
            color: "#ffffff"
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#cccccc",
            maxTicksLimit: 6   // 🔥 avoids clutter
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        },
        y: {
          ticks: {
            color: "#cccccc"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });
}


function updateCharts(){

  if (!charts.temp) {
    charts.temp = createChart("tempChart","Temperature (°C)", tempData);
    charts.hum  = createChart("humidityChart","Humidity (%)", humData);
    charts.wind = createChart("windChart","Wind (m/s)", windData);
    return;
  }

  // 🔥 UPDATE EXISTING CHARTS
  charts.temp.data.labels = timeLabels;
  charts.hum.data.labels = timeLabels;
  charts.wind.data.labels = timeLabels;

  charts.temp.data.datasets[0].data = tempData;
  charts.hum.data.datasets[0].data = humData;
  charts.wind.data.datasets[0].data = windData;

  charts.temp.update();
  charts.hum.update();
  charts.wind.update();
}

// =======================
// 🚀 WEATHER INIT (SAFE)
// =======================

window.addEventListener("load", () => {

  // 📅 Set today's date
  const today = new Date();
  const todayEl = document.getElementById("todayDate");
  if (todayEl) {
    todayEl.innerText = today.toDateString();
  }

  // 🔢 Default to latest year (2024)
  let index = 4;

  const currentYearData = lstWeatherDates[index];

  // 📊 Load historical weather
  if (currentYearData) {
    fetchWeatherForDate(currentYearData.date);

    const weatherDateEl = document.getElementById("weatherDate");
    if (weatherDateEl) {
      weatherDateEl.innerText =
        `Date: ${currentYearData.date.slice(6,8)}-${currentYearData.date.slice(4,6)}-${currentYearData.date.slice(0,4)}`;
    }
  }

  // 🌤 Load realtime weather
  fetchRecentWeather();

});

const weatherHeader = document.getElementById("weatherHeader");
const weatherContent = document.getElementById("weatherContent");

weatherHeader.onclick = () => {
  weatherContent.style.display =
    weatherContent.style.display === "none" ? "block" : "none";
};

async function init(){

viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    shadows: true,
    animation: false,
    timeline: false,
    baseLayerPicker: false
    
  });
  

  viewer.scene.globe.enableLighting = true;
  viewer.scene.shadowMap.enabled = true;
  viewer.scene.shadowMap.softShadows = true;

  viewer.scene.requestRenderMode = true;
  viewer.scene.maximumRenderTimeChange = Infinity;

  viewer.camera.flyTo(default3DView);

// 🌳 LOAD GEOJSON FROM CESIUM ION
const resource = await Cesium.IonResource.fromAssetId(4620454);
const dataSource = await Cesium.GeoJsonDataSource.load(resource);
viewer.dataSources.add(dataSource);

// 🌳 LOAD TREE MODEL (ONCE)
const treeModelResource = await Cesium.IonResource.fromAssetId(4649458);

// 🌍 GET TERRAIN
const terrainProvider = viewer.terrainProvider;

// 🌳 LOOP THROUGH POINTS
const entities = dataSource.entities.values;

for (const entity of entities) {

  const position = entity.position.getValue(Cesium.JulianDate.now());
  if (!position) continue;

  const cartographic = Cesium.Cartographic.fromCartesian(position);

  const updated = await Cesium.sampleTerrainMostDetailed(
    terrainProvider,
    [cartographic]
  );

  const height = updated[0].height;

  // 🌳 ADD TREE MODEL (ION)
  viewer.entities.add({
    position: Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      height + 0.3
    ),
    model: {
      uri: treeModelResource,   // ✅ NEW MODEL
      scale: 8,
      minimumPixelSize: 32,
      maximumScale: 10
    }
  });

  entity.show = false;
}

// 🛣 LOAD ROAD LAYER FROM CESIUM ION
const roadResource = await Cesium.IonResource.fromAssetId(4619835);
const roadDataSource = await Cesium.GeoJsonDataSource.load(roadResource);

viewer.dataSources.add(roadDataSource);

// 🛣 STYLE ROADS
roadDataSource.entities.values.forEach(entity => {

  if (entity.polyline) {
    entity.polyline.width = new Cesium.CallbackProperty(() => {
  const height = viewer.camera.positionCartographic.height;
  return height > 5000 ? 1 : 3;
}, false);
    entity.polyline.material = Cesium.Color.GREY; // 🔥 visible color
    entity.polyline.clampToGround = true; // stick to terrain
  }

});
// Initially OFF
roadDataSource.show = false;

const toggleRoads = document.getElementById("toggleRoads");
toggleRoads.checked = false;

// Toggle behavior
toggleRoads.onchange = (e) => {
  roadDataSource.show = e.target.checked;
  viewer.scene.requestRender();
};


  osm = await Cesium.createOsmBuildingsAsync();
  osm.shadows = Cesium.ShadowMode.ENABLED;
  viewer.scene.primitives.add(osm);

  toggleBuildings.onchange = e => osm.show = e.target.checked;

  
    /* Load LST layers */
  for (const o of layers) {
    o.img = viewer.imageryLayers.addImageryProvider(
      await Cesium.IonImageryProvider.fromAssetId(o.asset)
    );
    o.img.show = false;
  }

  function updateLegend(o){
  legendMax.textContent = o.max + " °C";
  legendMin.textContent = o.min + " °C";

  document.getElementById("legendYear").textContent =
    "Year: " + o.year;
}


  function zoomToLST(force2D=false) {
    if (!lstRectangle) return;
    force2D
      ? viewer.camera.setView({ destination: lstRectangle })
      : viewer.camera.flyTo({ destination: lstRectangle, duration: 1.5 });
  }


  function crossFade(){
    if (!playing) return;

    const cur = layers[index];
    const nxt = layers[(index + 1) % layers.length];

    cur.img.show = nxt.img.show = true;
    updateLegend(cur);

    let step = 0;
    fadeTimer = setInterval(() => {
      step++;
      const p = step / 40;
      cur.img.alpha = 1 - p;
      nxt.img.alpha = p;
      viewer.scene.requestRender();

      if (p >= 1) {
  clearInterval(fadeTimer);

  cur.img.show = false;
  cur.img.alpha = 1;

  index = (index + 1) % layers.length;

  // 🔥 SYNC WEATHER WITH LST YEAR
  const weatherData = lstWeatherDates[index];
  fetchWeatherForDate(weatherData.date);

  // 🔥 UPDATE DATE LABEL
  document.getElementById("weatherDate").innerText =
    `Date: ${weatherData.date.slice(6,8)}-${weatherData.date.slice(4,6)}-${weatherData.date.slice(0,4)}`;

  setTimeout(crossFade, 2000);
}
    }, 50);
  }
  crossFade();

  playPauseBtn.onclick = () => {
    playing = !playing;
    playPauseBtn.textContent = playing ? "⏸ Pause LST Animation" : "▶ Play LST Animation";
    playing ? crossFade() : clearInterval(fadeTimer);
  };

  
  layers.forEach(o => {
    document.getElementById(o.id).onchange = e => {
      playing = false;
      clearInterval(fadeTimer);
      o.img.show = e.target.checked;
      updateLegend(o);
      viewer.scene.requestRender();
    };
  });

  /* Predicted layers */
  predictedLayers[0].layer = viewer.imageryLayers.addImageryProvider(
  await Cesium.IonImageryProvider.fromAssetId(4634556)
);
predictedLayers[0].layer.show = false;

predictedLayers[1].layer = viewer.imageryLayers.addImageryProvider(
  await Cesium.IonImageryProvider.fromAssetId(4634559)
);
predictedLayers[1].layer.show = false;

  togglePred1.onchange = e => {
  playing = false;
  clearInterval(fadeTimer);

  predictedLayers.forEach(p => p.layer.show = false);

  if (e.target.checked) {
    predictedLayers[0].layer.show = true;
    updateLegend(predictedLayers[0]); // 🔥 LEGEND UPDATE
  }

  viewer.scene.requestRender();
};

togglePred2.onchange = e => {
  playing = false;
  clearInterval(fadeTimer);

  predictedLayers.forEach(p => p.layer.show = false);

  if (e.target.checked) {
    predictedLayers[1].layer.show = true;
    updateLegend(predictedLayers[1]); // 🔥 LEGEND UPDATE
  }

  viewer.scene.requestRender();
};

  /* Shadow control */
  function updateShadow(){
    const h = +hourSlider.value;
    const m = +monthSlider.value - 1;
    hourValue.textContent = `${h}:00`;
    monthValue.textContent =
      ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m];
    viewer.clock.currentTime =
      Cesium.JulianDate.fromDate(new Date(2024, m, 15, h));
    viewer.scene.requestRender();
  }
  hourSlider.oninput = updateShadow;
  monthSlider.oninput = updateShadow;
  updateShadow();

  /* Hotspots */
  function createHotspots() {

  const hotspotData = [
  {
    name: "Hotspot 1",
    lat: 12.9507,
    lon: 77.6696,
    land: "Industrial Park",
    vegetation: "Medium",
    risk: "High UHI",
    mitigation: [
      "Cool Pavemnets",
      "PWR Pavemnets",
    ],
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Cool_pavement.jpg"
  },
  {
    name: "Hotspot 2",
    lat: 13.0114,
    lon: 77.6071,
    land: "Residential",
    vegetation: "Medium-Low",
    risk: "Moderate UHI",
    mitigation: [
      "Urban parks",
      "Cool and Green roofs",
    ],
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Green_roof.jpg"
    
  },
  {
    name: "Hotspot 3",
    lat: 12.9456,
    lon: 77.5281,
    land: "New development",
    vegetation: "Low",
    risk: "High UHI",
    mitigation: [
      "Trees and Green Space",
      "Shaded streets"
    ],
    image: "https://github.com/JyothiMB18/Pictures/blob/47c2efe534185c36b9b0d2e775b6e0c7d214d7d4/9m5bZ29BYReVcZR2VcSuXB.jpg"
  },
  {
    name: "Hotspot 4",
    lat: 12.8626,
    lon: 77.6585,
    land: "IT corridor",
    vegetation: "Very Low",
    risk: "High UHI",
    mitigation: [
      "Trees",
      "Heat-reflective materials"
    ],
    image: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Industrial_area.jpg"
  }
];

  hotspotData.forEach(h => {

  let icon = "https://cdn-icons-png.flaticon.com/512/684/684908.png";

  if (h.type === "heat")
    icon = "https://cdn-icons-png.flaticon.com/512/4814/4814276.png";

  if (h.type === "moderate")
    icon = "https://cdn-icons-png.flaticon.com/512/869/869869.png";

  const marker = viewer.entities.add({
    name: h.name,
    position: Cesium.Cartesian3.fromDegrees(h.lon, h.lat),

    billboard: {
      image: icon,
      scale: 0.06,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    },

    properties: {
        landuse: h.land,
        vegetation: h.vegetation,
        risk: h.risk,
        mitigation: h.mitigation,
        image: h.image
    },
    show: false
  });
    // 1 km buffer
    const buffer = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(h.lon, h.lat),
      ellipse: {
        semiMajorAxis: 1500,
        semiMinorAxis: 1500,
        material: Cesium.Color.RED.withAlpha(0.35),
        outline: true,
        outlineColor: Cesium.Color.RED
      },
      show: false
    });

    hotspotEntities.push(marker, buffer);
  });
}

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction(function(click) {

  const picked = viewer.scene.pick(click.position);

  if (!picked || !picked.id || !picked.id.properties) return;

  const data = picked.id.properties;

  const props = picked.id.properties;

document.getElementById("locationPanel").style.display = "block";

document.getElementById("locTitle").innerText = picked.id.name;

document.getElementById("locLand").innerText =
  props.landuse.getValue();

document.getElementById("locVeg").innerText =
  props.vegetation.getValue();

document.getElementById("locRisk").innerText =
  props.risk.getValue();

// MITIGATION LIST
const mitigationList = props.mitigation.getValue();
const box = document.getElementById("mitigationBox");

box.innerHTML = "<ul>" +
  mitigationList.map(m => `<li>${m}</li>`).join("") +
  "</ul>" +
  `<img src="${props.image.getValue()}">`;

  // SHOW PANEL
  //document.getElementById("locationPanel").style.display = "block";

  // CHARACTERISTICS
  let charHTML = `
    <h4>📊 Characteristics</h4>
    🏙 Land Use: ${char.landuse} <br>
    🌳 Vegetation: ${char.vegetation} <br>
    ⚠ Risk: ${char.risk}
  `;

  // MITIGATION
  let mitigationHTML = `<h4>🌿 Mitigation Strategies</h4><ul>`;
  mitigation.forEach(m => {
    mitigationHTML += `<li>${m}</li>`;
  });
  mitigationHTML += `</ul>`;

  document.getElementById("infoContent").innerHTML =
    `<h3>${picked.id.name}</h3>` + charHTML + mitigationHTML;

}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

createHotspots();

const toggleHotspotsBtn = document.getElementById("toggleHotspots");

toggleHotspotsBtn.onclick = () => {

  hotspotsVisible = !hotspotsVisible;

  hotspotEntities.forEach(e => e.show = hotspotsVisible);

  toggleHotspotsBtn.textContent =
    hotspotsVisible ? "❌ Hide Hotspots" : "📍 Show Hotspots";

    // 🔥 ZOOM OUT TO FULL VIEW
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(77.56, 12.7, 15000), // higher height = zoom out
    orientation: {
      pitch: Cesium.Math.toRadians(-30)
    },
    duration: 2
  });

  viewer.scene.requestRender();
};

document.querySelectorAll(".hotspot").forEach(h => {
  h.onclick = () => {

    const lat = +h.dataset.lat;
    const lon = +h.dataset.lon;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000),
      orientation: { pitch: Cesium.Math.toRadians(-30) },
      duration: 2
    });

  };
});

// CLOSE PANEL
document.getElementById("closePanel").onclick = () => {
  document.getElementById("locationPanel").style.display = "none";
};

// TOGGLE MITIGATION
document.getElementById("toggleMitigation").onclick = () => {
  const box = document.getElementById("mitigationBox");

  box.style.display =
    box.style.display === "none" ? "block" : "none";
};



  /* 2D / 3D */
  toggleViewBtn.onclick = () => {
    if (is3D) {
      osm.show = false;
      viewer.scene.shadowMap.enabled = false;
      viewer.scene.morphTo2D(1.5);
      setTimeout(() => zoomToLST(true), 1600);
      toggleViewBtn.textContent = "🌍 Switch to 3D";
    } else {
      viewer.scene.morphTo3D(1.5);
      viewer.scene.shadowMap.enabled = true;
      osm.show = toggleBuildings.checked;
      setTimeout(() => viewer.camera.flyTo(default3DView), 1600);
      toggleViewBtn.textContent = "🗺 Switch to 2D";
    }
    is3D = !is3D;
  };

}



/*const weatherHeader = document.getElementById("weatherHeader");
const weatherContent = document.getElementById("weatherContent");

if (weatherHeader && weatherContent) {
  weatherHeader.onclick = () => {
    weatherContent.style.display =
      weatherContent.style.display === "none" ? "block" : "none";
  };
}

fetchWeatherForDate(lstWeatherDates[0].date);
fetchRecentWeather();*/

let hotspotEntities = [];
let hotspotsVisible = false;


// 🔍 ZOOM IN
document.getElementById("zoomInBtn").onclick = () => {
  viewer.camera.zoomIn(300); // smaller = smoother zoom
};

// 🔍 ZOOM OUT
document.getElementById("zoomOutBtn").onclick = () => {
  viewer.camera.zoomOut(300);
};


init();
