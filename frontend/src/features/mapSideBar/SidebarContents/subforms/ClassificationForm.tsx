import { FastSelect, SelectOptions, TextArea } from 'components/common/form';
import { Label } from 'components/common/Label';
import TooltipIcon from 'components/common/TooltipIcon';
import { Classifications } from 'constants/classifications';
import {
  CoreOperational,
  CoreStrategic,
  SurplusActive,
  SurplusEncumbered,
  SurplusEncumberedOrActive,
} from 'features/properties/components/forms/strings';
import { getIn, useFormikContext } from 'formik';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import styled from 'styled-components';

const Title = styled.h4`
  float: left;
`;

/** formated information box to display the classification definitions to the right of the select */
const InfoBox = styled.div`
  border: 1px solid #f2f2f2;
  border-radius: 4px;
  text-align: left;
  padding: 8px 12px 10px;
  margin-bottom: 10px;
`;

/** formatted field description that will appear underneath the select input */
const FieldDescription = styled.p`
  margin-left: 166px;
  margin-top: 10px;
  font-size: 12px;
  text-align: left;
`;

const Encumberance = styled(Col)`
  .form-label {
    min-width: 140px;
  }
  .form-group {
    display: flex;
    textarea.form-control {
      width: 100%;
    }
  }
`;

/** used to conditionally render the information display box with the desired content */
const InfoBoxWithContent = (content: string) => {
  return (
    <InfoBox>
      <p style={{ fontSize: '11px' }}>{content}</p>
    </InfoBox>
  );
};

interface IClassificationFormProps {
  /** title to be displayed at the top of the form */
  title?: string;
  /** the classification set to be used with the component, could vary by form */
  classifications: SelectOptions;
  /** the field label for the select options (eg) Building Classification/Land Classification */
  fieldLabel?: string;
  /** pass down the appropriate field to edit */
  field: string;
  /** pass a tooltip for the classification field */
  toolTip?: string;
  /** reason for encumberance */
  encumbranceField: string;
  /** disable form controls */
  disabled?: boolean;
}

/**
 * component responsible for displaying classifcations of properties with conditional renders of information based on the classification selected.
 */
export const ClassificationForm: React.FC<IClassificationFormProps> = ({
  title,
  classifications,
  fieldLabel,
  field,
  toolTip,
  disabled,
  encumbranceField,
}) => {
  const formikProps = useFormikContext();
  let surplusActiveOrEncumbered =
    getIn(formikProps.values, field) === Classifications.SurplusEncumbered ||
    getIn(formikProps.values, field) === Classifications.SurplusActive;

  /** classId based on current formik values to determine which classsification information box to display */
  let classId = getIn(formikProps.values, field);

  let filteredClassifications = classifications;
  /** users not allowed to select disposed, but display these values if one of these classifications has already been selected. */
  filteredClassifications = classifications.filter(
    c => Number(c.value) !== Classifications.Disposed || +c.value === +classId,
  );

  const renderInfo = () => {
    switch (classId) {
      case Classifications.CoreOperational:
        return InfoBoxWithContent(CoreOperational);
      case Classifications.CoreStrategic:
        return InfoBoxWithContent(CoreStrategic);
      case Classifications.SurplusEncumbered:
        return InfoBoxWithContent(SurplusEncumbered);
      case Classifications.SurplusActive:
        return InfoBoxWithContent(SurplusActive);
      default:
        return InfoBoxWithContent(
          'Select a classification from the dropdown list to show the definition here. For further information, see the Inventory Policy.',
        );
    }
  };

  return (
    <>
      <Row>
        <Title>{title}</Title>
      </Row>
      <Row>
        <Col md={6}>
          <Row style={{ display: 'flex' }}>
            <Label style={{ marginBottom: '0', textAlign: 'right' }}>{fieldLabel}</Label>
            <FastSelect
              formikProps={formikProps}
              type="number"
              style={{ marginTop: '5px', display: 'flex' }}
              placeholder="Must Select One"
              field={field}
              options={filteredClassifications}
              disabled={disabled}
              required
              displayErrorTooltips
            />
            {toolTip && (
              <div style={{ marginTop: '8px' }}>
                <TooltipIcon toolTip={toolTip} toolTipId="classificationToolTip" />
              </div>
            )}
          </Row>
        </Col>
        <Col md={6}>{renderInfo()}</Col>
      </Row>
      {getIn(formikProps.values, field) === Classifications.SurplusEncumbered && (
        <Row>
          <Encumberance>
            <TextArea field={encumbranceField} label="Reason for Encumbrance"></TextArea>
          </Encumberance>
        </Row>
      )}
      {surplusActiveOrEncumbered && (
        <FieldDescription>{SurplusEncumberedOrActive}</FieldDescription>
      )}
    </>
  );
};
