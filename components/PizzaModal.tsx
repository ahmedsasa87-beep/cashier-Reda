
import React, { useState } from 'react';
import { Product, PizzaSize, Topping, CartItem } from '../types';
import { TOPPINGS } from '../constants';

interface PizzaModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (item: CartItem) => void;
}

const PizzaModal: React.FC<PizzaModalProps> = ({ product, onClose, onConfirm }) => {
  const [size, setSize] = useState<PizzaSize>('M');
  const [isStuffedCrust, setIsStuffedCrust] = useState(false);
  const [stuffedCrustPrice, setStuffedCrustPrice] = useState(20);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => 
      prev.find(t => t.id === topping.id)
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const calculateTotal = () => {
    const basePrice = product.prices[size] || 0;
    const toppingsTotal = selectedToppings.reduce((acc, t) => acc + t.price, 0);
    const stuffedTotal = isStuffedCrust ? stuffedCrustPrice : 0;
    return basePrice + toppingsTotal + stuffedTotal;
  };

  const handleAdd = () => {
    const item: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      size,
      basePrice: product.prices[size] || 0,
      toppings: selectedToppings,
      quantity: 1,
      totalPrice: calculateTotal(),
      isStuffedCrust,
      stuffedCrustPrice: isStuffedCrust ? stuffedCrustPrice : 0
    };
    onConfirm(item);
  };

  const otherToppings = TOPPINGS.filter(t => t.id !== 'top-stuffed-crust');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[15px] flex items-center justify-center z-[500] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border-[8px] border-white animate-in zoom-in slide-in-from-bottom duration-300">
        <div className="bg-orange-600 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black">{product.name}</h2>
            <p className="opacity-70 font-bold">تخصيص البيتزا</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/40 text-white rounded-xl w-12 h-12 flex items-center justify-center text-3xl transition-all">✕</button>
        </div>
        
        <div className="p-8 space-y-8 bg-slate-50">
          {/* Size Selection */}
          <div>
            <label className="block text-slate-800 font-black text-xl mb-4">1. اختر الحجم:</label>
            <div className="grid grid-cols-3 gap-4">
              {(['S', 'M', 'L'] as PizzaSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-6 rounded-2xl border-4 transition-all flex flex-col items-center gap-1 ${
                    size === s 
                      ? 'border-orange-600 bg-orange-50 text-orange-600 shadow-lg scale-105' 
                      : 'border-white bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="text-xl font-black">{s === 'S' ? 'صغير' : s === 'M' ? 'وسط' : 'كبير'}</span>
                  <span className="font-bold">{product.prices[s]} ج.م</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stuffed Crust Question */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100">
            <div className="flex items-center justify-between mb-4">
               <label className="text-slate-800 font-black text-xl">2. هل تريد حشو أطراف؟</label>
               <div className="flex gap-2">
                 <button 
                  onClick={() => setIsStuffedCrust(true)}
                  className={`px-6 py-2 rounded-xl font-black transition-all ${isStuffedCrust ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                 >نعم</button>
                 <button 
                  onClick={() => setIsStuffedCrust(false)}
                  className={`px-6 py-2 rounded-xl font-black transition-all ${!isStuffedCrust ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                 >لا</button>
               </div>
            </div>
            {isStuffedCrust && (
              <div className="animate-in slide-in-from-top duration-300">
                <label className="text-sm font-black text-slate-400 mb-2 block">سعر حشو الأطراف:</label>
                <input 
                  type="number" 
                  value={stuffedCrustPrice} 
                  onChange={(e) => setStuffedCrustPrice(Number(e.target.value))}
                  className="w-full p-4 rounded-xl border-2 border-blue-100 bg-blue-50 font-black text-xl text-blue-800 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Other Toppings */}
          <div>
            <label className="block text-slate-800 font-black text-xl mb-4">3. إضافات أخرى:</label>
            <div className="grid grid-cols-2 gap-4">
              {otherToppings.map(topping => {
                const isSelected = selectedToppings.find(t => t.id === topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => toggleTopping(topping)}
                    className={`p-4 rounded-2xl border-4 flex justify-between items-center transition-all ${
                      isSelected ? 'border-orange-600 bg-orange-50' : 'border-white bg-white hover:border-orange-100'
                    }`}
                  >
                    <span className={`font-bold ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>{topping.name}</span>
                    <span className="font-black text-slate-400">+{topping.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-8 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-black block text-xs">إجمالي الصنف:</span>
              <span className="text-5xl font-black text-orange-600 tabular-nums">{calculateTotal()}</span>
            </div>
            <button
              onClick={handleAdd}
              className="bg-orange-600 hover:bg-orange-700 text-white px-12 py-5 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition-all"
            >إضافة للسلة 🛒</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaModal;
