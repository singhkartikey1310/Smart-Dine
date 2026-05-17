import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiZap, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const RestaurantMenuPage = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [editFood, setEditFood] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editImage, setEditImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const { data: restData } = await api.get('/restaurants/my');
      const { data } = await api.get('/foods', { params: { restaurant: restData.restaurant._id, keyword } });
      setFoods(data.foods);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const openEdit = (food) => {
    setEditFood(food);
    setEditForm({
      name: food.name,
      description: food.description || '',
      price: food.price,
      discountPrice: food.discountPrice || '',
      category: food.category?._id || food.category || '',
      ingredients: food.ingredients?.join(', ') || '',
      preparationTime: food.preparationTime || '',
      isVeg: food.isVeg || false,
      stock: food.stock || 100,
      isAvailable: food.isAvailable !== false,
    });
    setEditImage(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([k, v]) => formData.append(k, v));
      if (editImage) formData.append('image', editImage);
      await api.put(`/foods/${editFood._id}`, formData);
      toast.success('Dish updated successfully');
      setShowEditModal(false);
      fetchFoods();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Delete "${food.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/foods/${food._id}`);
      toast.success(`"${food.name}" deleted`);
      fetchFoods();
    } catch {
      toast.error('Failed to delete dish');
    }
  };

  const handleToggleAvailable = async (food) => {
    try {
      await api.put(`/foods/${food._id}`, { isAvailable: !food.isAvailable });
      toast.success(`"${food.name}" ${food.isAvailable ? 'hidden from menu' : 'shown on menu'}`);
      fetchFoods();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const generateAIDesc = async () => {
    if (!editForm.name) { toast.error('Enter dish name first'); return; }
    setGeneratingDesc(true);
    try {
      const { data } = await api.post('/ai/generate-description', {
        foodName: editForm.name,
        ingredients: editForm.ingredients.split(',').map((i) => i.trim()),
        category: categories.find((c) => c._id === editForm.category)?.name,
        isVeg: editForm.isVeg,
      });
      setEditForm((p) => ({ ...p, description: data.description }));
      toast.success('AI description generated!');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Group by category
  const grouped = foods.reduce((acc, food) => {
    const cat = food.category?.name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(food);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">My Menu</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{foods.length} dishes on your menu</p>
        </div>
        <Link to="/restaurant/add-food" className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add New Dish
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFoods()}
            placeholder="Search dishes..."
            className="input-field pl-9"
          />
        </div>
        <button onClick={fetchFoods} className="btn-secondary px-4">Search</button>
      </div>

      {/* Menu grouped by category */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-52 shimmer rounded-2xl" />)}
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No dishes yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mt-2">Start adding dishes to your menu</p>
          <Link to="/restaurant/add-food" className="btn-primary mt-6 inline-flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Add First Dish
          </Link>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-dark-border">
              {category} <span className="text-sm font-normal text-gray-400">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((food) => (
                <div key={food._id} className={`card overflow-hidden group ${!food.isAvailable ? 'opacity-60' : ''}`}>
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100 dark:bg-dark-bg overflow-hidden">
                    {food.image?.url ? (
                      <img src={food.image.url} alt={food.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                    )}
                    {/* Veg/Non-veg badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`badge text-xs ${food.isVeg ? 'badge-green' : 'badge-red'}`}>
                        {food.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    </div>
                    {/* Availability toggle */}
                    <button
                      onClick={() => handleToggleAvailable(food)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-dark-card/90 rounded-lg shadow"
                      title={food.isAvailable ? 'Hide from menu' : 'Show on menu'}
                    >
                      {food.isAvailable
                        ? <FiToggleRight className="w-4 h-4 text-green-500" />
                        : <FiToggleLeft className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{food.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="font-bold text-primary-500">₹{food.discountPrice || food.price}</span>
                        {food.discountPrice && food.discountPrice < food.price && (
                          <span className="text-xs text-gray-400 line-through ml-1">₹{food.price}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">Stock: {food.stock}</span>
                    </div>
                    {!food.isAvailable && (
                      <p className="text-xs text-red-500 font-medium mt-1">Hidden from menu</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openEdit(food)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(food)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {showEditModal && editFood && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-5">Edit: {editFood.name}</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dish Name *</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} className="input-field">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Price (₹)</label>
                  <input type="number" value={editForm.discountPrice} onChange={(e) => setEditForm((p) => ({ ...p, discountPrice: e.target.value }))} min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm((p) => ({ ...p, stock: e.target.value }))} min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prep Time (min)</label>
                  <input type="number" value={editForm.preparationTime} onChange={(e) => setEditForm((p) => ({ ...p, preparationTime: e.target.value }))} min="0" className="input-field" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button type="button" onClick={generateAIDesc} disabled={generatingDesc} className="text-xs text-primary-500 flex items-center gap-1 hover:text-primary-600">
                    <FiZap className="w-3 h-3" /> {generatingDesc ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingredients (comma-separated)</label>
                <input type="text" value={editForm.ingredients} onChange={(e) => setEditForm((p) => ({ ...p, ingredients: e.target.value }))} placeholder="Tomato, Cheese, Basil" className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Update Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files[0])} className="input-field" />
                {editFood.image?.url && !editImage && (
                  <img src={editFood.image.url} alt="current" className="mt-2 h-20 rounded-lg object-cover" />
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.isVeg} onChange={(e) => setEditForm((p) => ({ ...p, isVeg: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.isAvailable} onChange={(e) => setEditForm((p) => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Available on menu</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenuPage;
