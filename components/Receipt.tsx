
import React from 'react';
import { Order } from '../types';
import { COPYRIGHT_INFO, BUSINESS_INFO } from '../constants';

interface ReceiptProps {
  order: Order;
  logoUrl: string;
  workHours: { start: string, end: string };
}

const Receipt: React.FC<ReceiptProps> = ({ order, logoUrl, workHours }) => {
  return (
    <div className="receipt-container bg-white text-black p-4 w-[80mm] mx-auto font-sans shadow-none">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
          <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter">مطعم {BUSINESS_INFO.name}</h1>
        <p className="text-xs font-bold opacity-80 italic">إدارة/ {BUSINESS_INFO.owner}</p>
        <p className="text-[10px] font-bold opacity-60 leading-tight">{BUSINESS_INFO.address}</p>
        <p className="text-[10px] font-black">{BUSINESS_INFO.phone}</p>
        <div className="border-t border-dashed border-gray-400 my-3"></div>
        <h2 className="text-lg font-black uppercase">فاتورة مبيعات ({order.orderType})</h2>
        <p className="text-xs font-black">فاتورة رقم: #{order.id.slice(-6).toUpperCase()}</p>
        <p className="text-[10px] font-bold">
          {new Date(order.timestamp).toLocaleString('ar-EG')}
        </p>
      </div>

      {/* Items Table */}
      <table className="w-full text-right mb-4">
        <thead>
          <tr className="border-b-2 border-black text-[10px] font-black uppercase">
            <th className="pb-2 text-right">الصنف</th>
            <th className="pb-2 text-center">كمية</th>
            <th className="pb-2 text-left">سعر</th>
          </tr>
        </thead>
        <tbody className="text-[11px] font-bold">
          {order.items.map((item) => (
            <React.Fragment key={item.id}>
              <tr className="border-b border-gray-100">
                <td className="py-2">
                  {item.name} {item.size ? `(${item.size})` : ''}
                </td>
                <td className="py-2 text-center tabular-nums">x{item.quantity}</td>
                <td className="py-2 text-left tabular-nums">{item.totalPrice}</td>
              </tr>
              {item.isStuffedCrust && (
                <tr className="text-[9px] text-gray-600 italic">
                  <td colSpan={3} className="pr-4 pb-1">+ حشو أطراف ({item.stuffedCrustPrice} ج.م)</td>
                </tr>
              )}
              {item.toppings.map(t => (
                <tr key={`${item.id}-${t.id}`} className="text-[9px] text-gray-600 italic">
                  <td colSpan={3} className="pr-4 pb-1">+ {t.name} ({t.price} ج.م)</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span>المجموع:</span>
          <span className="tabular-nums">{order.subtotal} ج.م</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-xs font-bold text-red-600">
            <span>الخصم:</span>
            <span className="tabular-nums">-{order.discount} ج.م</span>
          </div>
        )}
        {order.deliveryFees > 0 && (
          <div className="flex justify-between text-xs font-bold">
            <span>التوصيل:</span>
            <span className="tabular-nums">+{order.deliveryFees} ج.م</span>
          </div>
        )}
        <div className="border-t-2 border-black pt-1 flex justify-between text-lg font-black">
          <span>الإجمالي:</span>
          <span className="tabular-nums">{order.total} ج.م</span>
        </div>
        <div className="pt-1 flex justify-between text-[10px] font-bold">
           <span>المدفوع: {order.paidAmount} ج.م</span>
           <span>الباقي: {order.changeAmount} ج.م</span>
        </div>
      </div>

      {/* QR & Footer */}
      <div className="mt-4 flex flex-col items-center gap-2">
         <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=POS-${order.id}`} className="w-20 h-20 opacity-80" alt="QR" />
         <div className="text-center space-y-1">
           <p className="text-[9px] font-black uppercase tracking-widest">شكراً لزيارتكم! 🍕</p>
           <p className="text-[8px] font-bold opacity-60">الكاشير: {order.cashier}</p>
           <p className="text-[8px] font-bold bg-gray-100 py-1 rounded px-2">مواعيد العمل: {workHours.start} - {workHours.end}</p>
         </div>
      </div>

      <div className="mt-6 pt-2 border-t border-dashed border-gray-400 text-center">
        <div className="text-[7px] font-black text-gray-500 leading-tight uppercase tracking-tighter">
          {COPYRIGHT_INFO.text}<br/>
          Designed & Developed by {COPYRIGHT_INFO.owner} ({COPYRIGHT_INFO.mobile})
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 80mm; 
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;
