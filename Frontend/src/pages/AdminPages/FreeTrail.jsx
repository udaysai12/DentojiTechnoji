// FreeTrail.jsx - Main Page Component
import React, { useState } from 'react';
import FreeTrailHeader from '../../components/Host/plans/FreeTrail/FreeTrailHeader';
//import FreeTrailFilters from '../../components/Host/plans/FreeTrail/FreeTrailFilters';
import FreeTrailTable from '../../components/Host/plans/FreeTrail/FreeTrailTable';

const FreeTrail = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    tab: 'trials',
    status: 'all'
  });

  const handleSearch = (term) => {
    setSearchTerm(term);
    // Add your search logic here
    console.log('Searching for:', term);
  };

  const handleFilterChange = (filterData) => {
    setFilters(prev => ({
      ...prev,
      [filterData.type]: filterData.value
    }));
    // Add your filter logic here
    console.log('Filter changed:', filterData);
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      <div className="max-w-full px-6 py-6">
        {/* Header Stats Component */}
       
        
       
        
        {/* Table Component */}
        <FreeTrailTable 
          searchTerm={searchTerm}
          filters={filters}
        />
      </div>
    </div>
  );
};

export default FreeTrail;