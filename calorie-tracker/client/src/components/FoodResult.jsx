import React from 'react';
import FoodCard from './FoodCard';

const FoodResult = ({ results, onAdd }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="results-grid">
      {results.map((food, index) => (
        <FoodCard key={food.fdcId || index} food={food} onAdd={onAdd} />
      ))}
    </div>
  );
};

export default FoodResult;