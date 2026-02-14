import React from 'react';
import { PlusCircle, Utensils } from 'lucide-react';

const FoodCard = ({ food, onAdd }) => {
  const nutrient = food.foodNutrients?.find(n => n.unitName === 'KCAL');
  const calories = nutrient ? Math.round(nutrient.value) : 0;
  
  // USDA API doesn't provide images, so we use a high-quality placeholder
  const foodImage = `https://source.unsplash.com/400x300/?${food.description.split(' ')[0]},food`;

  return (
    <div className="food-card">
      <div className="card-image-wrapper">
        <img 
          src={foodImage} 
          alt={food.description} 
          className="food-image"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
        />
        <div className="image-overlay">
          <span className="cal-tag">{calories} kcal</span>
        </div>
      </div>
      
      <div className="card-info">
        <h4 className="food-title">{food.description.toLowerCase()}</h4>
        <button className="add-btn-full" onClick={() => onAdd(food, calories)}>
          <PlusCircle size={18} />
          Add to Log
        </button>
      </div>
    </div>
  );
};

export default FoodCard;