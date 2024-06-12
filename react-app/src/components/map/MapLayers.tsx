import React from 'react';
import { LayersControl, TileLayer, WMSTileLayer } from 'react-leaflet';
// import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Define URLs and layers
const LAYER_CONFIGS = {
  administrativeBoundaries: [
    {
      name: 'Current Census Economic Regions',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_HUMAN_CULTURAL_ECONOMIC.CEN_ECONOMIC_REGIONS_SVW/ows?',
      layers: 'pub:WHSE_HUMAN_CULTURAL_ECONOMIC.CEN_ECONOMIC_REGIONS_SVW',
    },
    {
      name: 'MOTI Regional Boundaries',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_ADMIN_BOUNDARIES.TADM_MOT_REGIONAL_BNDRY_POLY/ows?',
      layers: 'pub:WHSE_ADMIN_BOUNDARIES.TADM_MOT_REGIONAL_BNDRY_POLY',
    },
    {
      name: 'Municipality Boundaries',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_MUNICIPALITIES_SP',
    },
    {
      name: 'Regional District Boundaries',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.ABMS_REGIONAL_DISTRICTS_SP',
    },
  ],
  firstNations: [
    {
      name: 'First Nations Reserves',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_ADMIN_BOUNDARIES.ADM_INDIAN_RESERVES_BANDS_SP/ows?',
      layers: 'pub:WHSE_ADMIN_BOUNDARIES.ADM_INDIAN_RESERVES_BANDS_SP',
    },
    {
      name: 'First Nation Treaty Areas',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_AREA_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_AREA_SP',
    },
    {
      name: 'First Nations Treaty Lands',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_LAND_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_LAND_SP',
    },
    {
      name: 'First Nations Treaty Related Lands',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_RELATED_LAND_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_RELATED_LAND_S',
    },
    {
      name: 'First Nation Treaty Side Agreements',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_SIDE_AGREEMENTS_SP/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.FNT_TREATY_SIDE_AGREEMENTS_SP',
    },
  ],
  landOwnership: [
    {
      name: 'Crown Leases',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_LEASES_SVW/ows?',
      layers: 'pub:WHSE_TANTALIS.TA_CROWN_LEASES_SVW',
    },
    {
      name: 'Crown Inventory',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_INVENTORY_SVW/ows?',
      layers: 'pub:WHSE_TANTALIS.TA_CROWN_INVENTORY_SVW',
    },
    {
      name: 'Crown Land Licenses',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_TANTALIS.TA_CROWN_LICENSES_SVW/ows?',
      layers: 'pub:WHSE_TANTALIS.TA_CROWN_LICENSES_SVW',
    },
    {
      name: 'Parcel Boundaries',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW/ows',
      layers: 'pub:WHSE_CADASTRE.PMBC_PARCEL_FABRIC_POLY_SVW',
    },
  ],
  zoning: [
    {
      name: 'Zoning',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_LEGAL_ADMIN_BOUNDARIES.OATS_ALR_BOUNDARY_LINES_SVW/ows?',
      layers: 'pub:WHSE_LEGAL_ADMIN_BOUNDARIES.OATS_ALR_BOUNDARY_LINES_SVW',
    },
  ],
  disturbances: [
    {
      name: 'Disturbances',
      url: 'https://openmaps.gov.bc.ca/geo/pub/WHSE_WASTE.SITE_ENV_RMDTN_SITES_SVW/ows?',
      layers: 'pub:WHSE_WASTE.SITE_ENV_RMDTN_SITES_SVW',
    },
  ],
};

const MapLayers = () => (
  <LayersControl position="topright">
    <LayersControl.BaseLayer checked name="Street Map">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </LayersControl.BaseLayer>

    <LayersControl.Overlay name="Administrative Boundaries">
      <div style={{ marginLeft: '10px' }}>
        {LAYER_CONFIGS.administrativeBoundaries.map(({ name, url, layers }) => (
          <LayersControl.Overlay key={name} name={name}>
            <WMSTileLayer
              url={url}
              format="image/png"
              transparent={true}
              layers={layers}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        ))}
      </div>
    </LayersControl.Overlay>

    <LayersControl.Overlay name="First Nations">
      <div style={{ marginLeft: '10px' }}>
        {LAYER_CONFIGS.firstNations.map(({ name, url, layers }) => (
          <LayersControl.Overlay key={name} name={name}>
            <WMSTileLayer
              url={url}
              format="image/png"
              transparent={true}
              layers={layers}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        ))}
      </div>
    </LayersControl.Overlay>

    <LayersControl.Overlay name="Land Ownership">
      <div style={{ marginLeft: '10px' }}>
        {LAYER_CONFIGS.landOwnership.map(({ name, url, layers }) => (
          <LayersControl.Overlay key={name} name={name}>
            <WMSTileLayer
              url={url}
              format="image/png"
              transparent={true}
              layers={layers}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        ))}
      </div>
    </LayersControl.Overlay>

    <LayersControl.Overlay name="Zoning">
      <div style={{ marginLeft: '10px' }}>
        {LAYER_CONFIGS.zoning.map(({ name, url, layers }) => (
          <LayersControl.Overlay key={name} name={name}>
            <WMSTileLayer
              url={url}
              format="image/png"
              transparent={true}
              layers={layers}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        ))}
      </div>
    </LayersControl.Overlay>

    <LayersControl.Overlay name="Disturbances">
      <div style={{ marginLeft: '10px' }}>
        {LAYER_CONFIGS.disturbances.map(({ name, url, layers }) => (
          <LayersControl.Overlay key={name} name={name}>
            <WMSTileLayer
              url={url}
              format="image/png"
              transparent={true}
              layers={layers}
              opacity={0.5}
            />
          </LayersControl.Overlay>
        ))}
      </div>
    </LayersControl.Overlay>
  </LayersControl>
);

/**Using Accordion for layer tree structure**/
// const administrativeBoundaries = LAYER_CONFIGS.administrativeBoundaries;

/* const MapLayers = () => {
  return (
    <>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street Map">
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay name="Administrative Boundaries">
          <Box className="layer-accordion">
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Administrative Boundaries</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box ml={2}>
                  {administrativeBoundaries.map(({ name, url, layers }) => (
                    <LayersControl.Overlay key={name} name={name}>
                      <WMSTileLayer
                        url={url}
                        format="image/png"
                        transparent={true}
                        layers={layers}
                        opacity={0.5}
                      />
                    </LayersControl.Overlay>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </LayersControl.Overlay>
      </LayersControl>
    </>
  );
}; */

export default MapLayers;
