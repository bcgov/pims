import './IdentificationForm.scss';

import { IBuilding } from 'actions/parcelsActions';
import { Check, FastInput, FastSelect, SelectOptions } from 'components/common/form';
import GenericModal from 'components/common/GenericModal';
import { Label } from 'components/common/Label';
import TooltipWrapper from 'components/common/TooltipWrapper';
import { ProjectNumberLink } from 'components/maps/leaflet/InfoSlideOut/ProjectNumberLink';
import * as API from 'constants/API';
import { HARMFUL_DISCLOSURE_URL } from 'constants/strings';
import AddressForm from 'features/properties/components/forms/subforms/AddressForm';
import InformationForm from 'features/properties/components/forms/subforms/InformationForm';
import LatLongForm from 'features/properties/components/forms/subforms/LatLongForm';
import { getIn, useFormikContext } from 'formik';
import { IGeocoderResponse } from 'hooks/useApi';
import useCodeLookups from 'hooks/useLookupCodes';
import React, { useEffect, useState } from 'react';
import { Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import { useAppDispatch } from 'store';
import { getFetchLookupCodeAction } from 'store/slices/hooks';
import styled from 'styled-components';

import { sensitiveTooltip } from '../../../../../src/features/properties/components/forms/strings';
import { ClassificationForm } from './ClassificationForm';

interface IIdentificationProps {
  /** passed down from parent to lock/unlock designated fields */
  isPropertyAdmin?: boolean;
  /** the agencies for the form to use */
  agencies: SelectOptions;
  /** the classification for the form to use */
  classifications: SelectOptions;
  /** the predominate uses for the form to use */
  predominateUses: SelectOptions;
  /** the construction types for the form to use */
  constructionType: SelectOptions;
  /** access formik context */
  formikProps: any;
  /** nameSpace passed down to access desired field */
  nameSpace?: any;
  /** used to determine which marker to set the cursor to when adding a new property */
  setMovingPinNameSpace: (nameSpace?: string) => void;
  /** whether the form fields on this page can be edited */
  disabled?: boolean;
}

const StyledProjectNumbers = styled.div`
  flex-direction: column;
  display: flex;
`;

export const IdentificationForm: React.FC<IIdentificationProps> = ({
  formikProps,
  agencies,
  classifications,
  predominateUses,
  constructionType,
  nameSpace,
  setMovingPinNameSpace,
  isPropertyAdmin,
  disabled,
}) => {
  const { setFieldValue } = useFormikContext();
  const [overrideData, setOverrideData] = useState<IBuilding>();
  const withNameSpace: Function = React.useCallback(
    (name?: string) => {
      return [nameSpace ?? '', name].filter((x) => x).join('.');
    },
    [nameSpace],
  );
  const dispatch = useAppDispatch();
  useEffect(() => {
    getFetchLookupCodeAction()(dispatch);
  }, [dispatch]);
  const { lookupCodes } = useCodeLookups();
  const projectNumbers = getIn(formikProps.values, 'data.projectNumbers');
  const agencyId = getIn(formikProps.values, `data.agencyId`);
  const [privateProject, setPrivateProject] = useState(false);

  return (
    <Container>
      <Row>
        <h4 className="text-start">Building Information</h4>
      </Row>
      <Row>
        <Col>
          <InformationForm
            isPropertyAdmin={!!isPropertyAdmin}
            wizard
            agencies={agencies}
            classifications={classifications}
            nameSpace={withNameSpace('')}
            disabled={disabled}
          />
        </Col>
        <Col>
          <Form.Group as={Row} className="mb-2">
            <Label>Main Usage</Label>
            <Col>
              <FastSelect
                formikProps={formikProps}
                placeholder="Must Select One"
                field={withNameSpace('buildingPredominateUseId')}
                type="number"
                options={predominateUses}
                disabled={disabled}
                required
                displayErrorTooltips
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-2">
            <Label>Construction Type</Label>
            <Col>
              <FastSelect
                formikProps={formikProps}
                placeholder="Must Select One"
                field={withNameSpace('buildingConstructionTypeId')}
                type="number"
                options={constructionType}
                disabled={disabled}
                required
                displayErrorTooltips
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-2">
            <Label>Number of Floors</Label>
            <Col>
              <FastInput
                displayErrorTooltips
                style={{ width: '100px' }}
                className="input-small"
                formikProps={formikProps}
                field={withNameSpace('buildingFloorCount')}
                type="number"
                disabled={disabled}
              />
            </Col>
          </Form.Group>
          {!!projectNumbers?.length && (
            <Row>
              <Label>Project Number(s)</Label>
              <StyledProjectNumbers>
                {projectNumbers.map((projectNum: string) => (
                  <ProjectNumberLink
                    projectNumber={projectNum}
                    key={projectNum}
                    agencyId={agencyId}
                    setPrivateProject={setPrivateProject}
                    privateProject={privateProject}
                  />
                ))}
              </StyledProjectNumbers>
            </Row>
          )}
          <Row>
            <Label></Label>
            <div className="input-medium harmful">
              <p>
                Would this information be harmful if released?&nbsp;
                <TooltipWrapper toolTipId="sensitive-harmful" toolTip={sensitiveTooltip}>
                  <a target="_blank" rel="noopener noreferrer" href={HARMFUL_DISCLOSURE_URL}>
                    Policy
                  </a>
                </TooltipWrapper>
              </p>
              <Check
                type="radio"
                field={withNameSpace('isSensitive')}
                radioLabelOne="Yes"
                radioLabelTwo="No"
                disabled={disabled}
              />
            </div>
          </Row>
        </Col>
      </Row>
      <hr></hr>
      <ClassificationForm
        field={withNameSpace('classificationId')}
        encumbranceField={withNameSpace('encumbranceReason')}
        fieldLabel="Building Classification"
        classifications={classifications}
        title="Strategic Real Estate Classification"
        disabled={disabled}
      />
      <hr></hr>
      <Row>
        <h4 className="text-start">Location</h4>
      </Row>
      <Row style={{ marginBottom: 10 }}>
        <Col>
          <AddressForm
            {...formikProps}
            nameSpace={withNameSpace('address')}
            disabled={disabled}
            onGeocoderChange={(selection: IGeocoderResponse) => {
              const administrativeArea = selection.administrativeArea
                ? lookupCodes.find((code) => {
                    return (
                      code.type === API.ADMINISTRATIVE_AREA_CODE_SET_NAME &&
                      code.name === selection.administrativeArea
                    );
                  })
                : undefined;
              if (administrativeArea) {
                selection.administrativeArea = administrativeArea.name;
              }
              const updatedPropertyDetail = {
                ...getIn(formikProps.values, withNameSpace('')),
                latitude: selection.latitude,
                longitude: selection.longitude,
                address: {
                  ...getIn(formikProps.values, withNameSpace('address')),
                  line1: selection.address1,
                  administrativeArea: selection.administrativeArea,
                },
              };
              if (!getIn(formikProps.values, withNameSpace('latitude'))) {
                setFieldValue(withNameSpace(''), updatedPropertyDetail);
              } else {
                setOverrideData(updatedPropertyDetail);
              }
            }}
          />
        </Col>
        <Col>
          <LatLongForm
            disabled={disabled}
            {...formikProps}
            building
            setMovingPinNameSpace={setMovingPinNameSpace}
            nameSpace={withNameSpace('')}
          />
        </Col>
      </Row>
      <GenericModal
        display={!!overrideData}
        title="Update Form Details"
        okButtonText="Update"
        cancelButtonText="Cancel"
        handleOk={() => {
          formikProps.setFieldValue(withNameSpace(''), overrideData);
          setOverrideData(undefined);
        }}
        handleCancel={() => {
          setOverrideData(undefined);
        }}
        message={
          <>
            <p>
              Would you like to update this form using the Geocoder data for the updated address?
            </p>
            <h5>New Values:</h5>
            <ListGroup>
              <ListGroup.Item>Latitude: {overrideData?.latitude}</ListGroup.Item>
              <ListGroup.Item>Longitude: {overrideData?.longitude}</ListGroup.Item>
              <ListGroup.Item>Address: {overrideData?.address?.line1}</ListGroup.Item>
              <ListGroup.Item>Location: {overrideData?.address?.administrativeArea}</ListGroup.Item>
            </ListGroup>
          </>
        }
      />
    </Container>
  );
};
