import PropertyTable from '@/components/property/PropertyTable';
import useDataLoader from '@/hooks/useDataLoader';
import usePimsApi from '@/hooks/usePimsApi';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const ActiveInventory = () => {
  const api = usePimsApi();
  const navigate = useNavigate();
  const {
    data: parcels,
    isLoading: parcelsLoading,
    error: parcelError,
    loadOnce: loadParcels,
  } = useDataLoader(api.parcels.getParcelsWithRelations);
  const {
    data: buildings,
    isLoading: buildingsLoading,
    error: buildingError,
    loadOnce: loadBuildings,
  } = useDataLoader(api.buildings.getBuildings);

  const properties = useMemo(
    () => [
      ...(buildings?.map((b) => ({ ...b, Type: 'Building' })) ?? []),
      ...(parcels?.map((p) => ({ ...p, Type: 'Parcel' })) ?? []),
    ],
    [buildings, parcels],
  );

  const loading = parcelsLoading || buildingsLoading;
  const error = buildingError ?? parcelError;
  const loadAll = () => {
    loadParcels();
    loadBuildings();
  };
  return (
    <PropertyTable
      data={properties}
      isLoading={loading}
      loadData={loadAll}
      rowClickHandler={(params) => {
        if (params.row.Type === 'Building') {
          navigate(`building/${params.row.Id}`);
        } else {
          navigate(`parcel/${params.row.Id}`);
        }
      }}
      error={error}
    />
  );
};

export default ActiveInventory;
