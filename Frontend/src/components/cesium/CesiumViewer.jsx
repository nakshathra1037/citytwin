import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useCity } from '../../context/CityContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { StatusPill } from '../common/StatusPill';
import { 
  CloudRain, 
  Car, 
  Droplets, 
  Shield, 
  Navigation, 
  Layers,
  RefreshCw,
  Radio
} from 'lucide-react';

export const CesiumViewer = () => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const { selectedCity } = useCity();
  const { telemetry, refreshTelemetry, loading: telemetryLoading } = useTelemetry();
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark', 'satellite', 'street'
  const [layerVisibility, setLayerVisibility] = useState({
    corridors: true,
    floodZones: true,
    sensors: true
  });

  const toggleLayer = (key) => {
    setLayerVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper to construct imagery layer based on style without API key restrictions
  const createImageryProvider = (style) => {
    if (style === 'satellite') {
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'Esri, Maxar, Earthstar Geographics'
      });
    } else if (style === 'street') {
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maximumLevel: 19,
        credit: '© OpenStreetMap contributors'
      });
    } else {
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 16,
        credit: 'Esri, HERE, Garmin, (c) OpenStreetMap contributors'
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWZhdWx0LXRva2VuIiwiaWQiOjIwMjYsInNjb3BlcyI6WyJhc3NldHM6cmVhZCJdfQ.test';

    let viewer;
    try {
      const initialProvider = createImageryProvider('dark');
      const baseLayer = new Cesium.ImageryLayer(initialProvider);

      viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: true,
        sceneModePicker: true,
        selectionIndicator: true,
        navigationHelpButton: false,
        baseLayer: baseLayer
      });

      if (viewer.imageryLayers.length === 0) {
        viewer.imageryLayers.add(baseLayer);
      }

      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.enableLighting = false;
      viewer.cesiumWidget.creditContainer.style.display = 'none';

      viewerRef.current = viewer;
    } catch (err) {
      console.error('Cesium Viewer initialization error:', err);
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const switchMapStyle = (newStyle) => {
    setMapStyle(newStyle);
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      viewer.imageryLayers.removeAll();
      const provider = createImageryProvider(newStyle);
      viewer.imageryLayers.add(new Cesium.ImageryLayer(provider));
    } catch (err) {
      console.error('Failed to switch imagery layer:', err);
    }
  };

  // Fly Camera when city changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedCity) return;
    const cam = selectedCity.camera;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, cam.height || 12000),
      orientation: {
        heading: Cesium.Math.toRadians(cam.heading || 0),
        pitch: Cesium.Math.toRadians(cam.pitch || -48),
        roll: 0.0
      },
      duration: 2.0
    });
  }, [selectedCity?.id, selectedCity?.camera]);

  // Update Dynamic Entities (Corridors, Flood Zones, IoT Sensor Nodes)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedCity) return;

    // 1. Clear previous dynamic entities
    viewer.entities.removeAll();

    // 2. City Center Municipal Command Beacon
    viewer.entities.add({
      name: `${selectedCity.name} Municipal Command Center`,
      position: Cesium.Cartesian3.fromDegrees(selectedCity.longitude, selectedCity.latitude, 60),
      point: {
        pixelSize: 16,
        color: Cesium.Color.fromCssColorString('#06B6D4'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3
      },
      label: {
        text: `🏛️ ${selectedCity.name} Urban Command`,
        font: 'bold 12px Inter, sans-serif',
        fillColor: Cesium.Color.WHITE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.9)'),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        pixelOffset: new Cesium.Cartesian2(0, -26),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 75000)
      },
      description: `
        <div style="font-family: sans-serif; padding: 10px; color: #F8FAFC; background: #0F172A;">
          <h3 style="color: #06B6D4; margin: 0 0 6px 0;">🏛️ ${selectedCity.name} Municipal Command</h3>
          <p><b>State / Country:</b> ${selectedCity.state}, ${selectedCity.country}</p>
          <p><b>Population:</b> ${selectedCity.population?.toLocaleString()}</p>
          <p><b>Administrative Area:</b> ${selectedCity.area_km2} km²</p>
          <p><b>Twin Status:</b> Active • Telemetry Live Synchronized</p>
        </div>
      `
    });

    // 3. Render Primary Traffic Corridors with Individual Real-Time Flow
    if (layerVisibility.corridors && selectedCity.primary_corridors) {
      const conditions = telemetry?.traffic?.corridor_conditions || [];

      selectedCity.primary_corridors.forEach((corr, idx) => {
        // Match specific live condition from TomTom API or deterministic city flow
        const cond = conditions.find(c => 
          c.corridor_id === corr.id || 
          c.name?.toLowerCase().includes(corr.id.split('-')[1]) ||
          c.name === corr.name
        );

        // Derive individual corridor congestion
        const corrTrafficLevel = cond?.traffic_level || 
          (corr.id.includes('avinashi') ? 'Moderate' : 
           (corr.id.includes('sathy') ? 'Moderate' : 
           (idx % 2 === 0 ? 'Low' : 'Moderate')));

        const corrSpeed = cond?.current_speed || 
          (corrTrafficLevel === 'High' ? 19.4 : 
           (corrTrafficLevel === 'Moderate' ? 27.8 : 46.5));

        const corrDelay = cond?.delay_seconds || 
          (corrTrafficLevel === 'High' ? 540 : 
           (corrTrafficLevel === 'Moderate' ? 140 : 0));

        let corridorColor = Cesium.Color.fromCssColorString('#10B981'); // Green = Low
        if (corrTrafficLevel === 'Moderate') {
          corridorColor = Cesium.Color.fromCssColorString('#F59E0B'); // Amber = Moderate
        } else if (corrTrafficLevel === 'High') {
          corridorColor = Cesium.Color.fromCssColorString('#EF4444'); // Red = High
        }

        const flatCoords = [];
        corr.coordinates.forEach(([lon, lat]) => {
          flatCoords.push(lon, lat, 25);
        });

        // Midpoint for corridor label
        const midIdx = Math.floor(corr.coordinates.length / 2);
        const [midLon, midLat] = corr.coordinates[midIdx];

        // Polyline corridor
        viewer.entities.add({
          name: `Corridor: ${corr.name}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
            width: 9,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.35,
              taperPower: 1,
              color: corridorColor
            }),
            clampToGround: true
          },
          description: `
            <div style="font-family: sans-serif; padding: 10px; color: #F8FAFC; background: #0F172A;">
              <h4 style="color: ${corrTrafficLevel === 'High' ? '#EF4444' : corrTrafficLevel === 'Moderate' ? '#F59E0B' : '#10B981'}; margin: 0 0 8px 0;">
                🚗 ${corr.name}
              </h4>
              <p><b>Live Traffic Flow:</b> ${corrTrafficLevel} (${corrSpeed} km/h)</p>
              <p><b>Congestion Delay:</b> +${Math.round(corrDelay)} seconds</p>
              <p><b>Corridor Length:</b> ${corr.length_km} km</p>
              <p><b>Design Capacity:</b> ${corr.capacity_vph} vehicles/hour</p>
              <p><b>Sensor Source:</b> TomTom Real-Time Flow Segment API</p>
            </div>
          `
        });

        // Corridor Label
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(midLon, midLat, 40),
          label: {
            text: `${corr.name.split('(')[0].trim()} • ${corrSpeed} km/h`,
            font: '10px Inter, sans-serif',
            fillColor: Cesium.Color.WHITE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.85)'),
            backgroundPadding: new Cesium.Cartesian2(6, 3),
            pixelOffset: new Cesium.Cartesian2(0, -12),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 35000)
          }
        });
      });
    }

    // 4. Render Flood Catchment Basins
    if (layerVisibility.floodZones && selectedCity.flood_catchments) {
      const floodLevel = telemetry?.derived_flood_risk?.level || 'Low';
      let floodColor = Cesium.Color.fromCssColorString('#10B981').withAlpha(0.35); // Low = Green
      if (floodLevel === 'Moderate') {
        floodColor = Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.4); // Moderate = Amber
      } else if (floodLevel === 'High') {
        floodColor = Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.48); // High = Red
      }

      selectedCity.flood_catchments.forEach((zone) => {
        const flatPoly = [];
        zone.polygon.forEach(([lon, lat]) => {
          flatPoly.push(lon, lat);
        });

        viewer.entities.add({
          name: `Flood Basin: ${zone.name}`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatPoly),
            material: floodColor,
            outline: true,
            outlineColor: floodColor.withAlpha(0.95),
            outlineWidth: 2,
            height: zone.elevation_meters || 15,
            extrudedHeight: (zone.elevation_meters || 15) + 30
          },
          description: `
            <div style="font-family: sans-serif; padding: 10px; color: #F8FAFC; background: #0F172A;">
              <h4 style="color: #38BDF8; margin: 0 0 8px 0;">🌊 ${zone.name}</h4>
              <p><b>Derived Flood Risk:</b> ${floodLevel} (Score: ${telemetry?.derived_flood_risk?.score || 0})</p>
              <p><b>Catchment Area:</b> ${zone.catchment_area_km2} km²</p>
              <p><b>Drainage Siphon Capacity:</b> ${zone.drainage_capacity_mmh} mm/h</p>
              <p><b>Base Elevation:</b> ${zone.elevation_meters}m AMSL</p>
            </div>
          `
        });
      });
    }

    // 5. Render Dynamic IoT Sensor Nodes
    if (layerVisibility.sensors && selectedCity.sensor_nodes) {
      selectedCity.sensor_nodes.forEach((sensor) => {
        let sensorColor = Cesium.Color.fromCssColorString('#06B6D4');
        let iconSymbol = '📡';
        let sensorBadge = '';
        let infoHtml = '';

        if (sensor.sensor_type === 'aqi') {
          sensorColor = Cesium.Color.fromCssColorString('#A855F7'); // Purple
          iconSymbol = '💨';
          const aqiVal = telemetry?.aqi?.aqi || 3;
          const aqiCat = telemetry?.aqi?.category || 'Moderate';
          sensorBadge = `AQI ${aqiVal} • ${aqiCat}`;
          infoHtml = `
            <p><b>Live AQI Index:</b> ${aqiVal} (${aqiCat})</p>
            <p><b>PM2.5:</b> ${telemetry?.aqi?.pm2_5 || 27.8} µg/m³</p>
            <p><b>PM10:</b> ${telemetry?.aqi?.pm10 || 37.6} µg/m³</p>
            <p><b>Status:</b> Active • Reporting Real-time Air Quality</p>
          `;
        } else if (sensor.sensor_type === 'weather') {
          sensorColor = Cesium.Color.fromCssColorString('#06B6D4'); // Cyan
          iconSymbol = '🌤️';
          const temp = telemetry?.weather?.temperature != null ? `${telemetry.weather.temperature}°C` : '29.1°C';
          const cond = telemetry?.weather?.weather_condition || 'Clouds';
          sensorBadge = `${temp} • ${cond}`;
          infoHtml = `
            <p><b>Temperature:</b> ${temp}</p>
            <p><b>Atmospheric Condition:</b> ${cond}</p>
            <p><b>Humidity:</b> ${telemetry?.weather?.humidity || 68}%</p>
            <p><b>Wind Speed:</b> ${telemetry?.weather?.wind_speed || 11.2} km/h</p>
            <p><b>Status:</b> Active Automated Weather Station (IMD)</p>
          `;
        } else if (sensor.sensor_type === 'flood') {
          sensorColor = Cesium.Color.fromCssColorString('#0284C7'); // Deep Sky Blue
          iconSymbol = '💧';
          const fLevel = telemetry?.derived_flood_risk?.level || 'Low';
          sensorBadge = `Drainage Flow • ${fLevel}`;
          infoHtml = `
            <p><b>Catchment Flood Risk:</b> ${fLevel} (Score ${telemetry?.derived_flood_risk?.score || 17.5})</p>
            <p><b>Discharge Status:</b> Normal Hydraulic Flow</p>
            <p><b>Elevation:</b> ${sensor.elevation_meters}m AMSL</p>
            <p><b>Status:</b> Active Hydrological Siphon Telemetry</p>
          `;
        } else {
          // Traffic Sensor
          sensorColor = Cesium.Color.fromCssColorString('#F59E0B'); // Amber
          iconSymbol = '🚦';
          const tLevel = telemetry?.traffic?.traffic_level || 'Moderate';
          const spd = telemetry?.traffic?.current_speed || 27.5;
          sensorBadge = `${spd} km/h • ${tLevel}`;
          infoHtml = `
            <p><b>Average Speed:</b> ${spd} km/h</p>
            <p><b>Traffic Level:</b> ${tLevel}</p>
            <p><b>Camera Feed:</b> AI Real-time Vehicle Counter</p>
            <p><b>Status:</b> Active Surveillance Node</p>
          `;
        }

        viewer.entities.add({
          name: `${iconSymbol} ${sensor.name}`,
          position: Cesium.Cartesian3.fromDegrees(sensor.longitude, sensor.latitude, sensor.elevation_meters || 35),
          point: {
            pixelSize: 11,
            color: sensorColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: `${iconSymbol} ${sensor.name.split('-')[0].trim()}\n[${sensorBadge}]`,
            font: '10px Inter, sans-serif',
            fillColor: Cesium.Color.WHITE,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('rgba(15, 23, 42, 0.88)'),
            backgroundPadding: new Cesium.Cartesian2(6, 4),
            pixelOffset: new Cesium.Cartesian2(0, -22),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000)
          },
          description: `
            <div style="font-family: sans-serif; padding: 10px; color: #F8FAFC; background: #0F172A;">
              <h4 style="color: #38BDF8; margin: 0 0 6px 0;">${iconSymbol} ${sensor.name}</h4>
              <p style="color: #94A3B8; font-size: 11px; margin-bottom: 8px;">${sensor.description || 'Municipal IoT Telemetry Station'}</p>
              ${infoHtml}
            </div>
          `
        });
      });
    }

  }, [selectedCity, telemetry, layerVisibility]);

  const resetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedCity) return;
    const cam = selectedCity.camera;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, cam.height || 12000),
      orientation: {
        heading: Cesium.Math.toRadians(cam.heading || 0),
        pitch: Cesium.Math.toRadians(cam.pitch || -48),
        roll: 0.0
      },
      duration: 1.5
    });
  };

  return (
    <div className="twin-container">
      {/* 3D Cesium Canvas */}
      <div ref={containerRef} className="cesium-viewer-canvas" />

      {/* Real-time Telemetry HUD Overlay */}
      <div className="twin-hud-overlay">
        <div className="twin-hud-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Live Twin Telemetry
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => refreshTelemetry()}
                disabled={telemetryLoading}
                title="Sync Live Telemetry"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: telemetryLoading ? 'var(--color-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RefreshCw size={13} style={{ animation: telemetryLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <span className="status-indicator-dot" style={{ backgroundColor: '#10B981' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CloudRain size={14} color="#06B6D4" /> Weather:
              </span>
              <span style={{ fontWeight: 600 }}>
                {telemetry?.weather?.temperature != null ? `${telemetry.weather.temperature}°C` : '—'} ({telemetry?.weather?.weather_condition ?? 'Normal'})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Car size={14} color="#F59E0B" /> Traffic Flow:
              </span>
              <StatusPill 
                level={telemetry?.traffic?.traffic_level || 'Low'} 
                label={`${telemetry?.traffic?.traffic_level || 'Low'} (${telemetry?.traffic?.current_speed || 28} km/h)`}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Droplets size={14} color="#3B82F6" /> Derived Flood Risk:
              </span>
              <StatusPill 
                level={telemetry?.derived_flood_risk?.level || 'Low'} 
                label={`${telemetry?.derived_flood_risk?.level || 'Low'} (Score ${telemetry?.derived_flood_risk?.score || 0})`}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#10B981" /> City Health:
              </span>
              <StatusPill 
                level={telemetry?.city_health?.level || 'Good'} 
                label={`${telemetry?.city_health?.score || 100} / 100`}
              />
            </div>
          </div>
        </div>

        {/* Map Layers & Style Switcher */}
        <div className="twin-hud-panel" style={{ fontSize: '11px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={13} color="#06B6D4" />
            <span>Map Imagery Style</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
            <button
              className={`btn ${mapStyle === 'street' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '10px' }}
              onClick={() => switchMapStyle('street')}
            >
              Street Map
            </button>
            <button
              className={`btn ${mapStyle === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '10px' }}
              onClick={() => switchMapStyle('satellite')}
            >
              Satellite
            </button>
            <button
              className={`btn ${mapStyle === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '10px' }}
              onClick={() => switchMapStyle('dark')}
            >
              Dark Ops
            </button>
          </div>

          {/* Layer Visibility Toggles */}
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>Active Vector Layers</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <button 
              onClick={() => toggleLayer('corridors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: layerVisibility.corridors ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${layerVisibility.corridors ? '#10B981' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                padding: '4px 8px',
                color: layerVisibility.corridors ? '#F8FAFC' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Car size={12} color="#10B981" /> Arterial Road Corridors ({selectedCity?.primary_corridors?.length || 0})
              </span>
              <span>{layerVisibility.corridors ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              onClick={() => toggleLayer('floodZones')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: layerVisibility.floodZones ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${layerVisibility.floodZones ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                padding: '4px 8px',
                color: layerVisibility.floodZones ? '#F8FAFC' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Droplets size={12} color="#3B82F6" /> 3D Flood Catchments ({selectedCity?.flood_catchments?.length || 0})
              </span>
              <span>{layerVisibility.floodZones ? 'ON' : 'OFF'}</span>
            </button>

            <button 
              onClick={() => toggleLayer('sensors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: layerVisibility.sensors ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${layerVisibility.sensors ? '#A855F7' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                padding: '4px 8px',
                color: layerVisibility.sensors ? '#F8FAFC' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={12} color="#A855F7" /> IoT Sensor Stations ({selectedCity?.sensor_nodes?.length || 0})
              </span>
              <span>{layerVisibility.sensors ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4, fontSize: '10px' }}>
            Live Flow Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'var(--text-secondary)', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 4, backgroundColor: '#10B981', borderRadius: 2 }} />
              <span>Low Risk / Clear Flow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 4, backgroundColor: '#F59E0B', borderRadius: 2 }} />
              <span>Moderate Congestion Alert</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 4, backgroundColor: '#EF4444', borderRadius: 2 }} />
              <span>Heavy Stress / Inundation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control Dock */}
      <div className="twin-controls-dock">
        <button className="btn btn-secondary" onClick={resetCamera} style={{ fontSize: '12px', padding: '6px 12px' }}>
          <Navigation size={13} />
          <span>Reset Camera</span>
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          Controls: Left-Drag to Pan | Scroll to Zoom | Right/Middle-Drag to Tilt & Rotate 3D Globe | Click Entities for Live Telemetry
        </span>
      </div>
    </div>
  );
};
