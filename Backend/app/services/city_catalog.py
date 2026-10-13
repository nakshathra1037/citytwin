from typing import List, Optional, Dict
from app.schemas.city import CityMetadata, CameraView, CityCorridor, CityFloodZone, CitySensorNode

CITIES_REGISTRY: Dict[str, CityMetadata] = {
    "coimbatore": CityMetadata(
        id="coimbatore",
        name="Coimbatore",
        state="Tamil Nadu",
        country="India",
        latitude=11.0168,
        longitude=76.9558,
        population=1600000,
        area_km2=246.75,
        timezone="Asia/Kolkata",
        camera=CameraView(
            latitude=11.0168,
            longitude=76.9558,
            height=12500.0,
            heading=15.0,
            pitch=-48.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="cbe-avinashi-rd",
                name="Avinashi Road (NH 544 Express Corridor)",
                coordinates=[
                    [76.9630, 11.0120],
                    [76.9740, 11.0160],
                    [76.9880, 11.0210],
                    [77.0020, 11.0260],
                    [77.0170, 11.0310],
                    [77.0320, 11.0360],
                    [77.0480, 11.0420],
                    [77.0650, 11.0490],
                    [77.0820, 11.0560]
                ],
                length_km=14.2,
                capacity_vph=4800
            ),
            CityCorridor(
                id="cbe-trichy-rd",
                name="Trichy Road (SH 172 Arterial)",
                coordinates=[
                    [76.9630, 10.9990],
                    [76.9740, 10.9980],
                    [76.9890, 10.9970],
                    [77.0050, 10.9970],
                    [77.0220, 10.9960],
                    [77.0420, 10.9940],
                    [77.0600, 10.9910]
                ],
                length_km=11.8,
                capacity_vph=3900
            ),
            CityCorridor(
                id="cbe-sathy-rd",
                name="Sathy Road (NH 209 IT & Academic Corridor)",
                coordinates=[
                    [76.9680, 11.0150],
                    [76.9730, 11.0260],
                    [76.9790, 11.0420],
                    [76.9850, 11.0580],
                    [76.9920, 11.0760],
                    [77.0010, 11.0950],
                    [77.0120, 11.1150]
                ],
                length_km=12.5,
                capacity_vph=3400
            ),
            CityCorridor(
                id="cbe-mettupalayam-rd",
                name="Mettupalayam Road (NH 181)",
                coordinates=[
                    [76.9560, 11.0120],
                    [76.9530, 11.0250],
                    [76.9490, 11.0420],
                    [76.9430, 11.0620],
                    [76.9380, 11.0820],
                    [76.9320, 11.1050]
                ],
                length_km=13.0,
                capacity_vph=3600
            ),
            CityCorridor(
                id="cbe-pollachi-rd",
                name="Pollachi Road (NH 83 South Axis)",
                coordinates=[
                    [76.9590, 10.9920],
                    [76.9600, 10.9780],
                    [76.9620, 10.9610],
                    [76.9630, 10.9450],
                    [76.9650, 10.9250]
                ],
                length_km=10.5,
                capacity_vph=3200
            ),
            CityCorridor(
                id="cbe-100ft-link",
                name="100 Feet Cross Corridor (Gandhipuram - Tatabad)",
                coordinates=[
                    [76.9550, 11.0180],
                    [76.9640, 11.0190],
                    [76.9730, 11.0200]
                ],
                length_km=3.2,
                capacity_vph=2800
            ),
            CityCorridor(
                id="cbe-peelamedu-singanallur-link",
                name="Hope College - Singanallur Link Axis",
                coordinates=[
                    [77.0170, 11.0310],
                    [77.0190, 11.0150],
                    [77.0220, 10.9960]
                ],
                length_km=4.8,
                capacity_vph=2600
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="cbe-valankulam",
                name="Valankulam Urban Wetland Catchment",
                polygon=[
                    [76.9650, 10.9950],
                    [76.9750, 10.9950],
                    [76.9780, 11.0050],
                    [76.9680, 11.0080],
                    [76.9650, 10.9950]
                ],
                elevation_meters=411.0,
                catchment_area_km2=6.8,
                drainage_capacity_mmh=25.0
            ),
            CityFloodZone(
                id="cbe-singanallur",
                name="Singanallur Lake Drainage Basin",
                polygon=[
                    [77.0180, 10.9900],
                    [77.0350, 10.9920],
                    [77.0320, 11.0100],
                    [77.0150, 11.0080],
                    [77.0180, 10.9900]
                ],
                elevation_meters=408.0,
                catchment_area_km2=11.2,
                drainage_capacity_mmh=28.0
            ),
            CityFloodZone(
                id="cbe-noyyal-basin",
                name="Noyyal River Southern Floodplain Corridor",
                polygon=[
                    [76.9400, 10.9750],
                    [76.9800, 10.9800],
                    [77.0200, 10.9780],
                    [77.0150, 10.9680],
                    [76.9450, 10.9650],
                    [76.9400, 10.9750]
                ],
                elevation_meters=402.0,
                catchment_area_km2=18.5,
                drainage_capacity_mmh=32.0
            )
        ],
        sensor_nodes=[
            CitySensorNode(
                id="cbe-aqi-gandhipuram",
                name="CPCB AQI Station - Gandhipuram",
                sensor_type="aqi",
                latitude=11.0175,
                longitude=76.9680,
                elevation_meters=418.0,
                description="Central Continuous Ambient Air Quality Monitoring Station"
            ),
            CitySensorNode(
                id="cbe-aqi-peelamedu",
                name="Urban AQI Sensor - Peelamedu",
                sensor_type="aqi",
                latitude=11.0265,
                longitude=77.0040,
                elevation_meters=422.0,
                description="Educational & Commercial Zone Micro-climate Air Monitor"
            ),
            CitySensorNode(
                id="cbe-aqi-sidco",
                name="SIDCO Industrial AQI Unit - Kurichi",
                sensor_type="aqi",
                latitude=10.9550,
                longitude=76.9620,
                elevation_meters=405.0,
                description="Southern Manufacturing & Industrial Ambient Air Monitor"
            ),
            CitySensorNode(
                id="cbe-weather-airport",
                name="IMD Automated Weather Station - CJB Airport",
                sensor_type="weather",
                latitude=11.0300,
                longitude=77.0434,
                elevation_meters=426.0,
                description="Civil Aviation Meteorological Radar & Telemetry Tower"
            ),
            CitySensorNode(
                id="cbe-weather-tnau",
                name="Agro-Meteorological AWS - TNAU",
                sensor_type="weather",
                latitude=11.0125,
                longitude=76.9350,
                elevation_meters=420.0,
                description="Western Suburban Atmospheric & Solar Radiation Sensor"
            ),
            CitySensorNode(
                id="cbe-flood-valankulam",
                name="Valankulam Siphon Water Gauge",
                sensor_type="flood",
                latitude=11.0010,
                longitude=76.9720,
                elevation_meters=411.0,
                description="Lake Water Depth Ultrasonic Gauge & Siphon Telemetry"
            ),
            CitySensorNode(
                id="cbe-flood-singanallur",
                name="Singanallur Wetland Discharge Weir",
                sensor_type="flood",
                latitude=10.9990,
                longitude=77.0260,
                elevation_meters=408.0,
                description="Inflow Velocity & Siltation Hydrological Sensor"
            ),
            CitySensorNode(
                id="cbe-traffic-gandhipuram",
                name="Gandhipuram Bus Stand Flow Camera",
                sensor_type="traffic",
                latitude=11.0150,
                longitude=76.9660,
                elevation_meters=415.0,
                description="AI Junction Camera with Real-Time Vehicle Classification"
            ),
            CitySensorNode(
                id="cbe-traffic-lakshmi-mills",
                name="Lakshmi Mills Flyover Surveillance Node",
                sensor_type="traffic",
                latitude=11.0210,
                longitude=76.9880,
                elevation_meters=420.0,
                description="Avinashi Road Multi-Tier Flow Radar"
            ),
            CitySensorNode(
                id="cbe-traffic-hope-college",
                name="Hope College Cross Traffic Sensor",
                sensor_type="traffic",
                latitude=11.0310,
                longitude=77.0170,
                elevation_meters=424.0,
                description="High-Speed Corridor Ingress & Congestion Detector"
            )
        ]
    ),
    "chennai": CityMetadata(
        id="chennai",
        name="Chennai",
        state="Tamil Nadu",
        country="India",
        latitude=13.0827,
        longitude=80.2707,
        population=8500000,
        area_km2=426.0,
        timezone="Asia/Kolkata",
        camera=CameraView(
            latitude=13.0827,
            longitude=80.2707,
            height=9500.0,
            heading=0.0,
            pitch=-50.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="chn-anna-salai",
                name="Anna Salai (Mount Road)",
                coordinates=[
                    [80.2750, 13.0800],
                    [80.2580, 13.0550],
                    [80.2350, 13.0300],
                    [80.2150, 13.0100]
                ],
                length_km=14.0,
                capacity_vph=5500
            ),
            CityCorridor(
                id="chn-omr",
                name="Rajiv Gandhi Salai (OMR)",
                coordinates=[
                    [80.2500, 12.9900],
                    [80.2450, 12.9500],
                    [80.2350, 12.9000],
                    [80.2280, 12.8500]
                ],
                length_km=18.5,
                capacity_vph=5000
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="chn-velachery",
                name="Velachery - Pallikaranai Marsh Drainage",
                polygon=[
                    [80.2050, 12.9650],
                    [80.2350, 12.9680],
                    [80.2380, 12.9350],
                    [80.2080, 12.9320],
                    [80.2050, 12.9650]
                ],
                elevation_meters=4.5,
                catchment_area_km2=22.0,
                drainage_capacity_mmh=18.0
            ),
            CityFloodZone(
                id="chn-adyar",
                name="Adyar River Estuary Catchment",
                polygon=[
                    [80.2300, 13.0050],
                    [80.2650, 13.0100],
                    [80.2680, 12.9980],
                    [80.2320, 12.9950],
                    [80.2300, 13.0050]
                ],
                elevation_meters=2.0,
                catchment_area_km2=15.4,
                drainage_capacity_mmh=22.0
            )
        ]
    ),
    "bengaluru": CityMetadata(
        id="bengaluru",
        name="Bengaluru",
        state="Karnataka",
        country="India",
        latitude=12.9716,
        longitude=77.5946,
        population=12000000,
        area_km2=741.0,
        timezone="Asia/Kolkata",
        camera=CameraView(
            latitude=12.9716,
            longitude=77.5946,
            height=11000.0,
            heading=20.0,
            pitch=-46.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="blr-orr-east",
                name="Outer Ring Road (Silk Board to Marathahalli)",
                coordinates=[
                    [77.6250, 12.9180],
                    [77.6550, 12.9250],
                    [77.6850, 12.9380],
                    [77.7000, 12.9550]
                ],
                length_km=12.5,
                capacity_vph=6200
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="blr-bellandur",
                name="Bellandur Valley Lake Basin",
                polygon=[
                    [77.6550, 12.9250],
                    [77.6850, 12.9400],
                    [77.6800, 12.9200],
                    [77.6500, 12.9150],
                    [77.6550, 12.9250]
                ],
                elevation_meters=885.0,
                catchment_area_km2=28.0,
                drainage_capacity_mmh=24.0
            )
        ]
    ),
    "mumbai": CityMetadata(
        id="mumbai",
        name="Mumbai",
        state="Maharashtra",
        country="India",
        latitude=19.0760,
        longitude=72.8777,
        population=14000000,
        area_km2=603.4,
        timezone="Asia/Kolkata",
        camera=CameraView(
            latitude=19.0760,
            longitude=72.8777,
            height=12000.0,
            heading=-10.0,
            pitch=-50.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="mum-weh",
                name="Western Express Highway",
                coordinates=[
                    [72.8450, 19.0550],
                    [72.8520, 19.1000],
                    [72.8580, 19.1550],
                    [72.8620, 19.2100]
                ],
                length_km=25.0,
                capacity_vph=7500
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="mum-mithi",
                name="Mithi River Basin & Kurla Floodplain",
                polygon=[
                    [72.8650, 19.0600],
                    [72.8850, 19.0750],
                    [72.8900, 19.0550],
                    [72.8700, 19.0450],
                    [72.8650, 19.0600]
                ],
                elevation_meters=3.0,
                catchment_area_km2=31.0,
                drainage_capacity_mmh=20.0
            )
        ]
    ),
    "london": CityMetadata(
        id="london",
        name="London",
        state="Greater London",
        country="United Kingdom",
        latitude=51.5074,
        longitude=-0.1278,
        population=8982000,
        area_km2=1572.0,
        timezone="Europe/London",
        camera=CameraView(
            latitude=51.5074,
            longitude=-0.1278,
            height=10000.0,
            heading=0.0,
            pitch=-45.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="ldn-a40",
                name="A40 Westway",
                coordinates=[
                    [-0.1800, 51.5200],
                    [-0.2100, 51.5250],
                    [-0.2450, 51.5230]
                ],
                length_km=8.5,
                capacity_vph=4000
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="ldn-thames-basin",
                name="River Thames Embankment Tidal Flood Zone",
                polygon=[
                    [-0.1300, 51.5050],
                    [-0.0900, 51.5080],
                    [-0.0880, 51.4980],
                    [-0.1280, 51.4950],
                    [-0.1300, 51.5050]
                ],
                elevation_meters=5.0,
                catchment_area_km2=12.0,
                drainage_capacity_mmh=35.0
            )
        ]
    )
}

def get_city_metadata(city_id: str) -> Optional[CityMetadata]:
    normalized_id = city_id.lower().strip()
    return CITIES_REGISTRY.get(normalized_id)

def get_all_cities() -> List[CityMetadata]:
    return list(CITIES_REGISTRY.values())
