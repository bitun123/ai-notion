import React from 'react';

const Skeleton = () => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-100 rounded-md w-full mb-4"></div>
      <div className="flex justify-between items-center mt-6">
        <div className="h-3 bg-slate-100 rounded-md w-1/4"></div>
      </div>
    </div>
  );
};

export const SkeletonList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
};

export default Skeleton;
