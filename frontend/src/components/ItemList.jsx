import React from 'react';
import ItemCard from './ItemCard';

const ItemList = ({ items, onView, onDelete }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400">No items saved yet. Paste a URL above to start building your second brain.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} onView={onView} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default ItemList;
