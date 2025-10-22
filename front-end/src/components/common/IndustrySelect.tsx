import React from 'react';
import SelectWithSearch from './SelectWithSearch';
import { useIndustryContext } from '../../contexts/IndustryContext';

interface IndustrySelectProps {
  selectedValues: number[];
  onChange: (values: number[]) => void;
  placeholder?: string;
  multiple?: boolean;
  error?: string;
}

const IndustrySelect: React.FC<IndustrySelectProps> = ({ 
  selectedValues, 
  onChange, 
  placeholder = 'Chọn ngành',
  multiple = true,
  error = '' 
}) => {
  const { industries, loading } = useIndustryContext();

  const industryOptions = industries.map(industry => ({
    value: industry.id,
    label: industry.name
  }));

  // Show a loading message when loading
  if (loading) {
    return <div>Đang tải ngành...</div>;
  }

  return (
      <SelectWithSearch
        options={industryOptions}
        selectedValues={selectedValues}
        onChange={onChange}
        placeholder={placeholder}
        multiple={multiple}
        error={error}
      />
  );
};

export default IndustrySelect;
