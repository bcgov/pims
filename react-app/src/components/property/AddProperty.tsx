import { Box, Button, Grid, InputAdornment, RadioGroup, Typography } from '@mui/material';
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import AutocompleteFormField from '../form/AutocompleteFormField';
import TextFormField from '../form/TextFormField';
import DateFormField from '../form/DateFormField';
import dayjs from 'dayjs';
import BuildingIcon from '@/assets/icons/building.svg';
import ParcelIcon from '@/assets/icons/parcel.svg';
import BoxedIconRadio from '../form/BoxedIconRadio';
import useDataLoader from '@/hooks/useDataLoader';
import usePimsApi from '@/hooks/usePimsApi';
import { LookupObject } from '@/hooks/api/useLookupApi';
import { GeneralInformationForm, ParcelInformationForm, PropertyType } from './PropertyForms';

interface IAssessedValue {
  years: number[];
}

const AssessedValue = (props: IAssessedValue) => {
  const { years } = props;

  return (
    <>
      <Typography mt={2} variant="h5">
        Assessed Value
      </Typography>
      <Box overflow={'auto'} paddingTop={'8px'}>
        {years.map((yr, idx) => {
          return (
            <Box
              mb={2}
              gap={2}
              key={`assessedvaluerow-${yr}`}
              display={'flex'}
              width={'100%'}
              flexDirection={'row'}
            >
              <TextFormField
                sx={{ minWidth: 'calc(33.3% - 1rem)' }}
                name={`Evaluations.${idx}.Year`}
                label={'Year'}
                value={yr}
                disabled
              />
              <TextFormField
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ minWidth: 'calc(33.3% - 1rem)' }}
                name={`Evaluations.${idx}.Value`}
                numeric
                label={'Value'}
              />
            </Box>
          );
        })}
      </Box>
    </>
  );
};

interface IBuildingInformation {
  classificationOptions: LookupObject[];
  constructionOptions: LookupObject[];
  predominateUseOptions: LookupObject[];
}

