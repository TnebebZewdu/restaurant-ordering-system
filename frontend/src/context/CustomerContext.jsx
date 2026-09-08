import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { io } from 'socket.io-client';

const CustomerContext = createContext(null);

export const CustomerProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const [tableNumber, setTableNumber] = useState(1);

  // True when the table number came from the QR URL.
  const [tableFromQR, setTableFromQR] = useState(false);

  const [orderType, setOrderType] = useState('dine_in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= TABLE / QR DETECTION =================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrTable = params.get('table');

    if (qrTable !== null) {
      const parsedTable = Number(qrTable);

      if (
        Number.isInteger(parsedTable) &&
        parsedTable > 0
      ) {
        setTableNumber(parsedTable);
        setTableFromQR(true);
        setOrderType('dine_in');

        sessionStorage.setItem(
          'restaurant_table_number',
          String(parsedTable)
        );

        sessionStorage.setItem(
          'restaurant_table_from_qr',
          'true'
        );

        return;
      }
    }

    // If there is no table in the current URL,
    // restore the table from this browser session.
    const savedTable =
      sessionStorage.getItem(
        'restaurant_table_number'
      );

    const savedFromQR =
      sessionStorage.getItem(
        'restaurant_table_from_qr'
      );

    if (savedTable) {
      const parsedSavedTable = Number(savedTable);

      if (
        Number.isInteger(parsedSavedTable) &&
        parsedSavedTable > 0
      ) {
        setTableNumber(parsedSavedTable);
      }
    }

    if (savedFromQR === 'true') {
      setTableFromQR(true);
      setOrderType('dine_in');
    }
  }, []);

  // ================= ORDER TRACKING =================
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);

  // ================= LIVE ORDER TRACKING =================
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on(
      'order_status_updated',
      ({ orderId: updatedOrderId, status }) => {
        setOrderId((currentOrderId) => {
          if (currentOrderId === updatedOrderId) {
            setOrderStatus(status);
          }

          return currentOrderId;
        });
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // ================= TABLE NUMBER =================
  const handleSetTableNumber = (value) => {
    // Do not allow a QR-detected table
    // to be manually changed.
    if (tableFromQR) {
      return;
    }

    setTableNumber(value);

    const parsedTable = Number(value);

    if (
      Number.isInteger(parsedTable) &&
      parsedTable > 0
    ) {
      sessionStorage.setItem(
        'restaurant_table_number',
        String(parsedTable)
      );
    }
  };

  // ================= CART =================
  const addToCart = (item) => {
    if (!item.is_available) {
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (i) => i.id === item.id
      );

      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + 1
              }
            : i
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
          notes: ''
        }
      ];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty =
              item.quantity + delta;

            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty
                }
              : null;
          }

          return item;
        })
        .filter(Boolean)
    );
  };

  const updateNotes = (id, notes) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              notes
            }
          : item
      )
    );
  };

  const totalAmount = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) *
          item.quantity,
      0
    );
  }, [cart]);

  const cartQuantity = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );
  }, [cart]);

  // ================= PLACE ORDER =================
  const handlePlaceOrder = async () => {
    if (isSubmitting) {
      return {
        success: false
      };
    }

    if (cart.length === 0) {
      alert(
        'እባክዎ መጀመሪያ ምግብ ይምረጡ!'
      );

      return {
        success: false
      };
    }

    // Validate table number for dine-in.
    if (orderType === 'dine_in') {
      const parsedTableNumber =
        parseInt(tableNumber, 10);

      if (
        !Number.isInteger(
          parsedTableNumber
        ) ||
        parsedTableNumber <= 0
      ) {
        alert(
          'እባክዎ ትክክለኛ የጠረጴዛ ቁጥር ያስገቡ!'
        );

        return {
          success: false
        };
      }
    }

    setIsSubmitting(true);

    const payload = {
      order_type: orderType,

      table_number:
        orderType === 'dine_in'
          ? parseInt(tableNumber, 10)
          : 0,

      total_amount: totalAmount,

      items: cart.map((item) => ({
        menu_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || ''
      }))
    };

    try {
      const res = await fetch(
        'http://localhost:5000/api/orders',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (res.ok) {
        setOrderId(data.orderId);
        setOrderStatus('pending');

        alert(
          '🎉 ትዕዛዝዎ በስኬት ተልኳል!'
        );

        setCart([]);

        return {
          success: true,
          orderId: data.orderId
        };
      }

      alert(
        `ትዕዛዝ መላክ አልተቻለም: ${
          data.error ||
          'Unknown error'
        }`
      );

      return {
        success: false
      };
    } catch (err) {
      console.error(
        'Order Submission Error:',
        err
      );

      alert(
        'ከሰርቨር ጋር መገናኘት አልተቻለም'
      );

      return {
        success: false
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    cart,
    setCart,

    tableNumber,
    setTableNumber: handleSetTableNumber,

    tableFromQR,

    orderType,
    setOrderType,

    isSubmitting,

    orderId,
    orderStatus,

    addToCart,
    updateQuantity,
    updateNotes,

    totalAmount,
    cartQuantity,

    handlePlaceOrder
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context =
    useContext(CustomerContext);

  if (!context) {
    throw new Error(
      'useCustomer must be used inside CustomerProvider'
    );
  }

  return context;
};