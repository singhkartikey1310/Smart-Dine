require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Category = require('./models/Category');
const Restaurant = require('./models/Restaurant');
const Food = require('./models/Food');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB Connected for seeding');
};

const seed = async () => {
  await connectDB();

  console.log('🌱 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Restaurant.deleteMany({}),
    Food.deleteMany({}),
  ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@smartdine.com',
    password: 'password123',
    role: 'super_admin',
    isEmailVerified: true,
  });

  const restAdmin = await User.create({
    name: 'Restaurant Owner',
    email: 'owner@smartdine.com',
    password: 'password123',
    role: 'restaurant_admin',
    isEmailVerified: true,
  });

  const customer = await User.create({
    name: 'John Customer',
    email: 'customer@smartdine.com',
    password: 'password123',
    role: 'customer',
    isEmailVerified: true,
    phone: '9876543210',
  });

  // ── Categories ─────────────────────────────────────────────────────────────
  console.log('📂 Creating categories...');
  const categories = await Category.insertMany([
    { name: 'Pizza', sortOrder: 1 },
    { name: 'Burger', sortOrder: 2 },
    { name: 'Biryani', sortOrder: 3 },
    { name: 'Chinese', sortOrder: 4 },
    { name: 'South Indian', sortOrder: 5 },
    { name: 'Desserts', sortOrder: 6 },
    { name: 'Beverages', sortOrder: 7 },
    { name: 'Pasta', sortOrder: 8 },
  ]);

  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c._id; });

  // ── Restaurants ────────────────────────────────────────────────────────────
  console.log('🏪 Creating restaurants...');
  const restaurants = await Restaurant.insertMany([
    {
      owner: restAdmin._id,
      name: 'Pizza Palace',
      description: 'Authentic Italian pizzas made with fresh ingredients and wood-fired ovens.',
      cuisines: ['Italian', 'Pizza', 'Pasta'],
      address: { street: '12 MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
      contact: { phone: '9876543210', email: 'pizza@smartdine.com' },
      isApproved: true,
      isOpen: true,
      isFeatured: true,
      rating: { average: 4.5, count: 128 },
      deliveryInfo: { minOrder: 200, deliveryFee: 30, estimatedTime: '25-35 mins', freeDeliveryAbove: 500 },
      openingHours: {
        monday: { open: '10:00', close: '23:00' },
        tuesday: { open: '10:00', close: '23:00' },
        wednesday: { open: '10:00', close: '23:00' },
        thursday: { open: '10:00', close: '23:00' },
        friday: { open: '10:00', close: '23:59' },
        saturday: { open: '10:00', close: '23:59' },
        sunday: { open: '11:00', close: '22:00' },
      },
      tags: ['popular', 'family', 'dine-in'],
      totalOrders: 450,
      totalRevenue: 85000,
    },
    {
      owner: restAdmin._id,
      name: 'Burger Barn',
      description: 'Juicy gourmet burgers with hand-crafted patties and fresh toppings.',
      cuisines: ['American', 'Burgers', 'Fast Food'],
      address: { street: '45 Koramangala', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
      contact: { phone: '9876543211', email: 'burger@smartdine.com' },
      isApproved: true,
      isOpen: true,
      isFeatured: true,
      rating: { average: 4.3, count: 95 },
      deliveryInfo: { minOrder: 150, deliveryFee: 25, estimatedTime: '20-30 mins', freeDeliveryAbove: 400 },
      openingHours: {
        monday: { open: '11:00', close: '23:00' },
        tuesday: { open: '11:00', close: '23:00' },
        wednesday: { open: '11:00', close: '23:00' },
        thursday: { open: '11:00', close: '23:00' },
        friday: { open: '11:00', close: '23:59' },
        saturday: { open: '10:00', close: '23:59' },
        sunday: { open: '11:00', close: '22:00' },
      },
      tags: ['fast food', 'quick bite'],
      totalOrders: 320,
      totalRevenue: 52000,
    },
    {
      owner: superAdmin._id,
      name: 'Biryani House',
      description: 'Authentic Hyderabadi dum biryani cooked in traditional style with aromatic spices.',
      cuisines: ['Indian', 'Biryani', 'Mughlai'],
      address: { street: '78 Indiranagar', city: 'Bangalore', state: 'Karnataka', pincode: '560038' },
      contact: { phone: '9876543212', email: 'biryani@smartdine.com' },
      isApproved: true,
      isOpen: true,
      isFeatured: true,
      rating: { average: 4.7, count: 210 },
      deliveryInfo: { minOrder: 250, deliveryFee: 0, estimatedTime: '35-45 mins', freeDeliveryAbove: 0 },
      openingHours: {
        monday: { open: '12:00', close: '23:00' },
        tuesday: { open: '12:00', close: '23:00' },
        wednesday: { open: '12:00', close: '23:00' },
        thursday: { open: '12:00', close: '23:00' },
        friday: { open: '12:00', close: '23:59' },
        saturday: { open: '11:00', close: '23:59' },
        sunday: { open: '11:00', close: '23:00' },
      },
      tags: ['biryani', 'halal', 'family'],
      totalOrders: 680,
      totalRevenue: 142000,
    },
    {
      owner: superAdmin._id,
      name: 'Dragon Wok',
      description: 'Authentic Chinese cuisine with Indo-Chinese fusion dishes.',
      cuisines: ['Chinese', 'Asian', 'Indo-Chinese'],
      address: { street: '23 HSR Layout', city: 'Bangalore', state: 'Karnataka', pincode: '560102' },
      contact: { phone: '9876543213', email: 'dragon@smartdine.com' },
      isApproved: true,
      isOpen: true,
      isFeatured: false,
      rating: { average: 4.2, count: 76 },
      deliveryInfo: { minOrder: 200, deliveryFee: 40, estimatedTime: '30-40 mins' },
      openingHours: {
        monday: { open: '11:00', close: '22:30' },
        tuesday: { open: '11:00', close: '22:30' },
        wednesday: { open: '11:00', close: '22:30' },
        thursday: { open: '11:00', close: '22:30' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '22:00' },
      },
      tags: ['chinese', 'noodles', 'fried rice'],
      totalOrders: 230,
      totalRevenue: 38000,
    },
  ]);

  const [pizzaPalace, burgerBarn, biryaniHouse, dragonWok] = restaurants;

  // ── Foods ──────────────────────────────────────────────────────────────────
  console.log('🍕 Creating food items...');
  await Food.insertMany([
    // Pizza Palace
    {
      name: 'Margherita Pizza',
      description: 'Classic pizza with fresh tomato sauce, mozzarella cheese, and basil leaves.',
      price: 299,
      discountPrice: 249,
      category: catMap['Pizza'],
      restaurant: pizzaPalace._id,
      rating: { average: 4.6, count: 89 },
      stock: 50,
      ingredients: ['Tomato Sauce', 'Mozzarella', 'Basil', 'Olive Oil'],
      preparationTime: 20,
      tags: ['bestseller', 'veg'],
      isVeg: true,
      isAvailable: true,
      isPopular: true,
      totalOrders: 156,
      spiceLevel: 'mild',
    },
    {
      name: 'Pepperoni Pizza',
      description: 'Loaded with premium pepperoni slices on a rich tomato base with melted cheese.',
      price: 399,
      discountPrice: 349,
      category: catMap['Pizza'],
      restaurant: pizzaPalace._id,
      rating: { average: 4.7, count: 112 },
      stock: 40,
      ingredients: ['Pepperoni', 'Tomato Sauce', 'Mozzarella', 'Oregano'],
      preparationTime: 22,
      tags: ['bestseller', 'non-veg'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 198,
      spiceLevel: 'mild',
    },
    {
      name: 'Penne Arrabbiata',
      description: 'Spicy penne pasta in a fiery tomato sauce with garlic and red chillies.',
      price: 249,
      category: catMap['Pasta'],
      restaurant: pizzaPalace._id,
      rating: { average: 4.3, count: 45 },
      stock: 30,
      ingredients: ['Penne', 'Tomato', 'Garlic', 'Red Chilli', 'Olive Oil'],
      preparationTime: 18,
      tags: ['spicy', 'veg'],
      isVeg: true,
      isAvailable: true,
      totalOrders: 67,
      spiceLevel: 'hot',
    },
    {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream.',
      price: 199,
      category: catMap['Desserts'],
      restaurant: pizzaPalace._id,
      rating: { average: 4.8, count: 34 },
      stock: 20,
      ingredients: ['Mascarpone', 'Espresso', 'Ladyfingers', 'Cocoa'],
      preparationTime: 5,
      tags: ['dessert', 'sweet'],
      isVeg: true,
      isAvailable: true,
      totalOrders: 45,
      spiceLevel: 'mild',
    },

    // Burger Barn
    {
      name: 'Classic Beef Burger',
      description: 'Juicy beef patty with lettuce, tomato, onion, and our secret sauce in a brioche bun.',
      price: 249,
      discountPrice: 219,
      category: catMap['Burger'],
      restaurant: burgerBarn._id,
      rating: { average: 4.5, count: 78 },
      stock: 45,
      ingredients: ['Beef Patty', 'Brioche Bun', 'Lettuce', 'Tomato', 'Secret Sauce'],
      preparationTime: 15,
      tags: ['bestseller', 'non-veg'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 134,
      spiceLevel: 'mild',
    },
    {
      name: 'Veggie Delight Burger',
      description: 'Crispy veggie patty with fresh vegetables and chipotle mayo.',
      price: 199,
      category: catMap['Burger'],
      restaurant: burgerBarn._id,
      rating: { average: 4.2, count: 42 },
      stock: 35,
      ingredients: ['Veggie Patty', 'Bun', 'Lettuce', 'Tomato', 'Chipotle Mayo'],
      preparationTime: 12,
      tags: ['veg', 'healthy'],
      isVeg: true,
      isAvailable: true,
      totalOrders: 89,
      spiceLevel: 'mild',
    },
    {
      name: 'Loaded Cheese Fries',
      description: 'Crispy fries loaded with melted cheddar, jalapeños, and sour cream.',
      price: 149,
      category: catMap['Burger'],
      restaurant: burgerBarn._id,
      rating: { average: 4.4, count: 56 },
      stock: 60,
      ingredients: ['Potato', 'Cheddar', 'Jalapeño', 'Sour Cream'],
      preparationTime: 10,
      tags: ['snack', 'veg'],
      isVeg: true,
      isAvailable: true,
      isPopular: true,
      totalOrders: 112,
      spiceLevel: 'medium',
    },

    // Biryani House
    {
      name: 'Hyderabadi Chicken Biryani',
      description: 'Authentic dum biryani with tender chicken, aromatic basmati rice, and saffron.',
      price: 349,
      discountPrice: 299,
      category: catMap['Biryani'],
      restaurant: biryaniHouse._id,
      rating: { average: 4.8, count: 167 },
      stock: 30,
      ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Fried Onions', 'Spices'],
      preparationTime: 40,
      tags: ['bestseller', 'non-veg', 'dum'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 289,
      spiceLevel: 'medium',
    },
    {
      name: 'Veg Dum Biryani',
      description: 'Fragrant basmati rice cooked with fresh vegetables and whole spices.',
      price: 249,
      category: catMap['Biryani'],
      restaurant: biryaniHouse._id,
      rating: { average: 4.5, count: 89 },
      stock: 25,
      ingredients: ['Basmati Rice', 'Mixed Vegetables', 'Saffron', 'Spices'],
      preparationTime: 35,
      tags: ['veg', 'dum'],
      isVeg: true,
      isAvailable: true,
      isPopular: true,
      totalOrders: 145,
      spiceLevel: 'medium',
    },
    {
      name: 'Mutton Biryani',
      description: 'Slow-cooked mutton with aged basmati rice and traditional spices.',
      price: 449,
      category: catMap['Biryani'],
      restaurant: biryaniHouse._id,
      rating: { average: 4.9, count: 134 },
      stock: 20,
      ingredients: ['Basmati Rice', 'Mutton', 'Saffron', 'Fried Onions', 'Spices'],
      preparationTime: 50,
      tags: ['premium', 'non-veg'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 198,
      spiceLevel: 'hot',
    },
    {
      name: 'Raita',
      description: 'Cooling yogurt with cucumber, mint, and spices — perfect with biryani.',
      price: 79,
      category: catMap['South Indian'],
      restaurant: biryaniHouse._id,
      rating: { average: 4.3, count: 45 },
      stock: 50,
      ingredients: ['Yogurt', 'Cucumber', 'Mint', 'Cumin'],
      preparationTime: 5,
      tags: ['side dish', 'veg'],
      isVeg: true,
      isAvailable: true,
      totalOrders: 234,
      spiceLevel: 'mild',
    },

    // Dragon Wok
    {
      name: 'Chicken Fried Rice',
      description: 'Wok-tossed rice with chicken, eggs, vegetables, and soy sauce.',
      price: 199,
      discountPrice: 179,
      category: catMap['Chinese'],
      restaurant: dragonWok._id,
      rating: { average: 4.3, count: 67 },
      stock: 40,
      ingredients: ['Rice', 'Chicken', 'Egg', 'Soy Sauce', 'Spring Onion'],
      preparationTime: 20,
      tags: ['bestseller', 'non-veg'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 123,
      spiceLevel: 'mild',
    },
    {
      name: 'Veg Hakka Noodles',
      description: 'Stir-fried noodles with fresh vegetables in a savory sauce.',
      price: 169,
      category: catMap['Chinese'],
      restaurant: dragonWok._id,
      rating: { average: 4.1, count: 43 },
      stock: 35,
      ingredients: ['Noodles', 'Cabbage', 'Carrot', 'Bell Pepper', 'Soy Sauce'],
      preparationTime: 15,
      tags: ['veg', 'noodles'],
      isVeg: true,
      isAvailable: true,
      totalOrders: 87,
      spiceLevel: 'mild',
    },
    {
      name: 'Chilli Chicken',
      description: 'Crispy chicken tossed in a spicy Indo-Chinese sauce with peppers and onions.',
      price: 279,
      category: catMap['Chinese'],
      restaurant: dragonWok._id,
      rating: { average: 4.5, count: 89 },
      stock: 30,
      ingredients: ['Chicken', 'Bell Pepper', 'Onion', 'Chilli Sauce', 'Soy Sauce'],
      preparationTime: 25,
      tags: ['spicy', 'non-veg', 'bestseller'],
      isVeg: false,
      isAvailable: true,
      isPopular: true,
      totalOrders: 156,
      spiceLevel: 'hot',
    },
    {
      name: 'Mango Lassi',
      description: 'Refreshing yogurt-based drink blended with fresh Alphonso mangoes.',
      price: 99,
      category: catMap['Beverages'],
      restaurant: biryaniHouse._id,
      rating: { average: 4.6, count: 78 },
      stock: 50,
      ingredients: ['Yogurt', 'Mango', 'Sugar', 'Cardamom'],
      preparationTime: 5,
      tags: ['drink', 'veg', 'sweet'],
      isVeg: true,
      isAvailable: true,
      isPopular: true,
      totalOrders: 167,
      spiceLevel: 'mild',
    },
  ]);

  console.log('');
  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo Login Credentials:');
  console.log('  Super Admin : admin@smartdine.com    / password123');
  console.log('  Rest. Owner : owner@smartdine.com    / password123');
  console.log('  Customer    : customer@smartdine.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
