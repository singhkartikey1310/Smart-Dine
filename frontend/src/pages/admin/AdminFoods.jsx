import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiZap } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AdminFoods = () => {
  const { user } = useSelector((state) => state.auth);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '', category: '',
    ingredients: '', tags: '', preparationTime: '', isVeg: false, stock: 100,
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const params = { keyword };
      // For restaurant admin, get their restaurant's foods
      if (user?.role === 'restaurant_admin') {
        const { data: restData } = await api.get('/restaurants/my');
        params.restaurant = restData.restaurant._id;
      }
      const { data } = await api.get('/foods', { params });
      setFoods(data.foods);
    } catch {
      toast.error('Failed to load foods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const openModal = (food = null) => {
    if (food) {
      setEditFood(food);
      setForm({
        name: food.name || '',
        description: food.description || '',
        price: food.price || '',
        discountPrice: food.discountPrice || '',
        category: food.category?._id || food.category || '',
        ingredients: food.ingredients?.join(', ') || '',
        tags: food.tags?.join(', ') || '',
        preparationTime: food.preparationTime || '',
        isVeg: food.isVeg || false,
        stock: food.stock || 100,
      });
    } else {
      setEditFood(null);
      setForm({ name: '', description: '', price: '', discountPrice: '', category: '', ingredients: '', tags: '', preparationTime: '', isVeg: false, stock: 100 });
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editFood) {
        await api.put(`/foods/${editFood._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Food updated');
      } else {
        await api.post('/foods', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Food created');
      }
      setShowModal(false);
      fetchFoods();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save food');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      await api.delete(`/foods/${id}`);
      toast.success('Food deleted');
      fetchFoods();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const generateAIDescription = async () => {
    if (!form.name) { toast.error('Enter food name first'); return; }
    setGeneratingDesc(true);
    try {
      const { data } = await api.post('/ai/generate-description', {
        foodName: form.name,
        ingredients: form.ingredients.split(',').map((i) => i.trim()),
        category: categories.find((c) => c._id === form.category)?.name,
        isVeg: form.isVeg,
      });
      setForm((p) => ({ ...p, description: data.description }));
      toast.success('AI description generated!');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Foods</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{foods.length} items</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Food
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFoods()}
            placeholder="Search foods..."
            className="input-field pl-9"
          />
        </div>
        <button onClick={fetchFoods} className="btn-secondary px-4">Search</button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array(10).fill(0).map((_, i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {foods.map((food) => (
            <div key={food._id} className="card overflow-hidden group">
              <div className="relative h-36 bg-gray-100 dark:bg-dark-bg">
                {food.image?.url ? (
                  <img src={food.image.url} alt={food.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => openModal(food)} className="p-2 bg-white rounded-lg text-blue-500 hover:bg-blue-50">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(food._id)} className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-50">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{food.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-primary-500 font-bold text-sm">₹{food.price}</span>
                  <span className={`badge text-xs ${food.isVeg ? 'badge-green' : 'badge-red'}`}>
                    {food.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Stock: {food.stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg mb-6">
              {editFood ? 'Edit Food' : 'Add New Food'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required className="input-field">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Price (₹)</label>
                  <input type="number" value={form.discountPrice} onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))} min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prep Time (min)</label>
                  <input type="number" value={form.preparationTime} onChange={(e) => setForm((p) => ({ ...p, preparationTime: e.target.value }))} min="0" className="input-field" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <button type="button" onClick={generateAIDescription} disabled={generatingDesc} className="text-xs text-primary-500 flex items-center gap-1 hover:text-primary-600">
                    <FiZap className="w-3 h-3" /> {generatingDesc ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ingredients (comma-separated)</label>
                <input type="text" value={form.ingredients} onChange={(e) => setForm((p) => ({ ...p, ingredients: e.target.value }))} placeholder="Tomato, Cheese, Basil" className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="spicy, popular, bestseller" className="input-field" />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((p) => ({ ...p, isVeg: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Image</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="input-field" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editFood ? 'Update Food' : 'Add Food'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFoods;
