import './BuildingForm.scss';

import { SteppedForm, useFormStepper } from 'components/common/form/StepForm';
import { useFormikContext } from 'formik';
import useKeycloakWrapper from 'hooks/useKeycloakWrapper';
import useCodeLookups from 'hooks/useLookupCodes';
import { noop } from 'lodash';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import styled from 'styled-components';
import { InventoryPolicy } from '../components/InventoryPolicy';
import * as API from 'constants/API';
import { IParcel } from 'actions/parcelsActions';
import { TenancyForm } from './subforms/TenancyForm';
import { IdentificationForm } from './subforms/IdentificationForm';
import { BuildingReviewPage } from './subforms/BuildingReviewPage';
import { BuildingValuationForm } from './subforms/BuildingValuationForm';

const Container = styled.div`
  background-color: #fff;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
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

interface IFormProps {
  isAdmin?: boolean;
  setMovingPinNameSpace: (nameSpace: string) => void;
}
const Form: React.FC<IFormProps> = ({ isAdmin, setMovingPinNameSpace }) => {
  const stepper = useFormStepper();
  const formikProps = useFormikContext<IParcel>();
  const { getOptionsByType } = useCodeLookups();

  const agencies = getOptionsByType(API.AGENCY_CODE_SET_NAME);
  const classifications = getOptionsByType(API.PROPERTY_CLASSIFICATION_CODE_SET_NAME);
  const predominateUses = getOptionsByType(API.PREDOMINATE_USE_CODE_SET_NAME);
  const constructionType = getOptionsByType(API.CONSTRUCTION_CODE_SET_NAME);
  const occupancyType = getOptionsByType(API.OCCUPANT_TYPE_CODE_SET_NAME);

  const render = (): React.ReactNode => {
    switch (stepper.current) {
      case 0:
        return (
          <div className="identification">
            <IdentificationForm
              formikProps={formikProps}
              constructionType={constructionType}
              predominateUses={predominateUses}
              classifications={classifications}
              agencies={agencies}
              setMovingPinNameSpace={setMovingPinNameSpace}
            />
          </div>
        );
      case 1:
        return (
          <TenancyForm
            classifications={classifications}
            formikProps={formikProps}
            occupantTypes={occupancyType}
          />
        );
      case 2:
        return <BuildingValuationForm formikProps={formikProps} />;
      case 3:
        return (
          <BuildingReviewPage
            classifications={classifications}
            agencies={agencies}
            occupantTypes={occupancyType}
            predominateUses={predominateUses}
            constructionType={constructionType}
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
        {stepper.current !== 3 ? (
          <Button size="sm" onClick={() => stepper.gotoNext()}>
            Continue
          </Button>
        ) : (
          <Button type="submit">Save</Button>
        )}
      </FormFooter>
    </FormContentWrapper>
  );
};

interface IBuildingForm {
  formikRef?: any;
  setMovingPinNameSpace: (nameSpace: string) => void;
}

const BuidingForm: React.FC<IBuildingForm> = ({ setMovingPinNameSpace }) => {
  const keycloak = useKeycloakWrapper();
  return (
    <Container className="buildingForm">
      <SteppedForm
        // Provide the steps
        steps={[
          { route: 'building-id', title: 'Building ID', completed: false, canGoToStep: true },
          { route: 'tenancy', title: 'Tenancy', completed: false, canGoToStep: true },
          { route: 'valuation', title: 'Valuation', completed: false, canGoToStep: true },
          { route: 'review', title: 'Review', completed: false, canGoToStep: true },
        ]}
        persistable={true}
        persistProps={{
          name: 'building',
          secret: keycloak.obj.subject,
          persistCallback: noop,
        }}
        // provide initial building props
        initialValues={{
          activeStep: 0,
          data: { name: 'Building name' },
        }}
        // Provide onSubmit
        onSubmit={values => alert(JSON.stringify(values.data))}
      >
        <Form setMovingPinNameSpace={setMovingPinNameSpace} />
      </SteppedForm>
    </Container>
  );
};

export default BuidingForm;