const BuildingInformation = (props: IBuildingInformation) => {
  return (
    <>
      <Typography mt={'2rem'} variant="h5">{`Building information`}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} paddingTop={'1rem'}>
          <AutocompleteFormField
            name={`ClassificationId`}
            label={'Building classification'}
            options={
              props.classificationOptions?.map((classification) => ({
                label: classification.Name,
                value: classification.Id,
              })) ?? []
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextFormField required fullWidth label={'Building name'} name={`Name`} />
        </Grid>
        <Grid item xs={6}>
          <AutocompleteFormField
            label={'Main usage'}
            name={`BuildingPredominateUseId`}
            options={
              props.predominateUseOptions?.map((usage) => ({
                label: usage.Name,
                value: usage.Id,
              })) ?? []
            }
          />
        </Grid>
        <Grid item xs={6}>
          <AutocompleteFormField
            label={'Construction type'}
            name={`BuildingConstructionTypeId`}
            options={
              props.constructionOptions?.map((construct) => ({
                label: construct.Name,
                value: construct.Id,
              })) ?? []
            }
          />
        </Grid>
        <Grid item xs={6}>
          <TextFormField
            name={`TotalArea`}
            label={'Total area'}
            fullWidth
            numeric
            InputProps={{ endAdornment: <InputAdornment position="end">Sq. M</InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextFormField
            name={`RentableArea`}
            rules={{
              validate: (val, formVals) =>
                val <= formVals.TotalArea ||
                `Cannot be larger than Total area: ${val} <= ${formVals?.TotalArea}`,
            }}
            label={'Net usable area'}
            fullWidth
            numeric
            InputProps={{ endAdornment: <InputAdornment position="end">Sq. M</InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextFormField
            name={`BuildingTenancy`}
            label={'Tenancy'}
            numeric
            fullWidth
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6}>
          <DateFormField name={`BuildingTenancyUpdatedOn`} label={'Tenancy date'} />
        </Grid>
      </Grid>
    </>
  );
};

interface INetBookValue {
  years: number[];
}

const NetBookValue = (props: INetBookValue) => {
  return (
    <Grid container spacing={2}>
      {props.years.map((yr, idx) => {
        return (
          <React.Fragment key={`netbookgrid${yr}`}>
            <Grid item xs={4}>
              <TextFormField
                value={yr}
                disabled
                name={`Fiscals.${idx}.Year`}
                label={'Fiscal year'}
              />
            </Grid>
            <Grid item xs={4}>
              <DateFormField name={`Fiscals.${idx}.EffectiveDate`} label={'Effective date'} />
            </Grid>
            <Grid item xs={4}>
              <TextFormField
                name={`Fiscals.${idx}.Value`}
                label={'Net book value'}
                numeric
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
          </React.Fragment>
        );
      })}
    </Grid>
  );
};

const AddProperty = () => {
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1];
  const [propertyType, setPropertyType] = useState<PropertyType>('Building');
  const [showErrorText, setShowErrorTest] = useState(false);

  const api = usePimsApi();
  const { data: adminAreasData, loadOnce: loadAdminAreas } = useDataLoader(
    api.administrativeAreas.getAdministrativeAreas,
  );
  const { data: classificationData, loadOnce: loadClassifications } = useDataLoader(
    api.lookup.getClassifications,
  );
  const { data: predominateUseData, loadOnce: loadPredominateUse } = useDataLoader(
    api.lookup.getPredominateUses,
  );
  const { data: constructionTypeData, loadOnce: loadConstructionTypeData } = useDataLoader(
    api.lookup.getConstructionTypes,
  );

  loadAdminAreas();
  loadClassifications();
  loadPredominateUse();
  loadConstructionTypeData();

  const formMethods = useForm({
    defaultValues: {
      NotOwned: true,
      Address1: '',
      PIN: '',
      PID: '',
      PostalCode: '',
      AdministrativeAreaId: '',
      Latitude: '',
      Longitude: '',
      LandArea: '',
      IsSensitive: '',
      ClassificationId: '',
      Description: '',
      Name: '',
      BuildingPredominateUseId: '',
      BuildingConstructionTypeId: '',
      TotalArea: '',
      RentableArea: '',
      BuildingTenancy: '',
      BuildingTenancyUpdatedOn: dayjs(),
      Fiscals: years.map((yr) => ({
        Year: yr,
        Value: '',
      })),
      Evaluations: years.map((yr) => ({
        Year: yr,
        EffectiveDate: dayjs(),
        Value: '',
      })),
    },
  });

  return (
    <Box
      display={'flex'}
      gap={'1rem'}
      mt={'2rem'}
      mb={'2rem'}
      flexDirection={'column'}
      width={'38rem'}
      marginX={'auto'}
    >
      <FormProvider {...formMethods}>
        <Typography mb={'2rem'} variant="h2">
          Add new property
        </Typography>
        <Typography variant="h5">Property type</Typography>
        <RadioGroup name="controlled-radio-property-type">
          <BoxedIconRadio
            onClick={() => setPropertyType('Parcel')}
            checked={propertyType === 'Parcel'}
            value={'Parcel'}
            icon={ParcelIcon}
            mainText={'Parcel'}
            subText={`PID (Parcel Identifier) is required to proceed.`}
          />
          <BoxedIconRadio
            onClick={() => setPropertyType('Building')}
            checked={propertyType === 'Building'}
            value={'Building'}
            icon={BuildingIcon}
            mainText={'Building'}
            subText={`Street address with postal code is required to proceed.`}
            boxSx={{ mt: '1rem' }}
          />
        </RadioGroup>
        <GeneralInformationForm
          propertyType={propertyType}
          adminAreas={adminAreasData?.map((area) => ({ label: area.Name, value: area.Id })) ?? []}
        />
        {propertyType === 'Parcel' ? (
          <ParcelInformationForm
            classificationOptions={classificationData.map((classif) => ({
              label: classif.Name,
              value: classif.Id,
            }))}
          />
        ) : (
          <BuildingInformation
            predominateUseOptions={predominateUseData}
            classificationOptions={classificationData}
            constructionOptions={constructionTypeData}
          />
        )}
        <Typography mt={'2rem'} variant="h5">
          Net book value
        </Typography>
        <NetBookValue years={years} />
        <AssessedValue years={years} />
      </FormProvider>
      {showErrorText && (
        <Typography alignSelf={'center'} variant="h5" color={'error'}>
          Please correct issues in the form input.
        </Typography>
      )}
      <Button
        onClick={async () => {
          const isValid = await formMethods.trigger();
          if (isValid) {
            console.log(JSON.stringify(formMethods.getValues(), null, 2));
            setShowErrorTest(false);
          } else {
            console.log('Error!');
            setShowErrorTest(true);
          }
        }}
        variant="contained"
        color="primary"
        sx={{ padding: '8px', width: '6rem', marginX: 'auto' }}
      >
        Submit
      </Button>
    </Box>
  );
};

export default AddProperty;
