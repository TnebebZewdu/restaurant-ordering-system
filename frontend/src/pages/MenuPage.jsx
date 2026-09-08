import React, { useEffect, useState } from 'react';
import { useCustomer } from '../context/CustomerContext';

const MenuPage = () => {
  const { addToCart } = useCustomer();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedItemId, setAddedItemId] = useState(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const [menuRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:5000/api/menu'),
          fetch('http://localhost:5000/api/categories')
        ]);

        const menuData = await menuRes.json();
        const categoriesData = await categoriesRes.json();

        setMenuItems(Array.isArray(menuData) ? menuData : []);
        setCategories(
          Array.isArray(categoriesData) ? categoriesData : []
        );
      } catch (error) {
        console.error('Menu Loading Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const handleAddToCart = (item) => {
    addToCart(item);

    setAddedItemId(item.id);

    setTimeout(() => {
      setAddedItemId(null);
    }, 1000);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      Number(item.category_id) === Number(selectedCategory);

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="space-y-6">

      {/* Menu Header + Search */}
      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Our Menu
          </h1>

          <p className="text-gray-500 mt-1">
            Choose your favorite food and add it to your cart.
          </p>
        </div>

        {/* Compact Search */}
        <div className="w-56 sm:w-64 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search food..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-orange-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-5 py-2 rounded-full font-semibold whitespace-nowrap transition ${
            selectedCategory === 'All'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
          }`}
        >
          All
        </button>

        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-5 py-2 rounded-full font-semibold whitespace-nowrap transition ${
              Number(selectedCategory) === Number(category.id)
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          Loading menu...
        </div>
      )}

      {/* Menu Items */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-orange-100"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-4">
                <div className="flex justify-between items-start gap-3">

                  <div>
                    <h3 className="font-bold text-gray-900">
                      {item.name}
                    </h3>

                    <p className="text-orange-600 font-bold mt-1">
                      {Number(item.price).toFixed(2)} ETB
                    </p>
                  </div>

                  {!item.is_available && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      Unavailable
                    </span>
                  )}

                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.is_available}
                  className={`w-full mt-4 text-white font-semibold py-2.5 rounded-xl transition ${
                    !item.is_available
                      ? 'bg-gray-300 cursor-not-allowed'
                      : addedItemId === item.id
                      ? 'bg-emerald-500'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {!item.is_available
                    ? 'Unavailable'
                    : addedItemId === item.id
                    ? '✓ Added to Cart'
                    : 'Add to Cart'}
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No food items found.
        </div>
      )}

    </section>
  );
};

export default MenuPage;