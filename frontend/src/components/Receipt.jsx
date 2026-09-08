import React from 'react';

const Receipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  // Calculate total dynamically if not passed separately
  const total = order.total_amount 
    || order.items?.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0) 
    || 0;

  return (
    <div className="hidden print:block">
      <div ref={ref} className="p-8 bg-white text-black font-mono max-w-sm mx-auto border">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold uppercase">Smart Resto</h2>
          <p className="text-xs text-gray-600">የክፍያ ደረሰኝ (Official Receipt)</p>
          <p className="text-xs mt-1">ቀን: {new Date().toLocaleString()}</p>
          <p className="text-sm font-bold mt-2">ጠረጴዛ ቁጥር: #{order.table_number || order.tableNumber}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between font-bold border-b pb-1 text-xs">
            <span>ምግብ</span>
            <span>ብዛት x ዋጋ</span>
          </div>
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span>{item.name || item.menu_name}</span>
              <span>{item.quantity} x {item.price || 0} ETB</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 border-dashed space-y-1">
          <div className="flex justify-between font-extrabold text-base">
            <span>ጠቅላላ ሂሳብ:</span>
            <span>{Number(total).toFixed(2)} ETB</span>
          </div>
        </div>

        <div className="text-center mt-6 pt-4 border-t text-xs text-gray-500">
          <p>ስለመረጡን እናመሰግናለን!</p>
        </div>
      </div>
    </div>
  );
});

export default Receipt;