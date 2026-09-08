import React from 'react';
import { useCustomer } from '../context/CustomerContext';

const OrderPage = () => {
  const { orderId, orderStatus } = useCustomer();

  const getStatusInfo = () => {
    switch (orderStatus) {
      case 'pending':
        return {
          title: 'Order Received',
          message: 'Your order has been received and is waiting to be prepared.',
          icon: '🕐',
          step: 1
        };

      case 'preparing':
        return {
          title: 'Preparing Your Order',
          message: 'The kitchen is currently preparing your delicious food.',
          icon: '👨‍🍳',
          step: 2
        };

      case 'completed':
        return {
          title: 'Order Ready!',
          message: 'Your order is ready. Enjoy your meal!',
          icon: '✅',
          step: 3
        };

      case 'cancelled':
        return {
          title: 'Order Cancelled',
          message: 'Unfortunately, your order has been cancelled.',
          icon: '❌',
          step: 0
        };

      default:
        return {
          title: 'No Active Order',
          message: 'You have not placed an order yet.',
          icon: '🛍️',
          step: 0
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <section
      id="order"
      className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 md:p-8"
    >
      <div className="text-center">
        <div className="text-5xl mb-4">
          {statusInfo.icon}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          {statusInfo.title}
        </h2>

        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          {statusInfo.message}
        </p>

        {orderId && (
          <div className="inline-flex items-center mt-4 px-4 py-2 rounded-full bg-orange-50 text-orange-700 font-semibold">
            Order #{orderId}
          </div>
        )}
      </div>

      {orderId && orderStatus !== 'cancelled' && (
        <div className="max-w-2xl mx-auto mt-10">
          {/* Progress */}
          <div className="flex items-center">
            {/* Pending */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  statusInfo.step >= 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                ✓
              </div>

              <span className="mt-2 text-sm font-semibold text-gray-700">
                Pending
              </span>
            </div>

            <div
              className={`h-1 flex-1 ${
                statusInfo.step >= 2
                  ? 'bg-orange-500'
                  : 'bg-gray-200'
              }`}
            />

            {/* Preparing */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  statusInfo.step >= 2
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                👨‍🍳
              </div>

              <span className="mt-2 text-sm font-semibold text-gray-700">
                Preparing
              </span>
            </div>

            <div
              className={`h-1 flex-1 ${
                statusInfo.step >= 3
                  ? 'bg-orange-500'
                  : 'bg-gray-200'
              }`}
            />

            {/* Completed */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  statusInfo.step >= 3
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                ✓
              </div>

              <span className="mt-2 text-sm font-semibold text-gray-700">
                Ready
              </span>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-8 p-5 rounded-2xl bg-orange-50 border border-orange-100 text-center">
            <p className="text-sm text-orange-600 font-semibold">
              Current Status
            </p>

            <p className="text-xl font-extrabold text-orange-700 mt-1 capitalize">
              {orderStatus}
            </p>
          </div>
        </div>
      )}

      {!orderId && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Place an order from the Cart page to track it here.
          </p>
        </div>
      )}
    </section>
  );
};

export default OrderPage;