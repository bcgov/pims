import { ISteppedFormValues, SteppedForm, useFormStepper } from 'components/common/form/StepForm';
import { defaultInformationFormValues } from 'features/properties/components/forms/subforms/InformationForm';
import { useFormikContext, yupToFormErrors } from 'formik';
import { IGeocoderResponse, useApi } from 'hooks/useApi';
import useKeycloakWrapper from 'hooks/useKeycloakWrapper';
import useCodeLookups from 'hooks/useLookupCodes';
import { noop } from 'lodash';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';
import { InventoryPolicy } from '../components/InventoryPolicy';
import * as API from 'constants/API';
import { defaultAddressValues } from 'features/properties/components/forms/subforms/AddressForm';
import { ParcelIdentificationForm } from './subforms/ParcelIdentificationForm';
import { LandUsageForm } from './subforms/LandUsageForm';
import { LandReviewPage } from './subforms/LandReviewPage';
import { defaultPidPinFormValues } from 'features/properties/components/forms/subforms/PidPinForm';
import { defaultLandValues } from 'features/properties/components/forms/subforms/LandForm';
import {
  defaultFinancials,
  filterEmptyFinancials,
  IFinancial,
  IFinancialYear,
} from 'features/properties/components/forms/subforms/EvaluationForm';
import { EvaluationKeys } from 'constants/evaluationKeys';
import { FiscalKeys } from 'constants/fiscalKeys';
import _ from 'lodash';
import { useDispatch } from 'react-redux';
import {
  ParcelSchema,
  LandIdentificationSchema,
  LandUsageSchema,
  LandValuationSchema,
} from 'utils/YupSchema';
import { createParcel, updateParcel } from 'actionCreators/parcelsActionCreator';
import { LandValuationForm } from './subforms/LandValuationForm';
import { LandSteps } from 'constants/propertySteps';
import useDraftMarkerSynchronizer from 'features/properties/hooks/useDraftMarkerSynchronizer';
import { IFormParcel } from '../containers/MapSideBarContainer';
import useParcelLayerData from 'features/properties/hooks/useParcelLayerData';

const Container = styled.div`
  background-color: #fff;
  height: 100%;
  width: 100%;
  overflow-y: auto;
`;

const FormContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  margin-bottom: 50px;
`;

const FormContent = styled.div`
  border-top: 1px solid #666666;
  width: 100%;
  min-height: 100px;
`;

const FormFooter = styled.div`
  display: flex;
  width: 100%;
  height: 70px;
  align-items: center;
`;

const FillRemainingSpace = styled.span`
  flex: 1 1 auto;
