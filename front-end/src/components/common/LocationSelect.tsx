import React, { useState, useEffect, useMemo } from 'react';
import { useLocationContext } from '../../contexts/LocationContext';
import SelectWithSearch from './SelectWithSearch';

interface LocationSelectProps {
  selectedValues: string | string[];
  onChange: (selectedValues: string) => void;
  className?: string;
  error?: string;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  selectedValues,
  onChange,
  className = '',
  error = ''
}) => {
  const { locations, loading } = useLocationContext();
  
  // Convert string to array if needed, but we only need the first value for our use case
  const currentLocation = useMemo(() => {
    if (typeof selectedValues === 'string') {
      return selectedValues;
    } else if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      return selectedValues[0];
    }
    return '';
  }, [selectedValues]);
  
  // Split the current location into detail and location parts
  const [detailPart, locationPart] = useMemo(() => {
    if (currentLocation) {
      // Try to find if any of the API locations are at the end of the string
      const matchingLocation = locations.find(loc => 
        currentLocation.endsWith(loc)
      );
      
      if (matchingLocation) {
        let detail = currentLocation.substring(0, currentLocation.length - matchingLocation.length);
       
        if (detail.endsWith(', ')) {
          detail = detail.substring(0, detail.length - 2);
        }
        return [detail, matchingLocation];
      }
      
      // If no matching location found, treat the whole string as detail
      return [currentLocation, ''];
    }
    return ['', ''];
  }, [currentLocation, locations]);
  
  const [inputDetail, setInputDetail] = useState(detailPart);
  const [selectedLocation, setSelectedLocation] = useState(locationPart);
  
  // Update local state when selectedValues changes (from parent)
  useEffect(() => {
    // Only update if the trimmed values are different to prevent resetting while typing
    const currentTrimmed = inputDetail?.trim();
    const newTrimmed = detailPart?.trim();
    
    if (currentTrimmed !== newTrimmed) {
      setInputDetail(detailPart);
    }
    if (selectedLocation !== locationPart) {
      setSelectedLocation(locationPart);
    }
  }, [detailPart, locationPart, inputDetail, selectedLocation]);
  
  // Handle changes to input detail
  const handleDetailChange = (value: string) => {
    setInputDetail(value);
    const trimmedValue = value?.trim();
    const combined = trimmedValue + (trimmedValue && selectedLocation ? ', ' : '') + selectedLocation;
    onChange(combined);
  };
  
  // Handle changes to selected location
  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    const trimmedDetail = inputDetail?.trim();
    const combined = trimmedDetail + (trimmedDetail && value ? ', ' : '') + value;
    onChange(combined);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-2 border border-gray-300 rounded-md ${className}`}>
        <span className="text-gray-500">Đang tải vị trí...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={inputDetail}
        onChange={(e) => handleDetailChange(e.target.value)}
        placeholder={"Nhập chi tiết vị trí (số nhà, tên đường, tòa nhà... )"}
        className={`${error ? 'border-red-500' : ''} w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />
      <SelectWithSearch
        options={locations.map(location => ({ value: location, label: location }))}
        selectedValues={selectedLocation ? [selectedLocation] : []}
        onChange={(selectedValues) => handleLocationChange(selectedValues[0] || '')}
        placeholder="Chọn vị trí từ danh sách"
        className="w-full"
        multiple={false}
        error={error}
      />
      {(inputDetail.trim() || selectedLocation) && (
        <div className="text-sm text-gray-500">
          Vị trí đầy đủ: {inputDetail.trim()}{inputDetail.trim() && selectedLocation ? ', ' : ''}{selectedLocation}
        </div>
      )}
    </div>
  );
};

export default LocationSelect;
