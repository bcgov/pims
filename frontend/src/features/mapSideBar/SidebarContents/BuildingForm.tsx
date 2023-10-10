import variables from '_variables.module.scss';
import './BuildingForm.scss';
import { IBuilding } from 'actions/parcelsActions';
import {
  ISteppedFormValues,
  IStepperTab,
  SteppedForm,
  useFormStepper,
} from 'components/common/form/StepForm';
import { IStep } from 'components/common/Stepper';
import TooltipWrapper from 'components/common/TooltipWrapper';
import { fireMapRefreshEvent } from 'components/maps/hooks/useMapRefreshEvent';
import * as API from 'constants/API';
import { EvaluationKeys } from 'constants/evaluationKeys';
import { FiscalKeys } from 'constants/fiscalKeys';
import { BuildingSteps } from 'constants/propertySteps';
import { defaultAddressValues } from 'features/properties/components/forms/subforms/AddressForm';
import DebouncedValidation from 'features/properties/components/forms/subforms/DebouncedValidation';
import {
  filterEmptyFinancials,
  getMergedFinancials,
} from 'features/properties/components/forms/subforms/EvaluationForm';
import LastUpdatedBy from 'features/properties/components/LastUpdatedBy';
import useDraftMarkerSynchronizer from 'features/properties/hooks/useDraftMarkerSynchronizer';
import useParcelLayerData from 'features/properties/hooks/useParcelLayerData';
import { useFormikContext, yupToFormErrors } from 'formik';
import useKeycloakWrapper from 'hooks/useKeycloakWrapper';
import useCodeLookups from 'hooks/useLookupCodes';
import { noop } from 'lodash';
import _ from 'lodash';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import { useAppDispatch } from 'store';
import styled from 'styled-components';
import { stringToNull } from 'utils';
import {
  BuildingInformationSchema,
  BuildingSchema,
  OccupancySchema,
  ValuationSchema,
} from 'utils/YupSchema';

import { InventoryPolicy } from '../components/InventoryPolicy';
import { useBuildingApi } from '../hooks/useBuildingApi';
import { BuildingForm } from '.';
import { valuesToApiFormat as landValuesToApiFormat } from './LandForm';
import { BuildingReviewPage } from './subforms/BuildingReviewPage';
import { BuildingValuationForm } from './subforms/BuildingValuationForm';
import { IdentificationForm } from './subforms/IdentificationForm';
import { OccupancyForm } from './subforms/OccupancyForm';

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
  margin-bottom: 20px;
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
  position: sticky;
  background-color: ${variables.filterBackgroundColor};
  bottom: -20px;
`;

const FillRemainingSpace = styled.span`
  flex: 1 1 auto;
