from typing import List, Optional, Dict
from app.schemas.city import CityMetadata, CameraView, CityCorridor, CityFloodZone

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
            height=8500.0,
            heading=15.0,
            pitch=-48.0,
            roll=0.0
        ),
        primary_corridors=[
            CityCorridor(
                id="cbe-avinashi-rd",
                name="Avinashi Road (NH 544)",
                coordinates=[
                    [76.9600, 11.0080],
                    [76.9800, 11.0180],
                    [77.0100, 11.0300],
                    [77.0450, 11.0420],
                    [77.0700, 11.0550]
                ],
                length_km=14.2,
                capacity_vph=4500
            ),
            CityCorridor(
                id="cbe-trichy-rd",
                name="Trichy Road (SH 172)",
                coordinates=[
                    [76.9650, 11.0010],
                    [76.9850, 11.0000],
                    [77.0200, 10.9980],
                    [77.0550, 10.9920]
                ],
                length_km=11.8,
                capacity_vph=3800
            ),
            CityCorridor(
                id="cbe-sathy-rd",
                name="Sathy Road (NH 209)",
                coordinates=[
                    [76.9680, 11.0150],
                    [76.9800, 11.0400],
                    [76.9950, 11.0750],
                    [77.0100, 11.1000]
                ],
                length_km=12.5,
                capacity_vph=3200
            ),
            CityCorridor(
                id="cbe-mettupalayam-rd",
                name="Mettupalayam Road (NH 181)",
                coordinates=[
                    [76.9550, 11.0100],
                    [76.9450, 11.0350],
                    [76.9380, 11.0700],
                    [76.9300, 11.1100]
                ],
                length_km=13.0,
                capacity_vph=3500
            )
        ],
        flood_catchments=[
            CityFloodZone(
                id="cbe-valankulam",
                name="Valankulam Catchment & Low Basin",
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
                name="Singanallur Wetland Drainage Zone",
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
                name="Noyyal River Southern Floodplain",
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
