import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCity } from '../../context/CityContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { StatusPill } from '../common/StatusPill';
import { Activity, Droplets, Car, CloudRain, Shield, Navigation } from 'lucide-react';

export const CesiumViewer = () => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const { selectedCity } = useCity();
  const { telemetry } = useTelemetry();

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Suppress default Cesium Ion warning if token not provided
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZWZhdWx0LXRva2VuIiwiaWQiOjIwMjYsInNjb3BlcyI6WyJhc3NldHM6cmVhZCJdfQ.test';

    let viewer;
    try {
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
        imageryProvider: new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/'
        })
      });

      // Enable depth test for terrain/polygons
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.globe.enableLighting = true;
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
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#06B6D4'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      },
      description: `
        <div style="font-family: sans-serif; padding: 6px;">
          <h3>${selectedCity.name}</h3>
          <p>State: ${selectedCity.state}, ${selectedCity.country}</p>
          <p>Population: ${selectedCity.population?.toLocaleString()}</p>
          <p>Area: ${selectedCity.area_km2} km²</p>
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
          flatCoords.push(lon, lat, 20);
        });

        viewer.entities.add({
          name: `Arterial Corridor: ${corr.name}`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
            width: 7,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              taperPower: 1,
              color: corridorColor
            }),
            clampToGround: true
          },
          description: `
            <div style="font-family: sans-serif; padding: 6px;">
              <h4>${corr.name}</h4>
              <p>Length: ${corr.length_km} km</p>
              <p>Traffic Congestion Status: <b>${trafficLevel}</b></p>
              <p>Capacity: ${corr.capacity_vph} vehicles/hour</p>
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
            outlineColor: floodColor.withAlpha(0.9),
            outlineWidth: 2,
            height: zone.elevation_meters || 10,
            extrudedHeight: (zone.elevation_meters || 10) + 15
          },
          description: `
            <div style="font-family: sans-serif; padding: 6px;">
              <h4>${zone.name}</h4>
              <p>Derived Flood Risk: <b>${floodLevel}</b> (Score: ${telemetry?.derived_flood_risk?.score || 0})</p>
              <p>Catchment Area: ${zone.catchment_area_km2} km²</p>
              <p>Drainage Capacity: ${zone.drainage_capacity_mmh} mm/h</p>
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
                {telemetry?.weather?.temperature ?? '—'}°C ({telemetry?.weather?.weather_condition ?? 'Normal'})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Car size={14} color="#F59E0B" /> Traffic Level:
              </span>
              <StatusPill 
                level={telemetry?.traffic?.traffic_level || 'Low'} 
                label={`${telemetry?.traffic?.traffic_level || 'Low'} (${telemetry?.traffic?.current_speed || 40} km/h)`}
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

        {/* Legend Panel */}
        <div className="twin-hud-panel" style={{ fontSize: '11px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Semantic Map Layers
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
          Controls: Left-Click to Pan | Right-Click/Wheel to Zoom | Middle-Click to Tilt/Rotate
        </span>
      </div>
    </div>
  );
};
