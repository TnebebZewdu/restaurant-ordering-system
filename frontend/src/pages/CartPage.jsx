import React from 'react';
import { useCustomer } from '../context/CustomerContext';

const CartPage = () => {
  const {
    cart,
    updateQuantity,
    updateNotes,
    totalAmount,
    tableNumber,
    setTableNumber,
    orderType,
    setOrderType,
    isSubmitting,
    handlePlaceOrder
  } = useCustomer();

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <section
      id="cart"
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">

        {/* Cart Header */}
        <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              🛒 Your Cart
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              Review your items before placing your order.
            </p>
          </div>

          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty Cart */
          <div className="py-10 text-center">
            <div className="text-5xl mb-3">
              🛒
            </div>

            <h3 className="text-lg font-bold text-gray-800">
              Your cart is empty
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Add some delicious food from the menu.
            </p>
          </div>
        ) : (
          <div className="p-4">

            {/* Cart Items */}
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="border border-orange-100 rounded-xl p-2.5"
                >
                  <div className="flex items-center gap-3">

                    {/* Food Image */}
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />

                    {/* Food Information */}
                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-gray-900 truncate">
                            {item.name}
                          </h3>

                          <p className="text-xs text-orange-600 font-semibold">
                            {Number(item.price).toFixed(2)} ETB
                          </p>
                        </div>

                        <p className="font-extrabold text-sm text-gray-900 whitespace-nowrap">
                          {(item.price * item.quantity).toFixed(2)} ETB
                        </p>

                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center mt-1.5">
                        <div className="flex items-center border border-orange-200 rounded-lg overflow-hidden">

                          <button
                            onClick={() =>
                              updateQuantity(item.id, -1)
                            }
                            className="w-7 h-7 flex items-center justify-center bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition"
                          >
                            −
                          </button>

                          <span className="w-8 h-7 flex items-center justify-center text-xs font-bold border-x border-orange-200">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(item.id, 1)
                            }
                            className="w-7 h-7 flex items-center justify-center bg-orange-500 text-white font-bold hover:bg-orange-600 transition"
                          >
                            +
                          </button>

                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Special Instructions */}
                  <textarea
                    value={item.notes || ''}
                    onChange={(e) =>
                      updateNotes(item.id, e.target.value)
                    }
                    placeholder="Special instructions (optional)"
                    rows="1"
                    className="w-full mt-2 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />

                </div>
              ))}
            </div>

            {/* Checkout Area */}
            <div className="mt-3 pt-3 border-t border-orange-100">

              {/* Order Type */}
              <div className="flex items-center gap-3">

                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  Order Type
                </span>

                <div className="flex gap-2 flex-1">

                  <button
                    onClick={() => setOrderType('dine_in')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                      orderType === 'dine_in'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    🍽️ Dine In
                  </button>

                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                      orderType === 'takeaway'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    🥡 Takeaway
                  </button>

                </div>
              </div>

              {/* Table Number */}
              {orderType === 'dine_in' && (
                <div className="flex items-center gap-3 mt-2">

                  <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Table Number
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={tableNumber}
                    onChange={(e) =>
                      setTableNumber(e.target.value)
                    }
                    placeholder="Enter table number"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />

                </div>
              )}

              {/* Total + Place Order */}
              <div className="mt-3 pt-3 border-t border-orange-100 flex items-center justify-between gap-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Total
                  </p>

                  <p className="text-2xl font-extrabold text-orange-600">
                    {totalAmount.toFixed(2)} ETB
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                >
                  {isSubmitting
                    ? 'Placing...'
                    : 'Place Order'}
                </button>

              </div>

            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CartPage;