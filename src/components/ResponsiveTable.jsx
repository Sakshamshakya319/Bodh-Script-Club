import React from 'react';

/**
 * ResponsiveTable Component
 * Displays as table on desktop, cards on mobile
 * 
 * Props:
 * - headers: Array of header objects { key, label, className }
 * - data: Array of data objects
 * - renderRow: Function to render table row (desktop)
 * - renderCard: Function to render card (mobile)
 * - emptyMessage: Message when no data
 * - emptyIcon: Icon component for empty state
 */

const ResponsiveTable = ({ 
  headers, 
  data, 
  renderRow, 
  renderCard, 
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        {EmptyIcon && <EmptyIcon size={48} className="mx-auto text-gray-600 mb-4" />}
        <p className="text-gray-400 font-body">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block overflow-x-auto">
        <table className={`w-full ${className}`}>
          <thead>
            <tr className="border-b border-gray-700">
              {headers.map((header, index) => (
                <th 
                  key={header.key || index} 
                  className={`text-left py-3 px-4 font-body text-gray-400 text-sm ${header.className || ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="lg:hidden space-y-4">
        {data.map((item, index) => renderCard(item, index))}
      </div>
    </>
  );
};

export default ResponsiveTable;
