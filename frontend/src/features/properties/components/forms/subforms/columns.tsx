import './tableStyles.scss';

import { FastCurrencyInput, FastDatePicker } from 'components/common/form';
import { BuildingSvg, LandSvg } from 'components/common/Icons';
import TooltipIcon from 'components/common/TooltipIcon';
import { EvaluationKeys } from 'constants/evaluationKeys';
import { FiscalKeys } from 'constants/fiscalKeys';
import { getIn, useFormikContext } from 'formik';
import moment from 'moment';
import React from 'react';
import { formatFiscalYear, formatMoney } from 'utils';

import { indexOfFinancial } from './EvaluationForm';
const currentMoment = moment();
const currentYear = currentMoment.year();

/** used to create assessed header for table with tooltip */
const generateAssessedHeader = () => {
  return (
    <>
      Assessed Value
      <TooltipIcon
        toolTipId="assessedTip"
        toolTip="Your assessment issued in July applies to the next calendar year."
      />
    </>
  );
};

/** used to create NetBookValue header for table with tooltip */
const generateNetBookValueHeader = () => {
  return (
    <>
      Net Book Value
      <TooltipIcon
        toolTipId="NetBookValueTip"
        toolTip="NBV is calculated as the original cost of an asset minus accumulated depreciation."
      />
      <div className="comment">Doesn't have to be entered until the property is deemed surplus</div>
    </>
  );
};

const getEditableMoneyCell = (disabled: boolean | undefined, namespace: string, type: string) => {
  return (cellInfo: any) => {
    //get the desired year using the current year - the offset
    const desiredYear = currentYear - cellInfo.row.index;
    const context = useFormikContext();
    const { values } = context;
    const data = getIn(values, namespace);
    const financialIndex = indexOfFinancial(data, type, desiredYear);

    if (disabled && financialIndex >= 0) {
      const value = getIn(values, `${namespace}.${financialIndex}.value`);
      return typeof value === 'number' ? formatMoney(value) : null;
    }
    return (
      <FastCurrencyInput
        key={`${namespace}.${financialIndex}.value`}
        formikProps={context}
        field={`${namespace}.${financialIndex}.value`}
        disabled={disabled}
      />
    );
  };
};

/**
 * Create a formik date picker using the passed cellinfo to get the associated data.
 * This information is only editable if this cell belongs to a parcel row.
 * @param cellInfo provided by react table
 */
const getEditableDatePickerCell =
  (namespace: string = 'properties', field: string, type: string, disabled?: boolean) =>
  (cellInfo: any) => {
    //get the desired year using the current year - the offset
    const desiredYear = currentYear - cellInfo.row.index;
    const context = useFormikContext();
    const { values } = context;
    const data = getIn(values, namespace);
    const financialIndex = indexOfFinancial(data, type, desiredYear);
    return (
      <FastDatePicker
        formikProps={context}
        disabled={disabled}
        field={`${namespace}.${financialIndex}.${field}`}
      ></FastDatePicker>
    );
  };

const getFiscalYear = () => {
  return (cellInfo: any) => {
    const desiredYear = currentYear - cellInfo.row.index;
    return formatFiscalYear(desiredYear);
  };
};

export const getAssessedCols = (
  title: string,
  isParcel: boolean,
  disabled?: boolean,
  namespace = 'financials',
  includeImprovements?: boolean,
): any => {
  const basicAssessed = [
    {
      Header: 'Assessment Year',
      accessor: 'year',
      maxWidth: 90,
      align: 'left',
    },
    {
      Header: title,
      accessor: 'assessed.value',
      maxWidth: 140,
      align: 'left',
      Cell: getEditableMoneyCell(disabled, `${namespace}.evaluations`, EvaluationKeys.Assessed),
    },
  ];
  const improvements = [
    {
      Header: 'Buildings',
      accessor: 'improvements.value',
      maxWidth: 140,
      align: 'left',
      Cell: getEditableMoneyCell(disabled, `${namespace}.evaluations`, EvaluationKeys.Improvements),
    },
  ];
  if (includeImprovements) {
    return [
      {
        Header: generateAssessedHeader(),
        id: 'assessed',
        columns: [...basicAssessed, ...improvements],
      },
    ];
  } else {
    return [{ Header: generateAssessedHeader(), id: 'assessed', columns: [...basicAssessed] }];
  }
};

export const getNetbookCols = (disabled?: boolean, namespace = 'financials'): any => {
  const netbookCols = [
    {
      Header: 'Fiscal Year',
      className: 'year',
      accessor: 'netbook.fiscalYear',
      maxWidth: 50,
      align: 'left',
      Cell: getFiscalYear(),
    },
    {
      Header: 'Effective Date',
      accessor: 'netbook.effectiveDate',
      maxWidth: 140,
      align: 'left',
      Cell: getEditableDatePickerCell(
        `${namespace}.fiscals`,
        `effectiveDate`,
        FiscalKeys.NetBook,
        disabled,
      ),
    },
    {
      Header: 'Net Book Value',
      accessor: 'netbook.value',
      maxWidth: 140,
      align: 'left',
      Cell: getEditableMoneyCell(disabled, `${namespace}.fiscals`, FiscalKeys.NetBook),
    },
  ];
  return [{ Header: generateNetBookValueHeader(), id: 'netbook', columns: [...netbookCols] }];
};

export const getAssociatedLandCols = (): any => {
  const associatedLandCols = [
    {
      Header: 'Type',
      accessor: '',
      maxWidth: 50,
      align: 'left',
      Cell: () => <LandSvg className="svg" />,
    },
    {
      Header: 'Property Name',
      accessor: 'name',
      maxWidth: 140,
      align: 'left',
    },
    {
      Header: 'Classification',
      accessor: 'classification',
      maxWidth: 140,
      align: 'left',
    },
    {
      Header: 'Street Address',
      accessor: 'address.line1',
      maxWidth: 140,
      align: 'left',
    },
    {
      Header: 'Lot Size(ha)',
      accessor: 'landArea',
      maxWidth: 140,
      align: 'left',
    },
    {
      Header: 'Location',
      accessor: 'address.administrativeArea',
      maxWidth: 140,
      align: 'left',
    },
  ];
  return associatedLandCols;
};

export const getAssociatedBuildingsCols = (): any => {
  const associatedBuildingsCols = [
    {
      Header: 'Type',
      accessor: '',
      maxWidth: 50,
      align: 'left',
      Cell: () => <BuildingSvg className="svg" />,
      clickable: true,
    },
    {
      Header: 'Property Name',
      accessor: 'name',
      maxWidth: 140,
      clickable: true,
      align: 'left',
    },
    {
      Header: 'Classifications',
      accessor: 'classification',
      maxWidth: 140,
      clickable: true,
      align: 'left',
    },
    {
      Header: 'Street Address',
      accessor: 'address.line1',
      maxWidth: 140,
      clickable: true,
      align: 'left',
    },
    {
      Header: 'Location',
      accessor: 'address.administrativeArea',
      maxWidth: 140,
      clickable: true,
      align: 'left',
    },
  ];
  return associatedBuildingsCols;
};
