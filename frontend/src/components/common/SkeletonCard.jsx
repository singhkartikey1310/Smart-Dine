const SkeletonCard = ({ small = false }) => {
  if (small) {
    return (
      <div className="card overflow-hidden">
        <div className="aspect-square shimmer" />
        <div className="p-2.5 space-y-2">
          <div className="h-3 shimmer rounded w-3/4" />
          <div className="h-3 shimmer rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-44 shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-4 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-3 shimmer rounded w-16" />
          <div className="h-3 shimmer rounded w-16" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
