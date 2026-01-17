// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import SunCalc from 'suncalc';
import { format, toZonedTime } from 'date-fns-tz';
import { FiSearch, FiWind, FiSun, FiActivity, FiNavigation, FiMapPin, FiInfo, FiGlobe, FiDatabase, FiTarget, FiCalendar, FiDroplet } from 'react-icons/fi';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const RESEARCH_STATIONS = [
  { name: "IIT Delhi (Safdarjung)", lat: 28.545, lon: 77.192, country: "IN" },
  { name: "Mauna Loa Observatory", lat: 19.536, lon: -155.576, country: "US" },
  { name: "Antarctica (McMurdo)", lat: -77.846, lon: 166.676, country: "AQ" }
];

const AIR_FACTS = [
  "Aerosol Optical Depth (AOD) > 0.4 usually indicates heavy haze or smoke.",
  "PM2.5 particles are 30x smaller than a human hair and enter the bloodstream.",
  "Ground-level Ozone forms when sunlight reacts with car pollutants.",
  "Cold air traps pollutants near the ground (Thermal Inversion).",
  "Nitrogen Dioxide (NO₂) peaks during rush hours."
];

function App() {
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [atmosphericState, setAtmosphericState] = useState({ isDay: true, sunAltitudePct: 20, isCloudy: false, isRain: false, isWindy: false });
  const [mapView, setMapView] = useState({ center: [0, 20], zoom: 100 }); 
  const [currentFact, setCurrentFact] = useState(AIR_FACTS[0]);

  useEffect(() => { 
      fetchRealLocation("Delhi"); 
      setCurrentFact(AIR_FACTS[Math.floor(Math.random() * AIR_FACTS.length)]);
  }, []);

  const handleInputChange = async (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (val.length > 2) {
      try {
        const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=5&language=en&format=json`);
        if (res.data.results) setSuggestions(res.data.results);
      } catch (err) { console.error(err); }
    } else { setSuggestions([]); }
  };

  const selectSuggestion = (cityObj) => {
    setSearchText(`${cityObj.name}, ${cityObj.country}`);
    setSuggestions([]);
    fetchRealLocation(null, cityObj);
  };

  const fetchRealLocation = async (queryName, directObj = null) => {
    try {
        let lat, lon, name, country;
        
        if (directObj) {
            lat = directObj.latitude || directObj.lat; 
            lon = directObj.longitude || directObj.lon;
            name = directObj.name; 
            country = directObj.country;
        } else {
            const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${queryName}&count=1&language=en&format=json`);
            if (!geoRes.data.results) return;
            const loc = geoRes.data.results[0];
            lat = loc.latitude; lon = loc.longitude;
            name = loc.name; country = loc.country;
        }

        setMapView({ center: [lon, lat], zoom: 1500 });

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,nitrogen_dioxide,aerosol_optical_depth,sulphur_dioxide&hourly=pm10,pm2_5,nitrogen_dioxide,aerosol_optical_depth&timezone=auto`;

        const [weatherRes, airRes] = await Promise.all([axios.get(weatherUrl), axios.get(airUrl)]);
        const w = weatherRes.data;
        const a = airRes.data;
        const currentW = w.current;
        const currentAir = a.current;

        const hourlyData = a.hourly.time.slice(0, 24).map((t, i) => ({
            time: t.split('T')[1],
            PM25: a.hourly.pm2_5[i],
            PM10: a.hourly.pm10[i],
            NO2: a.hourly.nitrogen_dioxide[i],
            AOD: a.hourly.aerosol_optical_depth[i] || 0
        }));

        const daily = w.daily;
        const forecast = daily.time.slice(1, 6).map((t, i) => ({
             day: new Date(t).toLocaleDateString('en-US', { weekday: 'short' }),
             max: Math.round(daily.temperature_2m_max[i+1]),
             min: Math.round(daily.temperature_2m_min[i+1]),
             code: daily.weather_code[i+1]
        }));
        setForecastData(forecast);

        const isPol = currentAir.pm2_5 > 50;

        setLocationData({
            name: `${name}, ${country}`, lat, lon, tz: w.timezone,
            tempC: Math.round(currentW.temperature_2m),
            tempF: Math.round((currentW.temperature_2m * 9/5) + 32),
            feelsLikeC: Math.round(currentW.apparent_temperature),
            weatherCode: currentW.weather_code,
            windSpeed: currentW.wind_speed_10m,
            windDir: currentW.wind_direction_10m,
            precip: currentW.precipitation,
            pm25: currentAir.pm2_5, pm10: currentAir.pm10,
            no2: currentAir.nitrogen_dioxide, so2: currentAir.sulphur_dioxide,
            aod: currentAir.aerosol_optical_depth || 0.15,
            aqi: Math.round(currentAir.pm2_5 * 2),
            advice: isPol ? "Poor air quality. Mask recommended." : "Clean air. Enjoy outdoors!"
        });
        setChartData(hourlyData);
    } catch (error) { console.error("API Error:", error); }
  };

  useEffect(() => {
    if (!locationData) return;
    const nowAbs = new Date();
    const sunPos = SunCalc.getPosition(nowAbs, locationData.lat, locationData.lon);
    const moonPos = SunCalc.getMoonPosition(nowAbs, locationData.lat, locationData.lon);

    const isDay = sunPos.altitude > -0.1; 
    let altitudePercentage = 80;

    if(isDay) {
        const normalizedAlt = Math.min(Math.max(sunPos.altitude, 0), 1.2) / 1.2;
        altitudePercentage = 80 - (normalizedAlt * 70);
    } else { 
        const normalizedMoonAlt = Math.min(Math.max(moonPos.altitude, 0), 1.0) / 1.0;
        altitudePercentage = 80 - (normalizedMoonAlt * 70);
    }

    // UPDATE: Relaxed Logic for animations
    const code = locationData.weatherCode;
    const isCloudy = code > 2;
    const isRain = code >= 50 && code <= 99; 
    // FIX: Show wind effects if speed > 2 (was 15) so user sees it more often
    const isWindy = locationData.windSpeed > 2; 

    setAtmosphericState({ isDay, sunAltitudePct: altitudePercentage, isCloudy, isRain, isWindy });

    const root = document.documentElement;
    root.style.setProperty('--sun-pos-y', `${altitudePercentage}%`);
    root.style.setProperty('--cloud-opacity', isCloudy ? 0.7 : 0);
    const animSpeed = Math.max(2, 20 - locationData.windSpeed) + 's';
    root.style.setProperty('--wind-speed', animSpeed);

    if (isDay) {
      root.style.setProperty('--sky-color-top', '#87CEEB'); root.style.setProperty('--sky-color-bottom', '#E0F6FF');
      root.style.setProperty('--orb-color', '#FFD700');
    } else {
      root.style.setProperty('--sky-color-top', '#0B0F2B'); root.style.setProperty('--sky-color-bottom', '#2A3654');
      root.style.setProperty('--orb-color', '#F4F1C9');
    }
  }, [locationData]);

  const getTimeString = (tz) => {
    if(!tz) return "--:--";
    try {
        const now = new Date();
        const local = toZonedTime(now, tz);
        return format(local, 'hh:mm a', { timeZone: tz });
    } catch { return "Local Time"; }
  };

  const getWeatherIcon = (code) => {
     if(code === 0) return "☀️";
     if(code < 3) return "⛅";
     if(code < 50) return "☁️";
     if(code < 80) return "🌧️";
     return "⛈️";
  };

  const getPollutantColor = (val, type) => {
    if (!val && val !== 0) return '#fff';
    const colors = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };
    switch(type) {
        case 'AQI': return val < 50 ? colors.green : val < 100 ? colors.yellow : colors.red;
        case 'PM25': return val < 15 ? colors.green : val < 35 ? colors.yellow : colors.red;
        case 'PM10': return val < 40 ? colors.green : val < 100 ? colors.yellow : colors.red;
        case 'NO2': return val < 25 ? colors.green : val < 50 ? colors.yellow : colors.red;
        case 'SO2': return val < 20 ? colors.green : val < 40 ? colors.yellow : colors.red;
        case 'AOD': return val < 0.2 ? colors.green : val < 0.5 ? colors.yellow : colors.red;
        default: return '#fff';
    }
  };

  let containerClasses = 'app-container';
  if (atmosphericState.isDay) containerClasses += ' is-day'; else containerClasses += ' is-night';

  return (
    <div className={containerClasses}>
      <div className="celestial-orb"></div>
      
      {/* 1. VISUAL EFFECTS LAYER */}
      <div className="wind-layer">
         {[...Array(6)].map((_, i) => (
             <div key={i} className="wind-stream" style={{
                 top: `${15 + Math.random() * 80}%`, width: `${20 + Math.random() * 40}%`, animationDelay: `${Math.random() * 5}s`
             }}></div>
         ))}
      </div>

      {atmosphericState.isRain && (
        <div className="rain-layer">
           {[...Array(50)].map((_, i) => (
             <div key={i} className="rain-drop" style={{
                 left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random()}s`
             }}></div>
           ))}
        </div>
      )}

      {!atmosphericState.isDay && !atmosphericState.isCloudy && (
         <div className="star-layer">
            {[...Array(50)].map((_, i) => (
               <div key={i} className="star" style={{
                   left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`, 
                   width: `${Math.random() * 3}px`, height: `${Math.random() * 3}px`,
                   animationDelay: `${Math.random() * 3}s`
               }}></div>
            ))}
         </div>
      )}

      {/* FIXED: Removed 'isWindy' requirement for birds, they fly if it's day and not raining */}
      {atmosphericState.isDay && !atmosphericState.isRain && (
        <div className="bird-layer">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bird" style={{ top: `${10 + Math.random() * 40}%`, animationDelay: `${i * 2}s` }}></div>
            ))}
        </div>
      )}
      
      {/* FIXED: Leaves only blow if there is some wind (>2kmh) */}
      {atmosphericState.isDay && atmosphericState.isWindy && (
        <div className="leaf-layer">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="leaf" style={{ animationDuration: `${5 + Math.random() * 5}s`, animationDelay: `${i}s`, background: i % 2 === 0 ? '#90be6d' : '#f9c74f' }}></div>
            ))}
        </div>
      )}

      <div className="cloud-overlay"></div>
      
      <div className="content-layer">
        
        <div className="header">
            <img src="https://i.postimg.cc/13WntJzw/AIRQI-removebg-preview.png" alt="AirQI Logo" className="site-logo"/>
            <h1>AirQI</h1>
        </div>

        <div className="search-wrapper">
            <div className="search-container">
            <input 
                type="text" placeholder="Search ANY city (Tokyo, Paris, Mumbai...)" 
                value={searchText} onChange={handleInputChange}
            />
            <button onClick={() => fetchRealLocation(searchText)}><FiSearch size={20}/></button>
            </div>
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((city, idx) => (
                        <li key={idx} className="suggestion-item" onClick={() => selectSuggestion(city)}>
                            {city.name}, {city.country}
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {locationData ? (
          <div className="main-layout">
            
            <div className="left-column">
                <div className="side-widget">
                    <h3><FiTarget/> Research Stations</h3>
                    <ul style={{listStyle:'none', padding:0}}>
                        {RESEARCH_STATIONS.map((station, idx) => (
                            <li key={idx} 
                                onClick={() => fetchRealLocation(null, station)}
                                style={{padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', display: 'flex', justifyContent: 'space-between'}}
                                className="hover-highlight"
                            >
                                <span>{station.name}</span><FiActivity size={14} color="#00ffcc"/>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="side-widget">
                    <h3><FiMapPin/> Location Map</h3>
                    <div className="map-container">
                        <ComposableMap projection="geoMercator" 
                            projectionConfig={{ scale: mapView.zoom, center: mapView.center }}>
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) => geographies.map(geo => (
                                    <Geography key={geo.rsmKey} geography={geo} 
                                        fill="#D6D6DA" stroke="#333" strokeWidth={0.5} 
                                        style={{default: { outline: "none" }, hover: { fill: "#F53", outline: "none" }}}
                                    />
                                ))}
                            </Geographies>
                            <Marker coordinates={[locationData.lon, locationData.lat]}>
                                <circle r={10} fill="#FF5533" stroke="#fff" strokeWidth={3} />
                                <text textAnchor="middle" y={-15} style={{ fontFamily: "system-ui", fill: "#5D5A6D", fontSize: "14px", fontWeight:"bold" }}>
                                    {locationData.name.split(',')[0]}
                                </text>
                            </Marker>
                        </ComposableMap>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="glass-card location-header">
                    <h2>{locationData.name}</h2>
                    <div className="time-badge">{getTimeString(locationData.tz)}</div>
                    
                    {/* FIXED: RESTORED FAHRENHEIT + FEELS LIKE */}
                    <div className="temp-display">
                        {locationData.tempC}°C 
                        <span style={{fontSize:'2.5rem', opacity:0.6, margin: '0 10px'}}>/</span>
                        <span style={{color: '#ddd'}}>{locationData.tempF}°F</span>
                        <div style={{fontSize:'1.1rem', opacity:0.8, fontWeight:'normal', marginTop:'5px'}}>
                             Feels Like {locationData.feelsLikeC}°C
                        </div>
                    </div>
                    
                    <div style={{marginTop:'20px', padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'10px', display:'inline-block'}}>
                        <strong>Advice:</strong> {locationData.advice}
                    </div>

                    <div style={{marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)'}}>
                        <h3 style={{fontSize: '1rem', display:'flex', alignItems:'center', gap:'8px'}}>
                            <FiCalendar/> 5-Day Forecast
                        </h3>
                        <div className="forecast-row">
                            {forecastData.map((day, i) => (
                                <div key={i} className="forecast-card">
                                    <div className="forecast-day">{day.day}</div>
                                    <div className="forecast-icon">{getWeatherIcon(day.code)}</div>
                                    <div className="forecast-temp">{day.max}°</div>
                                    <div className="forecast-low">{day.min}°</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="split-row">
                    <div className="glass-card" style={{display:'flex', flexDirection:'column'}}>
                        <h3 style={{fontSize:'1rem', marginBottom:'15px'}}>Atmosphere</h3>
                        <div className="composition-grid">
                            <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.aqi, 'AQI')}`}}>
                                <span>AQI</span><span className="stat-value" style={{color: getPollutantColor(locationData.aqi, 'AQI')}}>{locationData.aqi}</span>
                                <span className="stat-unit">US Index</span>
                            </div>
                            <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.pm25, 'PM25')}`}}>
                                <span>PM2.5</span><span className="stat-value" style={{color: getPollutantColor(locationData.pm25, 'PM25')}}>{locationData.pm25}</span>
                                <span className="stat-unit">µg/m³</span>
                            </div>
                            <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.pm10, 'PM10')}`}}>
                                <span>PM10</span><span className="stat-value" style={{color: getPollutantColor(locationData.pm10, 'PM10')}}>{locationData.pm10}</span>
                                <span className="stat-unit">µg/m³</span>
                            </div>
                             <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.no2, 'NO2')}`}}>
                                <span>NO₂</span><span className="stat-value" style={{color: getPollutantColor(locationData.no2, 'NO2')}}>{locationData.no2}</span>
                                <span className="stat-unit">µg/m³</span>
                            </div>
                            <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.aod, 'AOD')}`}}>
                                <span>AOD</span><span className="stat-value" style={{color: getPollutantColor(locationData.aod, 'AOD')}}>{locationData.aod ? locationData.aod.toFixed(2) : '-'}</span>
                                <span className="stat-unit">Optical</span>
                            </div>
                            <div className="stat-box" style={{border: `2px solid ${getPollutantColor(locationData.so2, 'SO2')}`}}>
                                <span>SO₂</span><span className="stat-value" style={{color: getPollutantColor(locationData.so2, 'SO2')}}>{locationData.so2}</span>
                                <span className="stat-unit">µg/m³</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card chart-container">
                        <h3 style={{marginBottom:'10px', textAlign:'center', fontSize:'1rem'}}><FiActivity/> 24-Hour Trends</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="colorPm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="time" stroke="#ddd" fontSize={10} tick={{fill:'white'}} />
                                <YAxis stroke="#fff" fontSize={10} tick={{fill:'white'}} />
                                <Tooltip contentStyle={{backgroundColor: '#222', border: '1px solid #555', color: '#fff'}} />
                                <Legend wrapperStyle={{ color: '#fff' }}/>
                                <Area type="monotone" dataKey="PM25" stroke="#8884d8" fillOpacity={1} fill="url(#colorPm)" name="PM2.5" />
                                <Line type="monotone" dataKey="PM10" stroke="#ffc658" strokeWidth={2} dot={false} name="PM10" />
                                <Line type="monotone" dataKey="AOD" stroke="#00ffcc" strokeWidth={2} dot={false} name="AOD" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card sources-section">
                    <h3 style={{fontSize:'1rem', display:'flex', alignItems:'center', gap:'10px'}}>
                        <FiDatabase/> Data Sources & Models
                    </h3>
                    <table className="sources-table">
                        <thead>
                            <tr><th>Metric</th><th>Primary Source</th><th>Satellite / Model</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Particulate Matter (PM2.5/PM10)</td><td><span className="source-tag">CAMS</span> <span className="source-tag">OpenAQ</span></td><td>Sentinel-5P, Ground Stations</td></tr>
                            <tr><td>Aerosol Optical Depth (AOD)</td><td><span className="source-tag">NASA Earthdata</span></td><td>MODIS (Terra/Aqua)</td></tr>
                            <tr><td>Trace Gases (NO₂, SO₂)</td><td><span className="source-tag">ESA Copernicus</span></td><td>Sentinel-5P TROPOMI</td></tr>
                            <tr><td>Weather (Wind/Temp)</td><td><span className="source-tag">NOAA</span> <span className="source-tag">DWD</span></td><td>GFS & ICON Models</td></tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="right-column">
                <div className="side-widget" style={{background: 'rgba(0,0,0,0.6)', border: '1px solid #4a90e2'}}>
                    <h3><FiWind/> Wind Analysis</h3>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'15px', marginTop:'10px'}}>
                        <div style={{width:'80px', height:'80px', borderRadius:'50%', border:'2px solid white', display:'flex', alignItems:'center', justifyContent:'center', background: 'rgba(255,255,255,0.1)'}}>
                             <FiNavigation size={40} style={{transform: `rotate(${locationData.windDir}deg)`, transition: 'transform 1s'}}/>
                        </div>
                        <div style={{textAlign:'center'}}>
                            <div style={{fontSize:'2rem', fontWeight:'bold'}}>{locationData.windSpeed}</div>
                            <div style={{opacity:0.7}}>km/h</div>
                        </div>
                        <div style={{fontSize:'0.9rem', textAlign:'center'}}>Coming from {locationData.windDir}°</div>
                    </div>
                </div>

                <div className="side-widget">
                    <h3><FiInfo/> Air Facts</h3>
                    <div style={{fontSize:'0.9rem', lineHeight:'1.5'}}>
                        Did You Know? {currentFact}
                        <br/><br/>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#87CEEB'}}>
                             <FiDroplet/> Rain today: {locationData.precip} mm
                        </div>
                    </div>
                </div>
            </div>

          </div>
        ) : (
             <div style={{textAlign:'center', marginTop:'100px'}}><h2>Loading Atmosphere...</h2></div>
        )}
      </div>

      <footer className="footer">© 2026 AirQI Project. Global Atmospheric Data.</footer>
    </div>
  );
}

export default App;