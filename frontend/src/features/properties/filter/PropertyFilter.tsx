import './PropertyFilter.scss';

import React, { useMemo } from 'react';
import { Col } from 'react-bootstrap';
import { Formik } from 'formik';
import { ILookupCode } from 'actions/lookupActions';
import { Form, Select, SelectOption } from '../../../components/common/form';
import { FilterBarSchema } from 'utils/YupSchema';
import ResetButton from 'components/common/form/ResetButton';
import SearchButton from 'components/common/form/SearchButton';
import { mapLookupCodeWithParentString } from 'utils';
import { ParentSelect } from 'components/common/form/ParentSelect';
import { PropertyFilterOptions } from './';
import { useRouterFilter } from 'hooks/useRouterFilter';
import { IPropertyFilter } from './IPropertyFilter';
import { TableSort } from 'components/Table/TableSort';
import { FindMorePropertiesButton } from 'components/maps/FindMorePropertiesButton';

/**
 * PropertyFilter component properties.
 */
export interface IPropertyFilterProps {
  /** The default filter to apply if a different one hasn't been set in the URL or stored in redux. */
  defaultFilter: IPropertyFilter;
  /** An arry of agency lookup codes. */
  agencyLookupCodes: ILookupCode[];
  /** An array of classification codes. */
  propertyClassifications: ILookupCode[];
  /** Callback event when the filter is changed during Mount. */
  onChange: (filter: IPropertyFilter) => void;
  /** Comma separated list of column names to sort by. */
  sort?: TableSort<any>;
  /** Event fire when sorting changes. */
  onSorting?: (sort: TableSort<any>) => void;
}

/**
 * Property filter bar to search for properties.
 * Applied filter will be added to the URL query parameters and stored in a redux store.
 */
export const PropertyFilter: React.FC<IPropertyFilterProps> = ({
  defaultFilter,
  agencyLookupCodes,
  propertyClassifications,
  onChange,
  sort,
  onSorting,
}) => {
  const [propertyFilter, setPropertyFilter] = React.useState<IPropertyFilter>(defaultFilter);
  useRouterFilter({
    filter: propertyFilter,
    setFilter: filter => {
      onChange(filter);
      setPropertyFilter(filter);
    },
    key: 'propertyFilter',
    sort: sort,
    setSorting: onSorting,
  });
  const mapLookupCode = (code: ILookupCode): SelectOption => ({
    label: code.name,
    value: code.id.toString(),
    code: code.code,
    parentId: code.parentId,
  });
  const agencies = (agencyLookupCodes ?? []).map(c =>
    mapLookupCodeWithParentString(c, agencyLookupCodes),
  );
  const classifications = (propertyClassifications ?? []).map(c => mapLookupCode(c));

  const initialValues = useMemo(() => {
    const values = { ...defaultFilter, ...propertyFilter };
    if (typeof values.agencies === 'string') {
      const agency = agencies.find(x => x.value.toString() === values.agencies?.toString()) as any;
      if (agency) {
        values.agencies = agency;
      }
    }
    return values;
  }, [agencies, propertyFilter, defaultFilter]);

  const changeFilter = (values: IPropertyFilter) => {
    const agencyIds = (values.agencies as any)?.value ?? '';
    setPropertyFilter({ ...values, agencies: agencyIds });
    onChange?.({ ...values, agencies: agencyIds });
  };

  const resetFilter = () => {
    changeFilter(defaultFilter);
  };

  return (
    <Formik<IPropertyFilter>
      initialValues={{ ...initialValues }}
      enableReinitialize
      validationSchema={FilterBarSchema}
      onSubmit={(values, { setSubmitting }) => {
        setSubmitting(true);
        changeFilter(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, handleReset, handleSubmit, setFieldValue, values }) => (
        <Form>
          <Form.Row className="map-filter-bar align-items-start">
            <FindMorePropertiesButton />
            <div className="vl"></div>
            <Col className="bar-item">
              <PropertyFilterOptions />
            </Col>
            <Col className="agency-item">
              <ParentSelect
                field="agencies"
                options={agencies}
                filterBy={['code', 'label', 'parent']}
                placeholder="Enter an Agency"
              />
            </Col>
            <Col className="bar-item">
              <Select
                field="classificationId"
                placeholder="Classification"
                options={classifications}
              />
            </Col>
            <Col className="bar-item flex-grow-0">
              <SearchButton disabled={isSubmitting} />
            </Col>
            <Col className="bar-item flex-grow-0">
              <ResetButton disabled={isSubmitting} onClick={resetFilter} />
            </Col>
          </Form.Row>
        </Form>
      )}
    </Formik>
  );
};
