import { useNavigate } from 'react-router-dom';

const CategoryFilter = ({ categories, selected, onSelect }) => {
  const navigate = useNavigate();

  const handleClick = (cat) => {
    if (onSelect) {
      onSelect(cat._id);
    } else {
      navigate(`/search?category=${cat._id}`);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => handleClick(cat)}
          className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all min-w-[80px] ${
            selected === cat._id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300'
          }`}
        >
          {cat.image?.url ? (
            <img src={cat.image.url} alt={cat.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-xl">
              🍽️
            </div>
          )}
          <span className={`text-xs font-medium whitespace-nowrap ${selected === cat._id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
