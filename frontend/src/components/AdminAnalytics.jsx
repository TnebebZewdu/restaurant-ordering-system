
import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    topItems: []
  });

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category_id: '',
    image_url: '',
    is_available: 1
  });

  useEffect(() => {
    fetchAnalytics();
    fetchMenuItems();
    fetchCategories();
  }, []);

  // ==================================================
  // ADMIN AUTHENTICATION
  // ==================================================

  const getAdminHeaders = (includeJson = false) => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      throw new Error('Admin session expired. Please log in again.');
    }

    return {
      ...(includeJson
        ? { 'Content-Type': 'application/json' }
        : {}),
      Authorization: `Bearer ${token}`
    };
  };

  // ==================================================
  // ANALYTICS
  // ==================================================

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');

    try {
      const headers = getAdminHeaders();

      const response = await fetch(
        `${API_URL}/api/analytics`,
        {
          method: 'GET',
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          `Failed to load analytics (${response.status})`
        );
      }

      setAnalytics({
        totalOrders: Number(data.totalOrders || 0),
        totalRevenue: Number(data.totalRevenue || 0),
        topItems: Array.isArray(data.topSellingItems)
          ? data.topSellingItems.map((item) => ({
              ...item,
              total_quantity: Number(
                item.total_quantity ?? item.quantity ?? 0
              )
            }))
          : []
      });
    } catch (error) {
      console.error('Analytics Error:', error);

      setAnalyticsError(error.message);

      // IMPORTANT:
      // Do not pretend the database contains zero records
      // when the real problem is authentication/network.
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ==================================================
  // MENU ITEMS
  // ==================================================

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/menu`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Failed to load menu items.'
        );
      }

      setMenuItems(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error('Menu Loading Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // CATEGORIES
  // ==================================================

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/categories`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Failed to load categories.'
        );
      }

      if (Array.isArray(data)) {
        setCategories(data);

        if (data.length > 0) {
          setNewItem((prev) => ({
            ...prev,
            category_id:
              prev.category_id || data[0].id
          }));
        }
      }
    } catch (error) {
      console.error(
        'Category Loading Error:',
        error
      );
    }
  };

  // ==================================================
  // ADD MENU ITEM
  // ==================================================

  const handleAddItem = async (e) => {
    e.preventDefault();

    const price = Number(newItem.price);
    const categoryId = Number(newItem.category_id);

    if (
      !newItem.name.trim() ||
      !newItem.price ||
      !newItem.category_id
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      alert('Please enter a valid price greater than 0.');
      return;
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      alert('Please select a valid category.');
      return;
    }

    try {
      const headers = getAdminHeaders(true);

      const response = await fetch(
        `${API_URL}/api/menu`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...newItem,
            name: newItem.name.trim(),
            price,
            category_id: categoryId,
            is_available: Number(
              newItem.is_available
            )
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Failed to add menu item.'
        );
      }

      alert(
        data.message ||
        'Menu item added successfully!'
      );

      setNewItem({
        name: '',
        price: '',
        category_id:
          categories.length > 0
            ? categories[0].id
            : '',
        image_url: '',
        is_available: 1
      });

      await fetchMenuItems();
      await fetchAnalytics();
    } catch (error) {
      console.error(
        'Add Item Error:',
        error
      );

      alert(error.message);
    }
  };

  // ==================================================
  // TOGGLE AVAILABILITY
  // ==================================================

  const toggleAvailability = async (
    id,
    currentStatus
  ) => {
    const nextStatus =
      currentStatus === 1 ? 0 : 1;

    try {
      const headers =
        getAdminHeaders(true);

      const response = await fetch(
        `${API_URL}/api/menu/${id}/availability`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            is_available:
              nextStatus === 1
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Failed to update availability.'
        );
      }

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_available:
                  nextStatus
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Availability Error:',
        error
      );

      alert(error.message);
    }
  };

  // ==================================================
  // ARCHIVE MENU ITEM
  // ==================================================

  const handleArchiveItem = async (id) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to archive this menu item?\n\n'
        + 'The item will no longer be available to customers, '
        + 'but its historical order records will be preserved.'
      );

    if (!confirmed) {
      return;
    }

    try {
      const headers =
        getAdminHeaders();

      const response = await fetch(
        `${API_URL}/api/menu/${id}`,
        {
          method: 'DELETE',
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          'Failed to archive menu item.'
        );
      }

      alert(
        data.message ||
        'Menu item archived successfully.'
      );

      await fetchMenuItems();
      await fetchAnalytics();
    } catch (error) {
      console.error(
        'Archive Item Error:',
        error
      );

      alert(error.message);
    }
  };

  // ==================================================
  // REFRESH EVERYTHING
  // ==================================================

  const handleRefresh = async () => {
    await Promise.all([
      fetchAnalytics(),
      fetchMenuItems(),
      fetchCategories()
    ]);
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <section className="space-y-6">

      {/* =========================
          HEADER
      ========================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl">
                📊
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Manager Dashboard & Menu Management
                </h1>

                <p className="text-gray-500 text-xs mt-0.5">
                  የሬስቶራንቱን አጠቃላይ የሽያጭ ሁኔታ ይከታተሉ፤ አዳዲስ ምግቦችን ያስተዳድሩ
                </p>
              </div>

            </div>

            <button
              onClick={handleRefresh}
              className="w-fit bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              🔄 ዳታ አድስ (Refresh)
            </button>

          </div>
        </div>
      </div>

      {/* =========================
          ANALYTICS ERROR
      ========================== */}

      {analyticsError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">

          <div className="flex items-start gap-3">

            <div className="text-xl">
              ⚠️
            </div>

            <div className="flex-1">

              <h3 className="font-bold text-red-700">
                Analytics could not be loaded
              </h3>

              <p className="text-sm text-red-600 mt-1">
                {analyticsError}
              </p>

              <p className="text-xs text-red-500 mt-2">
                Your database records have not been deleted.
                Please make sure you are logged in as the manager/admin.
              </p>

              <button
                onClick={fetchAnalytics}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition"
              >
                Try Again
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =========================
          KPI CARDS
      ========================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* TOTAL ORDERS */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">

          <div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              ጠቅላላ የተስተናገዱ ትዕዛዞች
            </p>

            <h3 className="text-3xl font-black text-gray-900 mt-1">
              {analyticsLoading
                ? '...'
                : analytics.totalOrders}
            </h3>

          </div>

          <div className="w-12 h-12 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl">
            📦
          </div>

        </div>

        {/* TOTAL REVENUE */}

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">

          <div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              ጠቅላላ የተሰበሰበ ገቢ
            </p>

            <h3 className="text-3xl font-black text-emerald-600 mt-1">

              {analyticsLoading
                ? '...'
                : Number(
                    analytics.totalRevenue || 0
                  ).toFixed(2)}

              <span className="text-xs font-bold text-gray-500 ml-1">
                ETB
              </span>

            </h3>

          </div>

          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            💵
          </div>

        </div>

      </div>

      {/* =========================
          TOP SELLING ITEMS
      ========================== */}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 space-y-5">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span>🔥</span>
              በብዛት የተሸጡ ምግቦች
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              Top Selling Items
            </p>

          </div>

          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg">
            📈
          </div>

        </div>

        {analyticsLoading ? (

          <div className="text-center py-8 text-gray-400">
            <span className="text-2xl block mb-2">
              ⏳
            </span>

            <p className="text-xs font-medium">
              Loading analytics...
            </p>
          </div>

        ) : analytics.topItems.length === 0 ? (

          <div className="text-center py-8 text-gray-400">

            <span className="text-3xl block mb-2">
              📈
            </span>

            <p className="text-xs font-medium">
              እስካሁን የተሸጠ ምንም ምግብ የለም
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {analytics.topItems.map(
              (item, index) => {

                const quantity =
                  Number(
                    item.total_quantity || 0
                  );

                const firstQuantity =
                  Number(
                    analytics.topItems[0]
                      ?.total_quantity || 1
                  );

                return (
                  <div
                    key={
                      item.id ??
                      `${item.name}-${index}`
                    }
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >

                    <div className="flex justify-between items-center text-xs font-bold gap-3">

                      <span className="text-gray-700 flex items-center gap-2 min-w-0">

                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black flex-shrink-0 ${
                            index === 0
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-white text-gray-500 border border-gray-200'
                          }`}
                        >
                          {index + 1}
                        </span>

                        <span className="truncate">
                          {item.name}
                        </span>

                      </span>

                      <span className="text-indigo-600 font-extrabold whitespace-nowrap">
                        {quantity} ተሸጧል
                      </span>

                    </div>

                    <div className="w-full bg-white h-2.5 rounded-full overflow-hidden mt-2.5 border border-gray-100">

                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (quantity /
                              firstQuantity) *
                              100,
                            100
                          )}%`
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* =========================
          ADD NEW MENU ITEM
      ========================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">

        <div className="px-5 py-4 border-b border-orange-100 bg-orange-50/40">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-xl">
              🍔
            </div>

            <div>

              <h2 className="text-lg font-black text-gray-900">
                Add New Menu Item
              </h2>

              <p className="text-xs text-gray-500 mt-0.5">
                አዲስ ምግብ ወደ ምናሌው ያክሉ
              </p>

            </div>

          </div>

        </div>

        <form
          onSubmit={handleAddItem}
          className="p-5"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* NAME */}

            <div>

              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Food Name
              </label>

              <input
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    name: e.target.value
                  })
                }
                placeholder="e.g. Special Burger"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition"
              />

            </div>

            {/* PRICE */}

            <div>

              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Price (ETB)
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    price: e.target.value
                  })
                }
                placeholder="e.g. 350"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition"
              />

            </div>

            {/* CATEGORY */}

            <div>

              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Category
              </label>

              <select
                value={newItem.category_id}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    category_id:
                      e.target.value
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition"
              >

                {categories.length === 0 && (
                  <option value="">
                    No categories available
                  </option>
                )}

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* IMAGE URL */}

            <div>

              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Image URL
              </label>

              <input
                type="text"
                value={newItem.image_url}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    image_url:
                      e.target.value
                  })
                }
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition"
              />

            </div>

          </div>

          {/* AVAILABILITY */}

          <div className="mt-4 flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">

            <div>

              <p className="text-xs font-bold text-gray-800">
                Available for customers
              </p>

              <p className="text-[11px] text-gray-500 mt-0.5">
                Customers can order this item immediately.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setNewItem({
                  ...newItem,
                  is_available:
                    newItem.is_available === 1
                      ? 0
                      : 1
                })
              }
              className={`relative w-11 h-6 rounded-full transition ${
                newItem.is_available === 1
                  ? 'bg-orange-500'
                  : 'bg-gray-300'
              }`}
            >

              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition ${
                  newItem.is_available === 1
                    ? 'left-6'
                    : 'left-1'
                }`}
              />

            </button>

          </div>

          {/* SUBMIT */}

          <div className="mt-4 flex justify-end">

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition shadow-sm"
            >
              ➕ Add Menu Item
            </button>

          </div>

        </form>

      </div>

      {/* =========================
          MANAGE CATALOG
      ========================== */}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2 className="text-lg font-black text-gray-900">
              Manage Menu Catalog
            </h2>

            <p className="text-xs text-gray-500 mt-1">
              View, enable, disable, or archive menu items.
            </p>

          </div>

          <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            {menuItems.length} Items
          </div>

        </div>

        {loading ? (

          <div className="text-center py-8 text-gray-400">
            Loading menu...
          </div>

        ) : menuItems.length === 0 ? (

          <div className="text-center py-8 text-gray-400">
            No menu items available.
          </div>

        ) : (

          <div className="space-y-3">

            {menuItems.map(
              (item) => (

                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                >

                  <div className="flex items-center gap-3 min-w-0">

                    {item.image_url ? (

                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display =
                            'none';
                        }}
                      />

                    ) : (

                      <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-xl">
                        🍽️
                      </div>

                    )}

                    <div className="min-w-0">

                      <h3 className="font-bold text-sm text-gray-900 truncate">
                        {item.name}
                      </h3>

                      <p className="text-xs text-indigo-600 font-semibold">
                        {Number(
                          item.price || 0
                        ).toFixed(2)} ETB
                      </p>

                    </div>

                  </div>

                  <div className="flex items-center gap-2">

                    {/* AVAILABILITY */}

                    <button
                      onClick={() =>
                        toggleAvailability(
                          item.id,
                          Number(
                            item.is_available
                          )
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        Number(
                          item.is_available
                        ) === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {Number(
                        item.is_available
                      ) === 1
                        ? 'Available'
                        : 'Unavailable'}
                    </button>

                    {/* ARCHIVE */}

                    <button
                      onClick={() =>
                        handleArchiveItem(
                          item.id
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
                    >
                      Archive
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>
  );
};

export default AdminAnalytics;
