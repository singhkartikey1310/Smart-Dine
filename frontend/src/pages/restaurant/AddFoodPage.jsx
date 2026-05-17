import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiArrowLeft, FiUpload } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const AddFoodPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '',
    category: '', ingredients: '', tags: '',
    preparationTime: '20', isVeg: false, stock: '100',
    spiceLevel: 'mild',
  });

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const generateAIDesc = async () => {
    if (!form.name) { toast.error('Enter dish name first'); return; }
    setGeneratingDesc(true);
    try {
      const { data } = await api.post('/ai/generate-description', {
        foodName: form.name,
        ingredients: form.ingredients.split(',').map((i) => i.trim()).filter(Boolean),
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price and category are required');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imageFile) formData.append('image', imageFile);

      await api.post('/foods', formData);
      toast.success('Dish added to menu!');
      navigate('/restaurant');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add dish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/restaurant')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card transition-colors">
          <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Add New Dish</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Add a new dish to your restaurant menu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo upload */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">📸 Dish Photo</h2>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-bg flex-shrink-0 border-2 border-dashed border-gray-300 dark:border-dark-border">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <FiUpload className="w-8 h-8 mb-1" />
                  <span className="text-xs">Upload photo</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm">
                <FiUpload className="w-4 h-4" />
                {imageFile ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="sr-only" />
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG or WebP. Max 5MB.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Recommended: square image, min 400×400px</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">🍽️ Dish Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dish Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Butter Chicken" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
              <select value={form.category} onChange={set('category')} required className="input-field">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <button type="button" onClick={generateAIDesc} disabled={generatingDesc} className="text-xs text-primary-500 flex items-center gap-1 hover:text-primary-600 font-medium">
                <FiZap className="w-3 h-3" />
                {generatingDesc ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Describe your dish — taste, texture, ingredients..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ingredients (comma-separated)</label>
            <input type="text" value={form.ingredients} onChange={set('ingredients')} placeholder="Chicken, Butter, Cream, Spices" className="input-field" />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">💰 Pricing & Stock</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
              <input type="number" value={form.price} onChange={set('price')} required min="0" placeholder="299" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Discount Price (₹)</label>
              <input type="number" value={form.discountPrice} onChange={set('discountPrice')} min="0" placeholder="249" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stock</label>
              <input type="number" value={form.stock} onChange={set('stock')} min="0" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prep Time (min)</label>
              <input type="number" value={form.preparationTime} onChange={set('preparationTime')} min="0" className="input-field" />
            </div>
          </div>
        </div>

        {/* Type & Spice */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">🌶️ Type & Spice Level</h2>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm((p) => ({ ...p, isVeg: e.target.checked }))} className="w-4 h-4 accent-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🟢 Vegetarian</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spice Level</label>
            <div className="flex gap-2 flex-wrap">
              {['mild', 'medium', 'hot', 'extra_hot'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, spiceLevel: level }))}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                    form.spiceLevel === level
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {level === 'mild' ? '😊 Mild' : level === 'medium' ? '🌶️ Medium' : level === 'hot' ? '🔥 Hot' : '💥 Extra Hot'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding to Menu...
            </span>
          ) : '✅ Add Dish to Menu'}
        </button>
      </form>
    </div>
  );
};

export default AddFoodPage;
