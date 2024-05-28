import { ConfigContext } from '@/contexts/configContext';
import { useContext } from 'react';
import useFetch from './useFetch';
import useUsersApi from './api/useUsersApi';
import useAgencyApi from './api/useAgencyApi';
import useRolesApi from './api/useRolesApi';
import useReportsApi from '@/hooks/api/useReportsApi';
import useBuildingsApi from './api/useBuildingsApi';
import useParcelsApi from './api/useParcelsApi';
import useLookupApi from './api/useLookupApi';
import useAdministrativeAreaApi from './api/useAdministrativeAreaApi';
import usePropertiesApi from './api/usePropertiesApi';
import useToolsApi from './api/useToolsApi';
import useParcelLayerApi from './api/useParcelLayerApi';
import useProjectsApi from './api/useProjectsApi';
import useLtsaApi from './api/useLtsaApi';

/**
 * usePimsApi - This stores all the sub-hooks we need to make calls to our API and helps manage authentication state for them.
 * @returns
 */
const usePimsApi = () => {
  const config = useContext(ConfigContext);
  const fetch = useFetch(config?.API_HOST);

  const users = useUsersApi(fetch);
  const agencies = useAgencyApi(fetch);
  const roles = useRolesApi(fetch);
  const reports = useReportsApi(fetch);
  const buildings = useBuildingsApi(fetch);
  const parcels = useParcelsApi(fetch);
  const lookup = useLookupApi(fetch);
  const administrativeAreas = useAdministrativeAreaApi(fetch);
  const properties = usePropertiesApi(fetch);
  const tools = useToolsApi(fetch);
  const parcelLayer = useParcelLayerApi(fetch);
  const projects = useProjectsApi(fetch);
  const ltsa = useLtsaApi(fetch);

  return {
    users,
    agencies,
    roles,
    reports,
    buildings,
    parcels,
    lookup,
    administrativeAreas,
    properties,
    tools,
    parcelLayer,
    projects,
    ltsa,
  };
};

export default usePimsApi;
