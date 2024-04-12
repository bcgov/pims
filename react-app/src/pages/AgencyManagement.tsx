import AgencyTable from '@/components/agencies/AgencyTable';
import { Roles } from '@/constants/roles';
import { AuthContext } from '@/contexts/authContext';
import useDataLoader from '@/hooks/useDataLoader';
import usePimsApi from '@/hooks/usePimsApi';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AgencyManagement = () => {
  const navigate = useNavigate();
  // Getting data from API
  const api = usePimsApi();
  const userContext = useContext(AuthContext);
  if (!userContext.keycloak.hasRole([Roles.ADMIN, Roles.AUDITOR], { requireAllRoles: false })) {
    navigate('/');
  }
  const { data, refreshData, isLoading, error } = useDataLoader(api.agencies.getAgenciesWithParent);

  return (
    <AgencyTable
      rowClickHandler={(params) => {
        // Checking length of selection so it only navigates if user isn't trying to select something
        const selection = window.getSelection().toString();
        if (!selection.length) {
          navigate(`/admin/agencies/${params.id}`);
        }
      }}
      data={data}
      refreshData={refreshData}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default AgencyManagement;