`;

/**
 * Create formiks initialValues by stitching together the default values provided by each subform.
 */
export const getInitialValues = (): any => {
  return {
    ...defaultPidPinFormValues,
    ...defaultLandValues,
    ...defaultInformationFormValues,
    latitude: '',
    longitude: '',
    address: defaultAddressValues,
    buildings: [],
    financials: defaultFinancials,
    searchPid: '',
    searchPin: '',
    searchAddress: '',
  };
};

/**
 * Do an in place conversion of all values to their expected API equivalents (eg. '' => undefined)
 * @param values the parcel value to convert.
 */
export const valuesToApiFormat = (values: ISteppedFormValues<IFormParcel>): IFormParcel => {
  values.data.pin = values?.data.pin ? values.data.pin : undefined;
  values.data.pid = values?.data.pid ? values.data.pid : undefined;
  const seperatedFinancials = (_.flatten(
    values.data.financials?.map((financial: IFinancialYear) => _.values(financial)),
  ) ?? []) as IFinancial[];
  const allFinancials = filterEmptyFinancials(seperatedFinancials);

  values.data.evaluations = _.filter(allFinancials, financial =>
    Object.keys(EvaluationKeys).includes(financial.key),
  );
  values.data.fiscals = _.filter(allFinancials, financial =>
    Object.keys(FiscalKeys).includes(financial.key),
  );
  values.data.landArea = +values.data.landArea;
  values.data.financials = [];
  if ((values.data.agencyId as any)?.value) {
    values.data.agencyId = +(values.data.agencyId as any).value;
  }
  return values.data;
};

const Form: React.FC<ILandForm> = ({
  handleGeocoderChanges,
  setMovingPinNameSpace,
  handlePidChange,
  handlePinChange,
  formikRef,
  isAdmin,
}) => {
  // access the stepper to later split the form into segments
  const stepper = useFormStepper();
  const formikProps = useFormikContext<ISteppedFormValues<IFormParcel>>();
  useParcelLayerData({
    formikRef,
    nameSpace: 'data',
    agencyId: +formikProps.values.data.agencyId,
  });

  // lookup codes that will be used by subforms
  const { getOptionsByType } = useCodeLookups();
  const agencies = getOptionsByType(API.AGENCY_CODE_SET_NAME);
  const classifications = getOptionsByType(API.PROPERTY_CLASSIFICATION_CODE_SET_NAME);
  useDraftMarkerSynchronizer();

  const render = (): React.ReactNode => {
    switch (stepper.current) {
      case LandSteps.IDENTIFICATION:
        return (
          <div className="parcel-identification">
            <ParcelIdentificationForm
              agencies={agencies}
              classifications={classifications}
              handleGeocoderChanges={handleGeocoderChanges}
              setMovingPinNameSpace={setMovingPinNameSpace}
              handlePidChange={handlePidChange}
              handlePinChange={handlePinChange}
              isAdmin={isAdmin}
              nameSpace="data"
            />
          </div>
        );
      case LandSteps.USAGE:
        return (
          <div className="parcel-usage">
            <LandUsageForm classifications={classifications} nameSpace="data" {...formikProps} />
          </div>
        );
      case LandSteps.VALUATION:
        return <LandValuationForm title="Bare Land Valuation" nameSpace="data" />;
      case LandSteps.REVIEW:
        return (
          <LandReviewPage
            classifications={classifications}
            agencies={agencies}
            handlePidChange={handlePidChange}
            handlePinChange={handlePinChange}
            nameSpace="data"
          />
        );
    }
  };
  return (
    <FormContentWrapper>
      <FormContent>{render()}</FormContent>
      <FormFooter>
        <InventoryPolicy />
        <FillRemainingSpace />
        {stepper.current !== 3 && (
          <Button
            type="button"
            onClick={() => {
              if (!stepper.validateCurrentStep()) {
                return;
              }
              stepper.gotoNext();
            }}
            size="sm"
          >
            Continue
          </Button>
        )}
        {formikProps.dirty && formikProps.isValid && stepper.current === 3 && (
          <Button size="sm" type="submit">
            Submit Raw Land
          </Button>
        )}
      </FormFooter>
    </FormContentWrapper>
  );
};

interface ILandForm {
  /** pass the formikRef on to other components */
  formikRef?: any;
  /** to autopopulate fields based on Geocoder information */
  handleGeocoderChanges: (data: IGeocoderResponse) => Promise<void>;
  /** to change the user's cursor when adding a marker */
  setMovingPinNameSpace: (nameSpace: string) => void;
  /** to autopopulate fields based on Geocoder information */
  handlePidChange: (pid: string) => void;
  /** help with formatting of the pin */
  handlePinChange: (pin: string) => void;
  /** whether or not this user has admin priviledges */
  isAdmin: boolean;
}

interface IParentLandForm extends ILandForm {
  /** signal the parent that the associated land process has been completed. */
  setLandComplete: (show: boolean) => void;
}

/**
 * A component used for submitting bare land.
 * This form will appear after selecting 'Add Bare Land' after navigating to Manage Property > Submit Property in PIMS
 * @component
 */

const LandForm: React.FC<IParentLandForm> = (props: IParentLandForm) => {
  const keycloak = useKeycloakWrapper();
  const dispatch = useDispatch();
  const api = useApi();
  let initialValues = {
    activeStep: 0,
    activeTab: 0,
    data: getInitialValues(),
  };

  initialValues.data.agencyId = keycloak.agencyId;

  /**
   * Combines yup validation with manual validation of financial data for performance reasons.
   * Large forms can take 3-4 seconds to validate with an all-yup validation schema.
   * This validation is significantly faster.
   * @param values formik form values to validate.
   */
  const handleValidate = async (values: ISteppedFormValues<IFormParcel>) => {
    const yupErrors: any = ParcelSchema.validate(values.data, { abortEarly: false }).then(
      () => ({}),
      (err: any) => yupToFormErrors(err),
    );

    let pidDuplicated = false;
    if (values.data.pid && initialValues.data.pid !== values.data.pid && !values.data.id) {
      pidDuplicated = !(await isPidAvailable(values.data));
    }

    let pinDuplicated = false;
    if (
      values.data.pin &&
      initialValues.data.pin !== values.data.pin &&
      values.data.pin.toString().length < 10 &&
      !values.data.id
    ) {
      pinDuplicated = !(await isPinAvailable(values.data));
    }

    let errors = await yupErrors;
    if (pidDuplicated) {
      errors = { ...errors, pid: 'This PID is already in use.' };
    }
    if (pinDuplicated) {
      errors = { ...errors, pin: 'This PIN is already in use.' };
    }
    return Promise.resolve(errors);
  };

  const isPidAvailable = async (values: IFormParcel): Promise<boolean> => {
    const response = await api.isPidAvailable(values.id, values.pid);
    return response?.available;
  };

  const isPinAvailable = async (values: IFormParcel): Promise<boolean> => {
    const response = await api.isPinAvailable(values.id, values.pin);
    return response?.available;
  };

  return (
    <Container className="landForm">
      <SteppedForm
        // Provide the steps
        steps={[
          {
            route: 'identification',
            title: 'Parcel ID',
            completed: false,
            canGoToStep: true,
            validation: { schema: LandIdentificationSchema, nameSpace: () => 'data' },
          },
          {
            route: 'usage',
            title: 'Usage',
            completed: false,
            canGoToStep: false,
            validation: { schema: LandUsageSchema, nameSpace: () => 'data' },
          },
          {
            route: 'valuation',
            title: 'Valuation',
            completed: false,
            canGoToStep: false,
            validation: { schema: LandValuationSchema, nameSpace: () => 'data' },
          },
          {
            route: 'review',
            title: 'Review',
            completed: false,
            canGoToStep: false,
            validation: { schema: ParcelSchema, nameSpace: () => 'data' },
          },
        ]}
        persistable={true}
        persistProps={{
          name: 'land',
          secret: keycloak.obj.subject,
          persistCallback: noop,
        }}
        initialValues={initialValues}
        validate={handleValidate}
        formikRef={props.formikRef}
        onSubmit={async (values, actions) => {
          const apiValues = valuesToApiFormat(_.cloneDeep(values));
          try {
            if (!values.data.id) {
              await createParcel(apiValues)(dispatch);
            } else {
              await updateParcel(apiValues)(dispatch);
            }
            props.setLandComplete(true);
          } catch (error) {
          } finally {
            actions.setSubmitting(false);
          }
        }}
      >
        <Form
          setMovingPinNameSpace={props.setMovingPinNameSpace}
          handleGeocoderChanges={props.handleGeocoderChanges}
          handlePidChange={props.handlePidChange}
          handlePinChange={props.handlePinChange}
          isAdmin={props.isAdmin}
          formikRef={props.formikRef}
        />
      </SteppedForm>
    </Container>
  );
};
export default LandForm;
