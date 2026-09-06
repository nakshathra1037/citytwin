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
  Eye, 
  Map as MapIcon 
} from 'lucide-react';

export const CesiumViewer = () => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const { selectedCity } = useCity();
  const { telemetry } = useTelemetry();
  const [mapStyle, setMapStyle] = useState('street'); // 'street', 'satellite', 'dark'

  // Helper to construct imagery layer based on style
  const createImageryProvider = (style) => {
    if (style === 'satellite') {
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maximumLevel: 19,
        credit: 'Esri, Maxar, Earthstar Geographics'
      });
    } else if (style === 'dark') {
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19,
        credit: 'CartoDB'
      });
    } else {
      // Default: CartoDB Voyager / OpenStreetMap raster tiles
      return new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        maximumLevel: 19,
        credit: 'OpenStreetMap, CartoDB'
      });
    }
  };

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Suppress default Cesium Ion warning if token not provided
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWZhdWx0LXRva2VuIiwiaWQiOjIwMjYsInNjb3BlcyI6WyJhc3NldHM6cmVhZCJdfQ.test';

    let viewer;
    try {
      const initialProvider = createImageryProvider('street');
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

      // Ensure imagery layer is actively rendered
      if (viewer.imageryLayers.length === 0) {
        viewer.imageryLayers.add(baseLayer);
      }

      // Enable lighting and clean sky
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

  // Update map imagery when mapStyle changes
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

  // Update Camera, Corridors, and Flood Catchments when selectedCity or telemetry changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedCity) return;

    // 1. Smooth Camera FlyTo
    const cam = selectedCity.camera;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, cam.height || 10000),
      orientation: {
        heading: Cesium.Math.toRadians(cam.heading || 0),
        pitch: Cesium.Math.toRadians(cam.pitch || -45),
        roll: 0.0
      },
      duration: 2.0
    });

    // 2. Clear old entities
    viewer.entities.removeAll();

    // 3. Add City Center Marker
    viewer.entities.add({
      name: `${selectedCity.name} Municipal Center`,
      position: Cesium.Cartesian3.fromDegrees(selectedCity.longitude, selectedCity.latitude, 50),
      point: {
        pixelSize: 14,
        color: Cesium.Color.fromCssColorString('#06B6D4'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3
      },
      description: `
        <div style="font-family: sans-serif; padding: 6px;">
          <h3 style="color: #06B6D4; margin-bottom: 4px;">${selectedCity.name}</h3>
          <p><b>Region:</b> ${selectedCity.state}, ${selectedCity.country}</p>
          <p><b>Population:</b> ${selectedCity.population?.toLocaleString()}</p>
          <p><b>Urban Area:</b> ${selectedCity.area_km2} km²</p>
        </div>
      `
    });

    // 4. Render Primary Traffic Corridors
    const trafficLevel = telemetry?.traffic?.traffic_level || 'Low';
    let corridorColor = Cesium.Color.fromCssColorString('#10B981'); // Green = Low
    if (trafficLevel === 'Moderate') {
      corridorColor = Cesium.Color.fromCssColorString('#F59E0B'); // Yellow = Moderate
    } else if (trafficLevel === 'High') {
      corridorColor = Cesium.Color.fromCssColorString('#EF4444'); // Red = High
    }

    if (selectedCity.primary_corridors) {
      selectedCity.primary_corridors.forEach((corr) => {
        const flatCoords = [];
        corr.coordinates.forEach(([lon, lat]) => {
          flatCoords.push(lon, lat, 25);
        });

        viewer.entities.add({
          name: `Arterial Corridor: ${corr.name}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
            width: 8,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.3,
              taperPower: 1,
              color: corridorColor
            }),
            clampToGround: true
          },
          description: `
            <div style="font-family: sans-serif; padding: 6px;">
              <h4 style="color: #F8FAFC;">${corr.name}</h4>
              <p><b>Length:</b> ${corr.length_km} km</p>
              <p><b>Traffic Congestion:</b> ${trafficLevel}</p>
              <p><b>Current Speed:</b> ${telemetry?.traffic?.current_speed || 38} km/h</p>
              <p><b>Capacity:</b> ${corr.capacity_vph} vehicles/hr</p>
            </div>
          `
        });
      });
    }

    // 5. Render Flood Risk Catchments
    const floodLevel = telemetry?.derived_flood_risk?.level || 'Low';
    let floodColor = Cesium.Color.fromCssColorString('#10B981').withAlpha(0.35); // Low = Green
    if (floodLevel === 'Moderate') {
      floodColor = Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.4); // Moderate = Yellow
    } else if (floodLevel === 'High') {
      floodColor = Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.45); // High = Red
    }

    if (selectedCity.flood_catchments) {
      selectedCity.flood_catchments.forEach((zone) => {
        const flatPoly = [];
        zone.polygon.forEach(([lon, lat]) => {
          flatPoly.push(lon, lat);
        });

        viewer.entities.add({
          name: `Flood Catchment: ${zone.name}`,
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(flatPoly),
            material: floodColor,
            outline: true,
            outlineColor: floodColor.withAlpha(0.95),
            outlineWidth: 2,
            height: zone.elevation_meters || 10,
            extrudedHeight: (zone.elevation_meters || 10) + 20
          },
          description: `
            <div style="font-family: sans-serif; padding: 6px;">
              <h4 style="color: #06B6D4;">${zone.name}</h4>
              <p><b>Derived Flood Risk:</b> ${floodLevel} (Score: ${telemetry?.derived_flood_risk?.score || 0})</p>
              <p><b>Catchment Drainage Area:</b> ${zone.catchment_area_km2} km²</p>
              <p><b>Drainage Siphon Capacity:</b> ${zone.drainage_capacity_mmh} mm/h</p>
            </div>
          `
        });
      });
    }

  }, [selectedCity, telemetry]);

  const resetCamera = () => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedCity) return;
    const cam = selectedCity.camera;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, cam.height || 10000),
      orientation: {
        heading: Cesium.Math.toRadians(cam.heading || 0),
        pitch: Cesium.Math.toRadians(cam.pitch || -45),
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
            <span className="status-indicator-dot" style={{ backgroundColor: '#10B981' }} />
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
                label={`${telemetry?.traffic?.traffic_level || 'Low'} (${telemetry?.traffic?.current_speed || 38} km/h)`}
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

          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Semantic Vector Layers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 4, backgroundColor: '#10B981', borderRadius: 2 }} />
              <span>Low Risk / Low Congestion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 4, backgroundColor: '#F59E0B', borderRadius: 2 }} />
              <span>Moderate Alert / Congestion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 4, backgroundColor: '#EF4444', borderRadius: 2 }} />
              <span>High Risk / High Congestion</span>
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
          Controls: Left-Drag to Pan | Scroll to Zoom | Right/Middle-Drag to Tilt & Rotate 3D Globe
        </span>
      </div>
    </div>
  );
};
