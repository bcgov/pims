import { Box, CircularProgress, Paper, SxProps, useTheme } from '@mui/material';
import React, { createContext, CSSProperties, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import { LatLngBoundsExpression, Map } from 'leaflet';
import MapLayers from '@/components/map/MapLayers';
import { ParcelPopup } from '@/components/map/parcelPopup/ParcelPopup';
import { InventoryLayer } from '@/components/map/InventoryLayer';
import ControlsGroup from '@/components/map/controls/ControlsGroup';
import FilterControl from '@/components/map/controls/FilterControl';
import useDataLoader from '@/hooks/useDataLoader';
import { PropertyGeo } from '@/hooks/api/usePropertiesApi';
import usePimsApi from '@/hooks/usePimsApi';
import { SnackBarContext } from '@/contexts/snackbarContext';

type ParcelMapProps = {
  height: string;
  mapRef?: React.Ref<Map>;
  movable?: boolean;
  zoomable?: boolean;
  loadProperties?: boolean;
  popupSize?: 'small' | 'large';
  scrollOnClick?: boolean;
  zoomOnScroll?: boolean;
  hideControls?: boolean;
} & PropsWithChildren;

export const SelectedMarkerContext = createContext(null);

/**
 * ParcelMap component renders a map with various layers and functionalities.
 *
 * @param {ParcelMapProps} props - The props object containing the height, mapRef, movable, zoomable, and loadProperties properties.
 * @returns {JSX.Element} The ParcelMap component.
 *
 * @example
 * ```tsx
 * <ParcelMap
 *   height="500px"
 *   mapRef={mapRef}
 *   movable={true}
 *   zoomable={true}
 *   loadProperties={false}
 * >
 *   {children}
 * </ParcelMap>
 * ```
 */
const ParcelMap = (props: ParcelMapProps) => {
  const MapEvents = () => {
    useMapEvents({});
    return null;
  };
  const api = usePimsApi();
  const snackbar = useContext(SnackBarContext);

  const [selectedMarker, setSelectedMarker] = useState({
    id: undefined,
    type: undefined,
  });
  const [filter, setFilter] = useState({}); // Applies when request for properties is made
  const [properties, setProperties] = useState<PropertyGeo[]>([]);

  const { data, refreshData, isLoading } = useDataLoader(() =>
    api.properties.propertiesGeoSearch(filter),
  );

  const {
    height,
    mapRef,
    movable = true,
    zoomable = true,
    loadProperties = false,
    popupSize,
    scrollOnClick,
    zoomOnScroll = true,
    hideControls = false,
  } = props;

  const defaultBounds = [
    [54.2516, -129.371],
    [49.129, -117.203],
  ];

  // Get the property data for mapping
  useEffect(() => {
    if (data) {
      if (data.length) {
        setProperties(data as PropertyGeo[]);
        snackbar.setMessageState({
          open: true,
          text: `${data.length} properties found.`,
          style: snackbar.styles.success,
        });
      } else {
        snackbar.setMessageState({
          open: true,
          text: `No properties found matching filter criteria.`,
          style: snackbar.styles.warning,
        });
        setProperties([]);
      }
    } else {
      refreshData();
    }
  }, [data, isLoading]);

  // Refresh the data if the filter changes
  useEffect(() => {
    refreshData();
  }, [filter]);

  interface MapSidebarProps {
    properties: PropertyGeo[];
  }

  const MapSidebar = (props: MapSidebarProps) => {
    const [propertiesInBounds, setPropertiesInBounds] = useState<PropertyGeo[]>([]);
    const [open, setOpen] = useState<boolean>(true);
    const { properties } = props;
    const map = useMap();
    const theme = useTheme();

    const definePropertiesInBounds = () => {
      if (properties && properties.length) {
        const newBounds = map.getBounds();
        setPropertiesInBounds(
          properties.filter((property) =>
            newBounds.contains([
              property.geometry.coordinates[1],
              property.geometry.coordinates[0],
            ]),
          ),
        );
      }
    };

    useMapEvents({
      zoomend: definePropertiesInBounds,
      moveend: definePropertiesInBounds,
    });

    const sidebarOpenStyle: SxProps = {
      transition: 'all 1s',
    }

    const sidebarClosedStyle: SxProps = {
      transition: 'all 1s',
      width: '0px',
    }

    const sidebarStyle = open ? sidebarOpenStyle : sidebarClosedStyle;

    const sidebarButtonOpenStyle: SxProps = {
      transition: 'all 1s',
      right: '-70px'
    }

    const sidebarButtonClosedStyle: SxProps = {
      transition: 'all 1s',
    }

    const sidebarButtonStyle = open ? sidebarButtonOpenStyle : sidebarButtonClosedStyle;

    return (<>
      <Box
        id="map-sidebar"
        zIndex={1000}
        position={'absolute'}
        right={0}
        height={'100%'}
        component={Paper}
        width={'400px'}
        sx={{
         ...sidebarStyle
        }}
        onClick={() => setOpen(!open)}
      >
        {propertiesInBounds.slice(0, 10).map((property) => (
          <Box
            key={`${property.properties.PropertyTypeId ? 'Building' : 'Land'}-${property.properties.Id}`}
          >
            {property.properties.Id}
          </Box>
        ))}
      </Box>
      {/* Sidebar button that is shown when sidebar is closed */}
      <div
        id='sidebar-button'
        style={{
          position: 'absolute',
          top: '15px',
          right: 0,
          width: '70px',
          height: '70px',
          borderTopLeftRadius: '50px',
          borderBottomLeftRadius: '50px',
          backgroundColor: theme.palette.blue.main,
          zIndex: 1001,
          ...sidebarButtonStyle
        } as unknown as CSSProperties}
        onClick={() => setOpen(true)}
      >
        
      </div>
      </>
    );
  };

  return (
    <SelectedMarkerContext.Provider
      value={{
        selectedMarker,
        setSelectedMarker,
      }}
    >
      <Box height={height}>
        <LoadingCover show={isLoading} />
        {/* All map controls fit here */}
        {!hideControls && loadProperties ? (
          <ControlsGroup position="topleft">
            <FilterControl setFilter={setFilter} />
          </ControlsGroup>
        ) : (
          <></>
        )}
        <MapContainer
          style={{ height: '100%' }}
          ref={mapRef}
          bounds={defaultBounds as LatLngBoundsExpression}
          dragging={movable}
          zoomControl={zoomable}
          scrollWheelZoom={zoomOnScroll}
          touchZoom={zoomable}
          boxZoom={zoomable}
          doubleClickZoom={zoomable}
          preferCanvas
        >
          <MapLayers />
          <ParcelPopup size={popupSize} scrollOnClick={scrollOnClick} />
          <MapEvents />
          {loadProperties ? (
            <InventoryLayer isLoading={isLoading} properties={properties} />
          ) : (
            <></>
          )}
          <MapSidebar properties={properties} />
          {props.children}
        </MapContainer>
      </Box>
    </SelectedMarkerContext.Provider>
  );
};
export interface LoadingCoverProps {
  show?: boolean;
}

const LoadingCover: React.FC<LoadingCoverProps> = ({ show }) => {
  return show ? (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: '999',
        left: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        alignContent: 'center',
        justifyItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </div>
  ) : null;
};

export default ParcelMap;
