import React from 'react';
import noop from 'lodash/noop';
import { BuildingForm } from '.';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { useKeycloak } from '@react-keycloak/web';
import * as API from 'constants/API';
import { ILookupCode } from 'actions/lookupActions';
import * as reducerTypes from 'constants/reducerTypes';
import { fireEvent, render, wait } from '@testing-library/react';
import pretty from 'pretty';

const mockStore = configureMockStore([thunk]);
const history = createMemoryHistory();

const lCodes = {
  lookupCodes: [
    { name: 'agencyVal', id: '1', isDisabled: false, type: API.AGENCY_CODE_SET_NAME },
    { name: 'disabledAgency', id: '2', isDisabled: true, type: API.AGENCY_CODE_SET_NAME },
    { name: 'roleVal', id: '1', isDisabled: false, type: API.ROLE_CODE_SET_NAME },
    { name: 'disabledRole', id: '2', isDisabled: true, type: API.ROLE_CODE_SET_NAME },
  ] as ILookupCode[],
};

const store = mockStore({
  [reducerTypes.LOOKUP_CODE]: lCodes,
  [reducerTypes.PARCEL]: { parcels: [], draftParcels: [] },
});

jest.mock('@react-keycloak/web');
(useKeycloak as jest.Mock).mockReturnValue({
  keycloak: {
    userInfo: {
      agencies: ['1'],
      roles: ['admin-properties'],
    },
    subject: 'test',
  },
});

const buildingForm = (
  <Provider store={store}>
    <Router history={history}>
      <BuildingForm setMovingPinNameSpace={noop} nameSpace="building" index="0" />
    </Router>
  </Provider>
);

describe('Building Form', () => {
  it('component renders correctly', () => {
    const { container } = render(buildingForm);
    expect(pretty(container.innerHTML)).toMatchSnapshot();
  });

  it('displays identification page on initial load', () => {
    const { getByText } = render(buildingForm);
    expect(getByText(/building identification/i)).toBeInTheDocument();
  });

  it('goes to corresponding steps', async () => {
    const { getByText } = render(buildingForm);
    await wait(() => {
      fireEvent.click(getByText(/continue/i));
    });
    expect(getByText(/Rentable Area/i)).toBeInTheDocument();
    await wait(() => {
      fireEvent.click(getByText(/Continue/i));
    });
    expect(getByText(/Building Valuation Information/i)).toBeInTheDocument();
    await wait(() => {
      fireEvent.click(getByText(/Continue/i));
    });
    expect(getByText(/Review your building info/i)).toBeInTheDocument();
    expect(getByText(/Submit to inventory/i)).toBeInTheDocument();
  });

  it('review has appropriate subforms', async () => {
    const { getByText } = render(buildingForm);
    await wait(() => {
      fireEvent.click(getByText(/Review/i));
    });
    expect(getByText(/Building Identification/i)).toBeInTheDocument();
    expect(getByText(/Transfer lease with land/i)).toBeInTheDocument();
    expect(getByText(/Net Book Value/i)).toBeInTheDocument();
  });
});
