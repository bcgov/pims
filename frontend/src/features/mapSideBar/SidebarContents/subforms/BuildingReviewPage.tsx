import './BuildingReviewPage.scss';

import {
  FastSelect,
  FastInput,
  Input,
  TextArea,
  InputGroup,
  SelectOptions,
  FastDatePicker,
  Check,
} from 'components/common/form';
import React, { useCallback, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useFormikContext } from 'formik';
import { Label } from 'components/common/Label';
import { FaEdit } from 'react-icons/fa';
import { BuildingSvg } from 'components/common/Icons';
import { TypeaheadField } from 'components/common/form/Typeahead';
import AddressForm from 'features/properties/components/forms/subforms/AddressForm';
import { noop } from 'lodash';

interface IReviewProps {
  nameSpace?: string;
  disabled?: boolean;
  classifications: any;
  predominateUses: SelectOptions;
  constructionType: SelectOptions;
  occupantTypes: SelectOptions;
  agencies: any;
}

export const BuildingReviewPage: React.FC<any> = (props: IReviewProps) => {
  const defaultEditValues = {
    identification: true,
    tenancy: true,
    valuation: true,
  };
  const [editInfo, setEditInfo] = useState(defaultEditValues);
  const withNameSpace: Function = useCallback(
    (fieldName: string) => {
      return props.nameSpace ? `${props.nameSpace}.${fieldName}` : fieldName;
    },
    [props.nameSpace],
  );
  const formikProps = useFormikContext();

  return (
    <Container className="building-review-section">
      <Row className="review-steps">
        <h4>Review your building info</h4>
        <p>
          Please review the information you have entered. You can edit it by clicking on the edit
          icon for each section. When you are satisfied that the infomation provided is correct,
          click the submit button to save this information to the PIMS inventory.
        </p>
      </Row>
      <Row noGutters>
        <Col md={6}>
          <div className="identification">
            <Row className="identification-header">
              <BuildingSvg className="svg" />
              <h5>Building Identification</h5>
              <FaEdit
                size={20}
                className="edit"
                onClick={() =>
                  setEditInfo({ ...defaultEditValues, identification: !editInfo.identification })
                }
              />
            </Row>
            <Row>
              <Label>Agency</Label>
              <span className="vl"></span>
              <TypeaheadField
                name={withNameSpace('agencyId')}
                options={props.agencies}
                disabled={editInfo.identification}
              />
            </Row>
            <Row>
              <Label>Building Name</Label>
              <span className="vl"></span>
              <Input disabled={editInfo.identification} field={withNameSpace('name')} />
            </Row>
            <Row>
              <Label>Description</Label>
              <span className="vl"></span>
              <TextArea disabled={editInfo.identification} field={withNameSpace('description')} />
            </Row>

            <AddressForm
              verticalLine
              onGeocoderChange={noop}
              {...formikProps}
              disabled={editInfo.identification}
              nameSpace="address"
            />
            <Row>{/* <PidPin /> */}</Row>
            <br></br>
            <Row>
              <Label>Latitude</Label>
              <span className="vl"></span>
              <FastInput
                className="input-medium"
                displayErrorTooltips
                // tooltip={latitudeTooltip}
                formikProps={formikProps}
                disabled={editInfo.identification}
                type="number"
                field={withNameSpace('latitude')}
              />
            </Row>
            <Row>
              <Label>Longitude</Label>
              <span className="vl"></span>
              <FastInput
                className="input-medium"
                displayErrorTooltips
                formikProps={formikProps}
                disabled={editInfo.identification}
                type="number"
                field={withNameSpace('longitude')}
              />
            </Row>
            <br></br>
            <Row>
              <Label>Main Usage</Label>
              <span className="vl"></span>
              <FastSelect
                formikProps={formikProps}
                disabled={editInfo.identification}
                placeholder="Must Select One"
                field={withNameSpace('buildingPredominateUseId')}
                type="number"
                options={props.predominateUses}
              />
            </Row>
            <Row>
              <Label>Type of Construction</Label>
              <span className="vl"></span>
              <FastSelect
                formikProps={formikProps}
                disabled={editInfo.identification}
                placeholder="Must Select One"
                field={withNameSpace('buildingConstructionTypeId')}
                type="number"
                options={props.constructionType}
              />
            </Row>
            <Row>
              <Label>Number of Floors</Label>
              <span className="vl"></span>
              <FastInput
                displayErrorTooltips
                className="input-small"
                formikProps={formikProps}
                disabled={editInfo.identification}
                field={withNameSpace('buildingFloorCount')}
                type="number"
              />
            </Row>
          </div>
        </Col>
        <Col md={5}>
          <Row>
            <div className="tenancy">
              <Row className="tenancy-header">
                <BuildingSvg className="svg" />
                <h5>Tenancy</h5>
                <FaEdit
                  size={20}
                  className="edit"
                  onClick={() => setEditInfo({ ...defaultEditValues, tenancy: !editInfo.tenancy })}
                />
              </Row>
              <Row>
                <Label>Rentable Area</Label>
                <span className="vl"></span>
                <InputGroup
                  displayErrorTooltips
                  fast={true}
                  formikProps={formikProps}
                  disabled={editInfo.tenancy}
                  type="number"
                  field={withNameSpace('rentableArea')}
                  postText="Sq. Ft"
                />
              </Row>
              <Row>
                <Label>Tenancy</Label>
                <span className="vl"></span>
                <FastInput
                  displayErrorTooltips
                  formikProps={formikProps}
                  disabled={editInfo.tenancy}
                  field={withNameSpace('buildingTenancy')}
                />
              </Row>
              <Row>
                <Label>Type of Occupant</Label>
                <span className="vl"></span>
                <FastSelect
                  formikProps={formikProps}
                  disabled={editInfo.tenancy}
                  placeholder="Must Select One"
                  field={withNameSpace('buildingOccupantTypeId')}
                  type="number"
                  options={props.occupantTypes}
                />
              </Row>
              <Row>
                <Label>Occupant Name</Label>
                <span className="vl"></span>
                <FastInput
                  displayErrorTooltips
                  formikProps={formikProps}
                  disabled={editInfo.tenancy}
                  field={withNameSpace('occupantName')}
                />
              </Row>
              <Row>
                <Label>Date Lease Expires</Label>
                <span className="vl"></span>
                <FastDatePicker
                  formikProps={formikProps}
                  disabled={editInfo.tenancy}
                  field={withNameSpace('leaseExpiry')}
                />
              </Row>
              <Row>
                <Label>Transfer lease with land?</Label>
                <span className="vl"></span>
                <Check disabled={editInfo.tenancy} field={withNameSpace('transferLeaseOnSale')} />
              </Row>
            </div>
          </Row>
          <Row>
            <div className="valuation">
              <Row className="valuation-header">
                <BuildingSvg className="svg" />
                <h5>Valuation</h5>
                <FaEdit
                  size={20}
                  className="edit"
                  onClick={() =>
                    setEditInfo({ ...defaultEditValues, valuation: !editInfo.valuation })
                  }
                />
              </Row>
            </div>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};
