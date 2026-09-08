import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useReactToPrint } from 'react-to-print';
import Receipt from './Receipt';

const API_URL = 'http://localhost:5000';

const KitchenView = () => {
  const [orders, setOrders] = useState([]);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const receiptRef = useRef(null);
  const audioCtxRef = useRef(null);
  const socketRef = useRef(null);

  // ==================================================
  // ================= PRINT RECEIPT ==================
  // ==================================================

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  useEffect(() => {
    if (selectedOrder) {
      handlePrint();
    }
  }, [selectedOrder, handlePrint]);

  const printOrderReceipt = (order) => {
    setSelectedOrder(order);
  };

  // ==================================================
  // ================= AUDIO ==========================
  // ==================================================

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current =
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();
      }

      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        587.33,
        ctx.currentTime
      );

      gain.gain.setValueAtTime(
        0.2,
        ctx.currentTime
      );

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      oscillator.stop(
        ctx.currentTime + 0.4
      );
    } catch (error) {
      console.error(
        'Audio playback error:',
        error
      );
    }
  }, []);

  // ==================================================
  // ================= ORDER HELPERS ==================
  // ==================================================

  const parseOrderItems = (items) => {
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch (error) {
        console.error(
          'Error parsing order items:',
          error
        );

        return [];
      }
    }

    return Array.isArray(items)
      ? items
      : [];
  };

  // ==================================================
  // ================= AUTH HEADERS ===================
  // ==================================================

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem(
        'kitchen_token'
      );

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ==================================================
  // ================= FETCH ACTIVE ORDERS ============
  // ==================================================

  const fetchActiveOrders =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        const authHeaders =
          getAuthHeaders();

        if (!authHeaders) {
          setError(
            'Kitchen authentication is missing. Please log in again.'
          );

          setOrders([]);

          return;
        }

        const response =
          await fetch(
            `${API_URL}/api/orders/active`,
            {
              method: 'GET',
              headers: authHeaders,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Failed to load active orders.'
          );
        }

        if (Array.isArray(data)) {
          const formattedOrders =
            data.map((order) => ({
              ...order,
              items:
                parseOrderItems(
                  order.items
                ),
            }));

          setOrders(
            formattedOrders
          );
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error(
          'Error fetching active orders:',
          error
        );

        setOrders([]);

        setError(
          error.message ||
            'Unable to load kitchen orders.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // ==================================================
  // ================= SOCKET.IO ======================
  // ==================================================

  useEffect(() => {
    fetchActiveOrders();

    const socket =
      io(API_URL);

    socketRef.current =
      socket;

    // -------------------------------
    // New order
    // -------------------------------

    socket.on(
      'new_order',
      (newOrder) => {
        if (!newOrder) {
          return;
        }

        playNotificationSound();

        setOrders(
          (previousOrders) => {
            const currentOrders =
              Array.isArray(
                previousOrders
              )
                ? previousOrders
                : [];

            // Prevent duplicate orders
            if (
              currentOrders.some(
                (order) =>
                  order.id ===
                  newOrder.id
              )
            ) {
              return currentOrders;
            }

            const formattedNewOrder =
              {
                ...newOrder,
                items:
                  parseOrderItems(
                    newOrder.items
                  ),
              };

            return [
              formattedNewOrder,
              ...currentOrders,
            ];
          }
        );
      }
    );

    // -------------------------------
    // Order status update
    // -------------------------------

    socket.on(
      'order_status_updated',
      ({
        orderId,
        status,
      }) => {
        setOrders(
          (previousOrders) => {
            if (
              !Array.isArray(
                previousOrders
              )
            ) {
              return [];
            }

            // Completed and cancelled orders
            // disappear from the active kitchen screen.
            if (
              status ===
                'completed' ||
              status ===
                'cancelled'
            ) {
              return previousOrders.filter(
                (order) =>
                  order.id !==
                  orderId
              );
            }

            return previousOrders.map(
              (order) =>
                order.id ===
                orderId
                  ? {
                      ...order,
                      status,
                    }
                  : order
            );
          }
        );
      }
    );

    // -------------------------------
    // Socket connection error
    // -------------------------------

    socket.on(
      'connect_error',
      (error) => {
        console.error(
          'Socket connection error:',
          error
        );
      }
    );

    // -------------------------------
    // Cleanup
    // -------------------------------

    return () => {
      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [
    fetchActiveOrders,
    playNotificationSound,
  ]);

  // ==================================================
  // ================ UPDATE ORDER STATUS =============
  // ==================================================

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setError('');

      const authHeaders =
        getAuthHeaders();

      if (!authHeaders) {
        setError(
          'Kitchen authentication is missing. Please log in again.'
        );

        return;
      }

      const response =
        await fetch(
          `${API_URL}/api/orders/${orderId}/status`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',

              ...authHeaders,
            },

            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Failed to update order status.'
        );
      }

      // The server also broadcasts the status
      // through Socket.IO.
      //
      // We do not need to update the UI here
      // because the socket event will do it.
    } catch (error) {
      console.error(
        'Error updating order status:',
        error
      );

      setError(
        error.message ||
          'Unable to update order status.'
      );
    }
  };

  // ==================================================
  // ================= SAFE ORDERS ====================
  // ==================================================

  const safeOrders =
    Array.isArray(orders)
      ? orders
      : [];

  const pendingOrders =
    safeOrders.filter(
      (order) =>
        order.status ===
        'pending'
    );

  const preparingOrders =
    safeOrders.filter(
      (order) =>
        order.status ===
        'preparing'
    );

  const totalItems =
    safeOrders.reduce(
      (total, order) => {
        const items =
          Array.isArray(
            order.items
          )
            ? order.items
            : [];

        return (
          total +
          items.reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.quantity ||
                  0
              ),
            0
          )
        );
      },
      0
    );

  // ==================================================
  // ================= RENDER =========================
  // ==================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* =========================================
          HIDDEN RECEIPT
      ========================================= */}

      <div className="hidden">
        <Receipt
          ref={receiptRef}
          order={selectedOrder}
        />
      </div>

      {/* =========================================
          COMPACT HEADER
      ========================================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">

        {/* Main Header */}

        <div className="px-5 py-4">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Title */}

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl">
                👨‍🍳
              </div>

              <div>

                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Kitchen Display System
                </h1>

                <p className="text-gray-500 text-xs mt-0.5">
                  Manage incoming orders and prepare them efficiently.
                </p>

              </div>

            </div>

            {/* Controls */}

            <div className="flex flex-wrap items-center gap-2">

              {/* Audio */}

              <button
                onClick={() => {
                  playNotificationSound();
                  setAudioAllowed(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  audioAllowed
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 animate-pulse'
                }`}
              >
                {audioAllowed
                  ? '🔔 Audio Enabled'
                  : '🔔 Enable Sound'}
              </button>

              {/* Live */}

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">

                <span className="relative flex h-2.5 w-2.5">

                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />

                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />

                </span>

                <span className="text-xs font-bold text-emerald-700">
                  LIVE
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* =========================================
            ERROR MESSAGE
        ========================================= */}

        {error && (
          <div className="mx-5 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* =========================================
            SUMMARY
        ========================================= */}

        <div className="grid grid-cols-3 border-t border-orange-100 bg-orange-50/40">

          {/* Pending */}

          <div className="px-4 py-3 border-r border-orange-100">

            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-orange-600">
              New Orders
            </p>

            <p className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
              {pendingOrders.length}
            </p>

          </div>

          {/* Preparing */}

          <div className="px-4 py-3 border-r border-orange-100">

            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-600">
              Preparing
            </p>

            <p className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
              {preparingOrders.length}
            </p>

          </div>

          {/* Items */}

          <div className="px-4 py-3">

            <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-orange-600">
              Items to Prepare
            </p>

            <p className="text-xl md:text-2xl font-black text-gray-900 mt-0.5">
              {totalItems}
            </p>

          </div>

        </div>

      </div>

      {/* =========================================
          LOADING
      ========================================= */}

      {loading ? (
        <div className="mt-6 bg-white rounded-3xl p-12 md:p-20 text-center border border-gray-200 shadow-sm">

          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center text-3xl mb-4 animate-pulse">
            👨‍🍳
          </div>

          <h3 className="text-lg font-black text-gray-800">
            Loading kitchen orders...
          </h3>

          <p className="text-sm text-gray-400 mt-2">
            Connecting to the restaurant server.
          </p>

        </div>
      ) : safeOrders.length === 0 ? (

        /* =========================================
            EMPTY STATE
        ========================================= */

        <div className="mt-6 bg-white rounded-3xl p-12 md:p-20 text-center border border-gray-200 shadow-sm">

          <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 flex items-center justify-center text-4xl mb-5">
            🍳
          </div>

          <h3 className="text-xl font-black text-gray-800">
            Kitchen is clear
          </h3>

          <p className="text-sm text-gray-400 mt-2">
            No active orders right now.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">

            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

            Waiting for new orders

          </div>

        </div>

      ) : (

        <>

          {/* =========================================
              SECTION TITLE
          ========================================= */}

          <div className="mt-6 mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-lg md:text-xl font-black text-gray-900">
                Active Orders
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Orders are updated automatically in real time.
              </p>

            </div>

            <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-bold text-gray-600">

              {safeOrders.length}{' '}

              {safeOrders.length === 1
                ? 'order'
                : 'orders'}

            </div>

          </div>

          {/* =========================================
              ORDERS GRID
          ========================================= */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {safeOrders.map(
              (order) => {

                const isPreparing =
                  order.status ===
                  'preparing';

                const items =
                  Array.isArray(
                    order.items
                  )
                    ? order.items
                    : [];

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all flex flex-col ${
                      isPreparing
                        ? 'border-amber-300 shadow-amber-100'
                        : 'border-orange-300 shadow-orange-100'
                    }`}
                  >

                    {/* =================================
                        ORDER HEADER
                    ================================= */}

                    <div
                      className={`p-4 ${
                        isPreparing
                          ? 'bg-amber-500'
                          : 'bg-orange-500'
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <div className="flex items-center gap-2 mb-1">

                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                              ORDER
                            </span>

                            <span className="text-xs font-black text-white">
                              #{order.id}
                            </span>

                          </div>

                          <h3 className="text-xl font-black text-white truncate">

                            {order.order_type ===
                            'takeaway'
                              ? '🥡 Takeaway'
                              : `🪑 Table ${order.table_number}`}

                          </h3>

                          <p className="text-[10px] text-white/75 mt-1 font-semibold">

                            {order.order_type ===
                            'takeaway'
                              ? 'Customer takeaway order'
                              : 'Dine-in order'}

                          </p>

                        </div>

                        {/* Print */}

                        <button
                          onClick={() =>
                            printOrderReceipt(
                              order
                            )
                          }
                          className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all"
                          title="Print receipt"
                        >
                          🖨️
                        </button>

                      </div>

                      {/* Status */}

                      <div className="mt-3">

                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[10px] font-black">

                          <span className="w-1.5 h-1.5 rounded-full bg-white" />

                          {isPreparing
                            ? 'PREPARING'
                            : 'NEW ORDER'}

                        </span>

                      </div>

                    </div>

                    {/* =================================
                        ORDER ITEMS
                    ================================= */}

                    <div className="p-4 flex-1">

                      <div className="flex items-center justify-between mb-3">

                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Order Items
                        </p>

                        <span className="text-[10px] font-bold text-gray-400">

                          {items.length}{' '}

                          {items.length ===
                          1
                            ? 'item'
                            : 'items'}

                        </span>

                      </div>

                      <div className="space-y-2">

                        {items.length >
                        0 ? (
                          items.map(
                            (
                              item,
                              index
                            ) => (

                              <div
                                key={
                                  item.id ||
                                  `${order.id}-${item.menu_id || item.name || index}`
                                }
                                className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden"
                              >

                                {/* Item row */}

                                <div className="p-3 flex items-center justify-between gap-3">

                                  <div className="flex items-center gap-3 min-w-0">

                                    <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-sm font-black text-orange-500">
                                      {item.quantity}
                                    </div>

                                    <div className="min-w-0">

                                      <p className="font-bold text-sm text-gray-800 break-words">

                                        {item.name ||
                                          item.menu_name ||
                                          'Ordered Item'}

                                      </p>

                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        Quantity:{' '}
                                        {
                                          item.quantity
                                        }
                                      </p>

                                    </div>

                                  </div>

                                  <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-black">
                                    x
                                    {
                                      item.quantity
                                    }
                                  </span>

                                </div>

                                {/* Customer note */}

                                {item.notes &&
                                  typeof item.notes ===
                                    'string' &&
                                  item.notes.trim() && (

                                    <div className="px-3 pb-3">

                                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">

                                        <div className="flex items-center gap-1.5">

                                          <span className="text-xs">
                                            📝
                                          </span>

                                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                                            Customer Note
                                          </span>

                                        </div>

                                        <p className="text-[11px] font-semibold text-amber-900 mt-1 break-words">
                                          {
                                            item.notes
                                          }
                                        </p>

                                      </div>

                                    </div>

                                  )}

                              </div>

                            )
                          )
                        ) : (

                          <div className="py-6 text-center text-xs text-gray-400 italic">
                            No order items found
                          </div>

                        )}

                      </div>

                    </div>

                    {/* =================================
                        ACTION
                    ================================= */}

                    <div className="p-4 border-t border-gray-100 bg-gray-50/70">

                      {order.status ===
                      'pending' ? (

                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              'preparing'
                            )
                          }
                          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black py-3.5 rounded-2xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                        >

                          <span className="text-base">
                            👨‍🍳
                          </span>

                          Start Preparing

                        </button>

                      ) : (

                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              'completed'
                            )
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black py-3.5 rounded-2xl shadow-sm transition-all text-xs flex items-center justify-center gap-2"
                        >

                          <span className="text-base">
                            ✅
                          </span>

                          Mark as Ready

                        </button>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </>
      )}

    </div>
  );
};

export default KitchenView;