`;

export const defaultBuildingValues: IBuilding = {
  id: '',
  isSensitive: '',
  name: '',
  projectNumbers: [],
  description: '',
  address: defaultAddressValues,
  latitude: '',
  longitude: '',
  agencyId: 0,
  parcelId: 0,
  rentableArea: '',
  totalArea: '',
  buildingFloorCount: '',
  buildingConstructionType: undefined,
  buildingConstructionTypeId: '',
  buildingPredominateUse: undefined,
  buildingPredominateUseId: '',
  classificationId: '',
  classification: '',
  buildingOccupantType: undefined,
  buildingOccupantTypeId: '',
  transferLeaseOnSale: false,
  occupantName: '',
  leaseExpiry: '',
  buildingTenancy: '',
  buildingTenancyUpdatedOn: '',
  evaluations: [],
  fiscals: [],
  parcels: [],
  pid: '',
  encumbranceReason: '',
  agency: '',
  agencyCode: '',
  assessedBuilding: '',
  assessedLand: '',
};

/**
 * A component used for submitting standalone buildings or buildings grouped with land.
 * This form will appear after selecting 'Add Building' after navigating to Manage Property > Submit Property in PIMS
 * @component
 */
const Form: React.FC<IBuildingForm> = ({
  isPropertyAdmin,
  setMovingPinNameSpace,
  nameSpace,
  disabled,
  goToAssociatedLand,
  formikRef,
  buildingData,
}) => {
  const stepper = useFormStepper();
  useDraftMarkerSynchronizer('data');
  const formikProps = useFormikContext<ISteppedFormValues<IBuilding>>();
  useParcelLayerData({
    formikRef,
    nameSpace: 'data',
    agencyId: +(formikProps.values.data.agencyId as any)?.value
      ? +(formikProps.values.data.agencyId as any).value
      : +formikProps.values.data.agencyId,
  });
  const { getOptionsByType, getPropertyClassificationOptions } = useCodeLookups();
  const isViewOrUpdate = !!formikProps.values?.data?.id;

  const agencies = getOptionsByType(API.AGENCY_CODE_SET_NAME);
  const classifications = getPropertyClassificationOptions();
  const predominateUses = getOptionsByType(API.PREDOMINATE_USE_CODE_SET_NAME);
  const constructionType = getOptionsByType(API.CONSTRUCTION_CODE_SET_NAME);
  const occupancyType = getOptionsByType(API.OCCUPANT_TYPE_CODE_SET_NAME);

  const render = (): React.ReactNode => {
    switch (stepper.current) {
      case BuildingSteps.IDENTIFICATION:
        return (
          <div className="identification">
            <IdentificationForm
              formikProps={formikProps}
              constructionType={constructionType}
              predominateUses={predominateUses}
              classifications={classifications}
              agencies={agencies}
              setMovingPinNameSpace={setMovingPinNameSpace}
              nameSpace={nameSpace}
              isPropertyAdmin={isPropertyAdmin}
              disabled={disabled}
            />
          </div>
        );
      case BuildingSteps.TENANCY:
        return (
          <OccupancyForm formikProps={formikProps} nameSpace={nameSpace} disabled={disabled} />
        );
      case BuildingSteps.VALUATION:
        return (
          <BuildingValuationForm
            nameSpace={nameSpace}
            formikProps={formikProps}
            disabled={disabled}
          />
        );
      case BuildingSteps.REVIEW:
        return (
          <BuildingReviewPage
            classifications={classifications}
            agencies={agencies}
            occupantTypes={occupancyType}
            predominateUses={predominateUses}
            constructionType={constructionType}
            nameSpace={nameSpace}
            disabled={disabled}
            isPropertyAdmin={isPropertyAdmin}
          />
        );
    }
  };

  return (
    <FormContentWrapper>
      <DebouncedValidation formikProps={formikProps}></DebouncedValidation>
      <FormContent>{render()}</FormContent>
      <FormFooter>
        <InventoryPolicy />
        <LastUpdatedBy
          createdOn={buildingData?.createdOn}
          updatedOn={buildingData?.updatedOn}
          updatedByName={buildingData?.updatedByName}
          updatedByEmail={buildingData?.updatedByEmail}
        />
        <FillRemainingSpace />
        {!stepper.isSubmit(stepper.current) && (
          <Button style={{ marginRight: 10 }} size="sm" onClick={() => stepper.gotoNext()}>
            Continue
          </Button>
        )}
        {stepper.isSubmit(stepper.current) && !disabled && (
          <>
            {isViewOrUpdate ? (
              <>
                <TooltipWrapper
                  toolTipId="modify-associated-land-tooltip"
                  toolTip="Add/Remove or Edit land associated to this building"
                >
                  <Button
                    variant="secondary"
                    className="mr-2"
                    onClick={() => goToAssociatedLand(formikProps.values.data)}
                  >
                    Modify Associated Land
                  </Button>
                </TooltipWrapper>
                <TooltipWrapper
                  toolTipId="submit-building-to-inventory-tooltip"
                  toolTip="Save any changes you've made"
                >
                  <Button
                    disabled={formikProps.isSubmitting}
                    size="sm"
                    type="button"
                    onClick={() => {
                      formikProps.setSubmitting(true);
                      formikProps.submitForm();
                    }}
                  >
                    Save Updates
                  </Button>
                </TooltipWrapper>
              </>
            ) : (
              <Button
                disabled={formikProps.isSubmitting}
                size="sm"
                type="button"
                style={{ marginRight: '15px' }}
                onClick={() => {
                  formikProps.setSubmitting(true);
                  formikProps.submitForm();
                }}
              >
                Submit
              </Button>
            )}
          </>
        )}
      </FormFooter>
    </FormContentWrapper>
  );
};

interface IBuildingForm {
  /** to pass the formik ref */
  formikRef?: any;
  /** to change the user's cursor when adding a marker */
  setMovingPinNameSpace: (nameSpace?: string) => void;
  /** to help determine the namespace of the field (eg. address.line1) */
  nameSpace: string;
  /** Go to the associated land form directly */
  goToAssociatedLand: (building: IBuilding) => void;
  /** to determine whether certain locked fields can be editable */
  isPropertyAdmin?: boolean;
  /** whether this form can be interacted with */
  disabled?: boolean;
  /** the initial values of this form, as loaded from the api */
  buildingData?: IBuilding;
}

interface IParentBuildingForm extends IBuildingForm {
  /** the initial values of this form, as loaded from the api */
  initialValues?: IBuilding;
  /** Notify the parent that the building has been saved, potentially starting a new workflow. */
  setBuildingToAssociateLand: (building: IBuilding) => void;
}

/**
 * A wrapper around the landform that provides all expected props for the landform to be used in read-only mode.
 * This sets all the fields to disabled and disables all actions triggered by interacting with the forms.
 * It also disables form validation and submission.
 * @component
 */
export const ViewOnlyBuildingForm: React.FC<Partial<IParentBuildingForm>> = (props: {
  formikRef?: any;
  initialValues?: IBuilding;
}) => {
  return (
    <BuildingForm
      setMovingPinNameSpace={noop}
      goToAssociatedLand={noop}
      formikRef={props.formikRef}
      isPropertyAdmin={false}
      setBuildingToAssociateLand={noop}
      initialValues={props.initialValues ?? ({} as any)}
      disabled={true}
      nameSpace="data"
    />
  );
};

/**
 * Do an in place conversion of all values to their expected API equivalents (eg. '' => undefined)
 * @param values the building value to convert.
 */
export const valuesToApiFormat = (values: ISteppedFormValues<IBuilding>): IBuilding => {
  const apiValues = _.cloneDeep(values);
  apiValues.data.parcels = values.data.parcels.map((formParcel) =>
    landValuesToApiFormat({ data: formParcel } as any),
  );
  apiValues.data.evaluations = filterEmptyFinancials(apiValues.data.evaluations);
  apiValues.data.fiscals = filterEmptyFinancials(apiValues.data.fiscals);
  apiValues.data.classificationId = +apiValues.data.classificationId;
  apiValues.data.buildingOccupantTypeId = undefined as any;
  apiValues.data.rentableArea = +apiValues.data.rentableArea;
  apiValues.data.buildingFloorCount = +(apiValues.data.buildingFloorCount ?? 0);
  apiValues.data.agencyId = +values.data.agencyId;
  apiValues.data.leaseExpiry = stringToNull(apiValues.data.leaseExpiry);
  apiValues.data.buildingTenancyUpdatedOn = stringToNull(apiValues.data.buildingTenancyUpdatedOn);
  apiValues.data.id = stringToNull(apiValues.data.id);
  return apiValues.data;
};

const BuidingForm: React.FC<IParentBuildingForm> = ({
  setMovingPinNameSpace,
  nameSpace,
  isPropertyAdmin,
  formikRef,
  setBuildingToAssociateLand,
  goToAssociatedLand,
  disabled,
  ...rest
}) => {
  const keycloak = useKeycloakWrapper();
  const dispatch = useAppDispatch();
  const { createBuilding, updateBuilding } = useBuildingApi();
  const withNameSpace: Function = React.useCallback(
    (name?: string) => {
      return [nameSpace ?? '', name].filter((x) => x).join('.');
    },
    [nameSpace],
  );
  const isViewOrUpdate = !!rest.initialValues?.id;
  const steps: IStep[] = [
    {
      route: 'building-id',
      title: 'Building Info',
      completed: false,
      canGoToStep: true,
      validation: disabled
        ? undefined
        : { schema: BuildingInformationSchema, nameSpace: () => 'data' },
    },
    {
      route: 'tenancy',
      title: 'Occupancy',
      completed: false,
      canGoToStep: isViewOrUpdate || !!disabled,
      validation: disabled ? undefined : { schema: OccupancySchema, nameSpace: () => 'data' },
    },
    {
      route: 'valuation',
      title: 'Valuation',
      completed: false,
      canGoToStep: isViewOrUpdate || !!disabled,
      validation: disabled ? undefined : { schema: ValuationSchema, nameSpace: () => 'data' },
    },
    {
      route: 'review',
      title: 'Review & Submit',
      completed: false,
      canGoToStep: isViewOrUpdate || !!disabled,
      validation: disabled ? undefined : { schema: BuildingSchema, nameSpace: () => 'data' },
    },
  ];

  const initialValues = {
    activeStep: rest.initialValues?.id ? steps.length - 1 : 0,
    activeTab: 0,
    data: {
      ...defaultBuildingValues,
      ...rest.initialValues,
      evaluations: getMergedFinancials(
        rest.initialValues?.evaluations ?? [],
        Object.values(EvaluationKeys),
      ),
      fiscals: getMergedFinancials(rest.initialValues?.fiscals ?? [], Object.values(FiscalKeys)),
    },
  };

  initialValues.data.agencyId = initialValues.data.agencyId
    ? initialValues.data.agencyId
    : keycloak.agencyId ?? '';

  /**
   * Combines yup validation with manual validation of financial data for performance reasons.
   * Large forms can take 3-4 seconds to validate with an all-yup validation schema.
   * This validation is significantly faster.
   * @param values formik form values to validate.
   */
  const handleValidate = async (values: ISteppedFormValues<IBuilding>) => {
    const yupErrors: any = BuildingSchema.validate(values.data, { abortEarly: false }).then(
      () => ({}),
      (err: any) => yupToFormErrors(err),
    );

    const errors = await yupErrors;
    return Object.keys(errors).length ? Promise.resolve({ data: errors }) : Promise.resolve({});
  };
  return (
    <Container className="buildingForm">
      <SteppedForm
        // Provide the steps
        steps={steps}
        persistable={!disabled}
        persistProps={{
          name: isViewOrUpdate ? 'updated-building' : 'building',
          secret: keycloak.obj.subject,
          persistCallback: (values: ISteppedFormValues<IBuilding>) => {
            const newValues: ISteppedFormValues<IBuilding> = {
              ...values,
              activeStep: 0,
              activeTab: 0,
            };
            newValues.tabs?.forEach((t: IStepperTab) => (t.activeStep = 0));
            formikRef.current.resetForm({ values: newValues });
          },
        }}
        // provide initial building props
        initialValues={initialValues}
        formikRef={formikRef}
        validate={handleValidate}
        validateOnChange={false}
        validateOnBlur={true}
        // Provide onSubmit
        onSubmit={async (values, actions) => {
          const apiValues = valuesToApiFormat(_.cloneDeep(values));

          try {
            let building: IBuilding;
            if (!values.data.id) {
              building = await createBuilding(apiValues)(dispatch);
            } else {
              building = await updateBuilding(apiValues)(dispatch);
            }
            fireMapRefreshEvent();
            actions.resetForm({ values: { ...values, ...{ data: building as any } } });
            setBuildingToAssociateLand(building);
          } catch (error) {
            // empty
          } finally {
            actions.setSubmitting(false);
          }
        }}
      >
        <Form
          isPropertyAdmin={isPropertyAdmin}
          setMovingPinNameSpace={setMovingPinNameSpace}
          nameSpace={withNameSpace('')}
          disabled={disabled}
          goToAssociatedLand={goToAssociatedLand}
          formikRef={formikRef}
          buildingData={initialValues.data}
        />
      </SteppedForm>
    </Container>
  );
};

export default BuidingForm;
