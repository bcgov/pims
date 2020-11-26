import * as React from 'react';
import { IProject } from 'features/projects/common/interfaces';
import { Formik, Form, FormikProps } from 'formik';
import ExemptionEnhancedReferralCompleteForm from './ExemptionEnhancedReferralCompleteForm';
import renderer from 'react-test-renderer';
import { noop } from 'lodash';
import { render, fireEvent, act, screen } from '@testing-library/react';
import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { getStore, mockProject as defaultProject } from '../../dispose/testUtils';
import _ from 'lodash';

Enzyme.configure({ adapter: new Adapter() });
const history = createMemoryHistory();
const mockProject = _.cloneDeep(defaultProject);

const element = (func: Function, storeOverride?: any) => (
  <Provider store={storeOverride ?? getStore(mockProject)}>
    <Router history={history}>
      <FormComponent
        values={testProject}
        addToErp={noop}
        onClickGreTransferred={noop}
        onClickNotInSpl={noop}
        onClickProceedToSpl={func}
      />
    </Router>
  </Provider>
);
const testProject: IProject = {
  id: 1,
  projectNumber: 'SPP-10000',
  name: 'LOADING',
  statusId: 15,
  statusCode: 'AP-EXE',
  tierLevelId: 1,
  description: '',
  agencyId: 35,
  netBook: 1,
  market: 1,
  properties: [],
  clearanceNotificationSentOn: new Date(Date.UTC(2020, 5, 9, 8)),
  transferredWithinGreOn: new Date(Date.UTC(2020, 5, 9, 8)),
  note: 'string',
  publicNote: '',
  privateNote: 'string',
  tasks: [],
  fiscalYear: 2021,
  projectAgencyResponses: [],
  notes: [],
};

const FormComponent: React.FC<{
  values: object;
  addToErp: any;
  onClickGreTransferred: any;
  onClickProceedToSpl: any;
  onClickNotInSpl: any;
  formRef?: React.MutableRefObject<FormikProps<any> | undefined>;
}> = props => (
  <Formik
    innerRef={instance => {
      props.formRef && (props.formRef.current = instance);
    }}
    initialValues={props.values}
    onSubmit={values => {}}
  >
    <Form>
      <ExemptionEnhancedReferralCompleteForm
        onClickAddToErp={props.addToErp}
        onClickGreTransferred={props.onClickGreTransferred}
        onClickNotInSpl={props.onClickNotInSpl}
        onClickProceedToSpl={props.onClickProceedToSpl}
      />
    </Form>
  </Formik>
);

