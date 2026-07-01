import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Trash2, ArrowRight, CreditCard, Clock, Info, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { withApiOrigin } from '../lib/supabase';
import { checkoutCart, getCart, removeCartItem } from '../lib/cart';
import { formatPaymentMethod, formatPaymentStatus } from '../lib/labels';
import { statusStyles, theme } from '../lib/theme';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('tarjeta');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const items = await getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo cargar el carrito.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const updatedCart = await removeCartItem(cartItemId);
      setCartItems(updatedCart);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Ejemplar eliminado del carrito.' } 
      }));
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'No se pudo eliminar el ejemplar.' } 
      }));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0);
  };

  const locationCount = useMemo(
    () => new Set(cartItems.map(i => i.pickup_location)).size,
    [cartItems]
  );

  const handleConfirmOrder = async () => {
    setSubmittingOrder(true);
    let checkoutResponse = null;
    let paymentIntent = null;
    try {
      let sbUser = null;
      // eslint-disable-next-line no-empty
      try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {} 
      if (!sbUser) {
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { message: 'Debes iniciar sesión para confirmar el pedido.' } 
        }));
        return;
      }

      checkoutResponse = await checkoutCart('retiro_biblioteca');
      paymentIntent = await paymentsApi.createIntent({
        orden_id: checkoutResponse.orden_id,
        monto: checkoutResponse.total_pagado,
        metodo_pago: paymentMethod,
      }, sbUser.id);
      const confirmedPayment = await paymentsApi.confirm(paymentIntent.id);
      const order = await ordersApi.getById(checkoutResponse.orden_id);
      setOrderSuccess({
        ...order,
        _id: order._id || checkoutResponse.orden_id,
        total_amount: order.total_amount || checkoutResponse.total_pagado,
        payment: confirmedPayment,
      });
      setCartItems([]);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Pago confirmado y orden registrada correctamente.' }
      }));

    } catch (error) {
      console.error("Error al procesar pedido:", error);
      if (checkoutResponse?.orden_id) {
        try {
          const order = await ordersApi.getById(checkoutResponse.orden_id);
          setOrderSuccess({
            ...order,
            _id: order._id || checkoutResponse.orden_id,
            total_amount: order.total_amount || checkoutResponse.total_pagado,
            payment: paymentIntent
              ? {
                  ...paymentIntent,
                  estado: paymentIntent.estado || 'pendiente',
                }
              : null,
          });
          setCartItems([]);
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message: 'La orden fue creada, pero el pago quedó pendiente de confirmación.' }
          }));
          return;
        } catch (recoveryError) {
          console.error('Error al recuperar la orden tras fallo de pago:', recoveryError);
        }
      }
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Error al procesar el pago o confirmar el pedido.' } 
      }));
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (orderSuccess) {
    const paymentCompleted = orderSuccess.payment?.estado === 'pagado';
    return (
      <div className={`${theme.pageShell} flex items-center justify-center`}>
        <div className={`w-full max-w-2xl space-y-8 rounded-3xl p-10 text-center shadow-[0_20px_48px_rgba(95,69,47,0.16)] ${
          paymentCompleted ? 'border-2 border-[#9faf92] bg-[#eef4e8]' : 'border-2 border-[#d7b988] bg-[#fff4df]'
        }`}>
          <div className="relative mx-auto h-24 w-24">
            <CheckCircle2 className={`h-24 w-24 ${paymentCompleted ? 'text-[#6f8a60]' : 'text-[#b9926d]'}`} />
            <div className={`absolute inset-0 rounded-full blur-2xl ${paymentCompleted ? 'bg-[#9faf92]/35' : 'bg-[#d7b988]/35'}`}></div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-[#5a3f2b]">
              {paymentCompleted ? 'Pago confirmado' : 'Orden creada, pago pendiente'}
            </h2>
            <p className="text-sm text-[#6f523c]">
              Tu solicitud #{orderSuccess._id} {paymentCompleted ? 'ha sido procesada exitosamente.' : 'quedó registrada y espera validación de pago.'}
            </p>
            {orderSuccess.payment && (
              <p className={`text-xs font-bold uppercase tracking-widest ${paymentCompleted ? 'text-[#566b4a]' : 'text-[#8a633f]'}`}>
                Pago {formatPaymentStatus(orderSuccess.payment.estado)} por ${(orderSuccess.payment.monto || 0).toLocaleString('es-CL')} vía {formatPaymentMethod(orderSuccess.payment.metodo_pago)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border-2 border-[#d2b08f] bg-[#fffaf4] p-6 md:flex-row">
            <div className="text-left">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Comprobante digital</p>
              <p className="text-xs text-[#6f523c]">
                {orderSuccess.receipt_url
                  ? 'Descarga tu recibo para el retiro en sede.'
                  : 'La orden quedó registrada y podrás seguir su estado desde tu perfil.'}
              </p>
            </div>
            {orderSuccess.receipt_url ? (
              <a 
                href={withApiOrigin(orderSuccess.receipt_url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${theme.outlineButton} flex items-center gap-3 px-6 py-3`}
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </a>
            ) : (
              <div className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest ${theme.statusBadge} ${statusStyles.info}`}>
                Orden registrada
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#d2b08f] pt-6">
            <Link to="/catalogo" className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5a3f2b] transition-colors hover:text-[#3f2b1d]">
              <ArrowRight className="w-3 h-3 rotate-180" /> Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.pageShell}>
      <div className={theme.pageContainer}>
        
        <div className={theme.pageHeader}>
          <h1 className={theme.pageTitleRow}>
            <ShoppingCart className="w-8 h-8" /> Carrito de compras
          </h1>
          <p className={theme.pageSubtitle}>Revisión de ejemplares seleccionados para compra.</p>
        </div>

        {loading ? (
          <div className={`${theme.emptyState} space-y-6 py-24`}>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#8f6443]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#7f5c40]">Cargando carrito...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className={`${theme.emptyState} space-y-6 py-24`}>
            <div className="relative mx-auto w-20 h-20">
              <ShoppingCart className="h-20 w-20 text-[#b9926d]" />
              <div className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#d7a59d] bg-[#f5dfd8]">
                <span className="text-[10px] font-bold text-[#8a3f34]">0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7f5c40]">El carrito está vacío</p>
              <p className="text-[10px] text-[#9d7553]">Todavía no has agregado libros a tu sesión actual.</p>
            </div>
            <Link 
              to="/catalogo" 
              className={`${theme.primaryButton} inline-flex items-center gap-2 px-6 py-3 shadow-[0_12px_24px_rgba(95,69,47,0.18)]`}
            >
              Ir al catálogo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className={`${theme.sectionCard} overflow-hidden p-0`}>
                <div className="flex items-center justify-between border-b-2 border-[#d2b08f] bg-[#f8ede2] p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7f5c40]">Libros seleccionados ({cartItems.length})</span>
                  <span className="text-[9px] font-bold text-[#5a3f2b]">Sesión: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="divide-y-2 divide-[#ead4bd]">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id || item._id || item.id} className="group flex gap-4 p-4 transition-all hover:bg-[#fff3e7]">
                      <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 border-[#d2b08f] bg-[#f3e4d4]">
                        <img 
                          src={item.image_url ? withApiOrigin(item.image_url) : "https://via.placeholder.com/150x200?text=BOOK"} 
                          alt={item.title} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="truncate text-sm font-bold uppercase tracking-tighter text-[#5a3f2b] transition-colors group-hover:text-[#3f2b1d]">{item.title}</h3>
                            <p className="mt-0.5 text-[10px] italic text-[#7f5c40]">Autor: {item.author}</p>
                            <p className="mt-1 text-[9px] font-bold text-[#9d7553]">Cantidad: {item.quantity || 1}</p>
                          </div>
                          <button 
                            onClick={() => removeItem(item.cart_item_id)}
                            className="rounded-lg p-1.5 text-[#9d7553] transition-all hover:bg-[#f5dfd8] hover:text-[#8a3f34]"
                            title="Remover activo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`rounded border-2 px-2 py-0.5 text-[8px] font-bold uppercase ${statusStyles.info}`}>
                            {(item.categories && item.categories[0]) || 'General'}
                          </span>
                          <span className="text-sm font-black text-[#5a3f2b]">
                            ${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border-2 border-[#d2b08f] bg-[#f8ede2] p-4">
                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8f6443]" />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Aviso</p>
                  <p className="text-[9px] leading-relaxed text-[#6f523c]">
                    Los libros serán reservados por un periodo máximo de 48 horas. La entrega se realizará en la sede especificada para cada ejemplar tras la validación de la transacción.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`sticky top-24 space-y-6 ${theme.sectionCard} shadow-[0_20px_48px_rgba(95,69,47,0.16)]`}>
                <h2 className="border-b-2 border-[#d2b08f] pb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">Resumen de la orden</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#7f5c40]">Subtotal libros</span>
                    <span className="font-bold text-[#5a3f2b]">${calculateTotal().toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#7f5c40]">Cargos de servicio</span>
                    <span className="font-bold text-[#566b4a]">$0 (Gratis)</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#7f5c40]">Sedes involucradas</span>
                    <span className="font-bold text-[#5a3f2b]">{locationCount}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t-2 border-[#d2b08f] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Método de pago</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tarjeta')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'tarjeta'
                          ? 'border-[#6f8a60] bg-[#eef4e8] text-[#566b4a]'
                          : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40] hover:border-[#9d7553]'
                      }`}
                    >
                      Tarjeta de débito/crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'transferencia'
                          ? 'border-[#6f8a60] bg-[#eef4e8] text-[#566b4a]'
                          : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40] hover:border-[#9d7553]'
                      }`}
                    >
                      Transferencia bancaria
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('presencial')}
                      className={`px-4 py-3 rounded-xl border text-left text-[10px] font-bold uppercase transition-all ${
                        paymentMethod === 'presencial'
                          ? 'border-[#6f8a60] bg-[#eef4e8] text-[#566b4a]'
                          : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40] hover:border-[#9d7553]'
                      }`}
                    >
                      Pago presencial en retiro
                    </button>
                  </div>
                </div>

                <div className="border-t-2 border-[#d2b08f] pt-4">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">Total a pagar</span>
                    <span className="text-2xl font-black leading-none text-[#5a3f2b]">
                      ${calculateTotal().toLocaleString('es-CL')}
                    </span>
                  </div>

                  <button 
                    onClick={handleConfirmOrder}
                    disabled={submittingOrder}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-[#6f8a60] bg-[#6f8a60] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#fffaf5] transition-all hover:scale-[1.02] hover:bg-[#566b4a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submittingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Pagar y confirmar pedido
                  </button>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-[8px] font-bold uppercase tracking-tighter text-[#9d7553]">
                    <Clock className="w-3 h-3" />
                    Procesamiento seguro
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
