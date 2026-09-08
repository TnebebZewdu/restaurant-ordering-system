import React, { useMemo, useState } from 'react';

const TableQRPage = () => {
  const [tableCount, setTableCount] = useState(10);
  const [generatedCount, setGeneratedCount] = useState(10);

  const baseUrl = useMemo(() => {
    return `${window.location.origin}/menu`;
  }, []);

  const tables = Array.from(
    { length: generatedCount },
    (_, index) => index + 1
  );

  const getTableUrl = (tableNumber) => {
    return `${baseUrl}?table=${tableNumber}`;
  };

  const getQrUrl = (tableNumber) => {
    const tableUrl = encodeURIComponent(
      getTableUrl(tableNumber)
    );

    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${tableUrl}`;
  };

  const handleGenerate = (e) => {
    e.preventDefault();

    const count = Number(tableCount);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      alert('Please enter a number between 1 and 100.');
      return;
    }

    setGeneratedCount(count);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (tableNumber) => {
    try {
      const qrUrl = getQrUrl(tableNumber);

      const response = await fetch(qrUrl);

      if (!response.ok) {
        throw new Error('QR code could not be downloaded.');
      }

      const blob = await response.blob();

      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = `restaurant-table-${tableNumber}-qr.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('QR Download Error:', error);

      alert(
        'QR code download failed. You can right-click the QR code and save it instead.'
      );
    }
  };

  return (
    <section className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-2xl">
                📱
              </div>

              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  Table QR Codes
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  Generate a unique QR code for every restaurant table.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl transition"
          >
            🖨️ Print QR Codes
          </button>

        </div>
      </div>

      {/* GENERATOR */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
        <form
          onSubmit={handleGenerate}
          className="flex flex-col sm:flex-row sm:items-end gap-4"
        >

          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Number of Tables
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={tableCount}
              onChange={(e) => setTableCount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Generate QR Codes
          </button>

        </form>

        <div className="mt-4 bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
          <strong>How it works:</strong> Each table receives its own QR
          code. When a customer scans it, the menu automatically knows
          which table the customer is sitting at.
        </div>
      </div>

      {/* QR GRID */}
      <div
        id="qr-print-area"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        {tables.map((tableNumber) => (
          <div
            key={tableNumber}
            className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 text-center"
          >

            <div className="mb-3">
              <h2 className="text-xl font-black text-gray-900">
                TABLE {tableNumber}
              </h2>

              <p className="text-xs text-gray-500">
                Scan to order
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-3 inline-block">
              <img
                src={getQrUrl(tableNumber)}
                alt={`QR code for table ${tableNumber}`}
                className="w-52 h-52 object-contain"
              />
            </div>

            <div className="mt-3">
              <p className="text-xs text-gray-400 break-all">
                {getTableUrl(tableNumber)}
              </p>
            </div>

            <button
              onClick={() => handleDownload(tableNumber)}
              className="mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-xl transition"
            >
              ⬇️ Download QR
            </button>

          </div>
        ))}
      </div>

      {/* PRINT STYLES */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            #qr-print-area,
            #qr-print-area * {
              visibility: visible;
            }

            #qr-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }

            #qr-print-area > div {
              break-inside: avoid;
              page-break-inside: avoid;
              box-shadow: none !important;
            }
          }
        `}
      </style>

    </section>
  );
};

export default TableQRPage;