describe('ExemptionEnhancedReferralCompleteForm', () => {
  it('renders successfully', () => {
    const tree = renderer
      .create(
        <FormComponent
          values={testProject}
          addToErp={noop}
          onClickGreTransferred={noop}
          onClickNotInSpl={noop}
          onClickProceedToSpl={noop}
        />,
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('disables form buttons when Clearance Notification Date is empty', async () => {
    // need a ref here to change field values programmatically
    const formikRef = React.createRef<FormikProps<any>>();
    const { findByRole } = render(
      <FormComponent
        formRef={formikRef as React.MutableRefObject<FormikProps<any>>}
        values={testProject}
        addToErp={noop}
        onClickGreTransferred={noop}
        onClickNotInSpl={noop}
        onClickProceedToSpl={noop}
      />,
    );

    const findButton = (name: string) => findByRole('button', { name: new RegExp(name, 'i') });
    const setClearanceDate = (value: Date | '') => {
      formikRef?.current?.setFieldValue('clearanceNotificationSentOn', value);
      formikRef?.current?.setFieldValue('requestForSplReceivedOn', value);
    };
    const setTransferredGreDate = (value: Date | '') => {
      formikRef?.current?.setFieldValue('transferredWithinGreOn', value);
    };

    // ASSERT - all 4 buttons should be disabled when clearance notification date is empty
    act(() => {
      setClearanceDate('');
    });

    expect(await findButton('Add to Enhanced Referral Process')).toBeDisabled();
    expect(await findButton('Update Property Information')).toBeDisabled();
    expect(await findButton('Not Included in the SPL')).toBeDisabled();
    expect(await findButton('Proceed to SPL')).toBeDisabled();

    // ASSERT - 3 buttons should be enabled after clearance notification date is set
    act(() => {
      setClearanceDate(new Date(Date.UTC(2020, 5, 9, 8)));
    });

    expect(await findButton('Add to Enhanced Referral Process')).toBeEnabled();
    expect(await findButton('Not Included in the SPL')).toBeEnabled();
    expect(await findButton('Proceed to SPL')).toBeEnabled();

    // ASSERT - GRE button should be enabled ONLY when GRE date set
    expect(await findButton('Update Property Information')).toBeDisabled();

    act(() => {
      setTransferredGreDate(new Date(Date.UTC(2020, 5, 9, 8)));
    });

    expect(await findButton('Update Property Information')).toBeEnabled();
  });

  it('executes onClickGreTransferred callback', async () => {
    const onClickGreTransferred = jest.fn();
    const { getByRole } = render(
      <FormComponent
        values={testProject}
        addToErp={noop}
        onClickGreTransferred={onClickGreTransferred}
        onClickNotInSpl={noop}
        onClickProceedToSpl={noop}
      />,
    );

    const updatePropertiesButton = getByRole('button', { name: /Update Property Information/i });
    fireEvent.click(updatePropertiesButton);
    expect(onClickGreTransferred).toHaveBeenCalledTimes(1);
  });

  it('executes onClickAddToErp callback', async () => {
    const onClickAddToErp = jest.fn();
    const { getByRole } = render(
      <FormComponent
        values={testProject}
        addToErp={onClickAddToErp}
        onClickGreTransferred={noop}
        onClickNotInSpl={noop}
        onClickProceedToSpl={noop}
      />,
    );

    const addToErpButton = getByRole('button', { name: /Add to Enhanced Referral Process/i });
    fireEvent.click(addToErpButton);
    expect(onClickAddToErp).toHaveBeenCalledTimes(1);
  });

  it('executes onClickNotInSpl callback', async () => {
    const onClickNotInSpl = jest.fn();
    const { getByRole } = render(
      <FormComponent
        values={testProject}
        addToErp={noop}
        onClickGreTransferred={noop}
        onClickNotInSpl={onClickNotInSpl}
        onClickProceedToSpl={noop}
      />,
    );

    const notInSplButton = getByRole('button', { name: /Not Included in the SPL/i });
    fireEvent.click(notInSplButton);
    expect(onClickNotInSpl).toHaveBeenCalledTimes(1);
  });

  const splClick = jest.fn();

  // TODO: Need to fix this, can't figure out why they second button never shows up.
  xit('displays confirmation when clicking proceed to spl', async () => {
    const project = _.cloneDeep(mockProject);
    project.clearanceNotificationSentOn = new Date();
    project.requestForSplReceivedOn = new Date();

    const component = render(element(noop, getStore(project)));

    const proceedButton = component.getAllByText(/^Proceed to SPL$/)[0];
    act(() => {
      fireEvent.click(proceedButton);
    });

    await screen.findByText('Really Proceed to SPL?');
    var buttons = component.getAllByText(/^Proceed to SPL$/);
    const reallyProceedButton = buttons[1];

    expect(buttons).toHaveLength(2);
    expect(reallyProceedButton).toBeInTheDocument();
  });

  // TODO: Need to fix this, can't figure out why they second button never shows up.
  xit('calls the appropriate function', async () => {
    const project = _.cloneDeep(mockProject);
    project.clearanceNotificationSentOn = new Date();
    project.requestForSplReceivedOn = new Date();

    const component = render(element(splClick, getStore(project)));

    const proceedButton = component.getAllByText(/^Proceed to SPL$/)[0];
    await act(() => {
      fireEvent.click(proceedButton);
    });

    await screen.findByText('Really Proceed to SPL?');
    const reallyProceedButton = component.getAllByText(/^Proceed to SPL$/)[1];
    act(() => {
      fireEvent.click(reallyProceedButton);
    });

    expect(splClick).toHaveBeenCalledTimes(1);
  });
});
