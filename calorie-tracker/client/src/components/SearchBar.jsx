import React, { useState } from 'react';
import { Search } from 'lucide-react'; // Using your installed icons

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <input 
          type="text" 
          placeholder="What did you eat today? (e.g. Banana)" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          <Search size={18} style={{ marginRight: '8px' }} />
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;