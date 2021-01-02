import * as React from 'react';
import { PropertyTypes, storeDraftParcelsAction } from 'actions/parcelsActions';
import useDeepCompareEffect from 'hooks/useDeepCompareEffect';
import debounce from 'lodash/debounce';
import { useFormikContext } from 'formik';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import { RootState } from 'reducers/rootReducer';
import { PointFeature } from 'components/maps/types';

/**
 * Get a list of draft markers from the current form values.
 * As long as a parcel/building has both a lat and a lng it will be returned by this method.
 * @param values the current form values to extract lat/lngs from.
 */
const getDraftMarkers = (values: any, initialValues: any) => {
  if (
    values.latitude === '' ||
    values.longitude === '' ||
    (values.latitude === initialValues.latitude && values.longitude === initialValues.longitude)
  ) {
    return [];
  }
  return [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [+values.longitude, +values.latitude],
      },
      properties: {
        id: 0,
        name: values.name?.length ? values.name : 'New Parcel',
        propertyTypeId:
          values.parcelId !== undefined ? PropertyTypes.DRAFT_BUILDING : PropertyTypes.DRAFT_PARCEL,
      },
    },
  ];
};

/**
 * A hook that automatically syncs any updates to the lat/lngs of the parcel form with the map.
 * @param param0 The currently displayed list of properties on the map.
 */
const useDraftMarkerSynchronizer = () => {
  const { values, initialValues } = useFormikContext();
  const properties = useSelector<RootState, PointFeature[]>(state => [
    ...state.parcel.draftParcels,
  ]);
  const dispatch = useDispatch();
  const nonDraftProperties = React.useMemo(
    () =>
      properties.filter(
        (property: PointFeature) =>
          property.properties.propertyTypeId !== undefined &&
          [PropertyTypes.BUILDING, PropertyTypes.PARCEL].includes(
            property.properties.propertyTypeId,
          ),
      ),
    [properties],
  );

  React.useEffect(() => {
    return () => {
      dispatch(storeDraftParcelsAction([]));
    };
  }, [dispatch]);

  /**
   * Synchronize the markers that have been updated in the parcel form with the map, adding all new markers as drafts.
   * @param values the current form values
   * @param dbProperties the currently displayed list of (DB) map properties.
   */
  const synchronizeMarkers = (values: any, initialValues: any, dbProperties: PointFeature[]) => {
    const draftMarkers = values.data
      ? getDraftMarkers(values.data, initialValues.data)
      : getDraftMarkers(values, initialValues);
    if (draftMarkers.length) {
      const newDraftMarkers = _.filter(
        draftMarkers,
        (draftMarker: PointFeature) =>
          _.find(
            dbProperties,
            dbProperty =>
              dbProperty.geometry.coordinates[0] === draftMarker.geometry.coordinates[0] &&
              dbProperty.geometry.coordinates[1] === draftMarker.geometry.coordinates[1],
          ) === undefined,
      );
      dispatch(storeDraftParcelsAction(newDraftMarkers as PointFeature[]));
    } else {
      dispatch(storeDraftParcelsAction([]));
    }
  };

  const synchronize = useCallback(
    debounce((values: any, initialValues: any, properties: PointFeature[]) => {
      synchronizeMarkers(values, initialValues, properties);
    }, 400),
    [],
  );

  useDeepCompareEffect(() => {
    synchronize(values, initialValues, nonDraftProperties);
  }, [values, initialValues, nonDraftProperties, synchronize]);

  return;
};

export default useDraftMarkerSynchronizer;
