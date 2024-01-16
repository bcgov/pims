import SelectFormField from './SelectFormField';
import { create } from 'react-test-renderer';
import React from 'react';

// Mock data
const name = 'testName';
const label = 'testLabel';
const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  Controller: () => <></>,
  useForm: () => ({
    control: () => ({}),
    handleSubmit: () => jest.fn(),
  }),
  useFormContext: () => ({
    control: () => ({}),
  }),
}));

describe('AutocompleteFormField.tsx', () => {
  it('should match the existing snapshot', () => {
    const tree = create(
      <SelectFormField name={name} label={label} options={options} required={false} />,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});