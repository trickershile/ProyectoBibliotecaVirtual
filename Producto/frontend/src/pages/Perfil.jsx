import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryApi } from '../api/delivery';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { wishlistApi } from '../api/wishlist';
import { getProfile, updateProfile, withApiOrigin } from '../lib/supabase';
import { User, Package, Download, Calendar, MapPin, Clock, Loader2, AlertCircle, Edit3, Check, X, Heart, CreditCard, Truck } from 'lucide-react';
import {
  formatItemType,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatTrackingStatus,
} from '../lib/labels';
import { statusStyles, theme } from '../lib/theme';

const Perfil = () => {
  const [orders, setOrders] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [payments, setPayments] = useState([]);
  const [downloadingBookId, setDownloadingBookId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone_number: ''
  });

  const loading = loadingProfile || loadingOrders;

  useEffect(() => {
    fetchProfileData();
    fetchOrders();
    fetchWishlist();
    fetchPayments();
  }, []);

  const fetchProfileData = async () => {
    try {
      let sbUser = null;
      try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
      if (!sbUser) return;

      const data = await getProfile(sbUser.id);
      setUserData(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        address: data.address || '',
        phone_number: data.phone_number || ''
      });
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await ordersApi.getMy();
      setOrders(data);
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
      setError("No se pudo cargar el historial de pedidos.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const data = await wishlistApi.getMy();
      setWishlist(data || []);
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const data = await paymentsApi.getMyPayments();
      setPayments(data || []);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
    }
  };

  const handleDigitalDownload = async (bookId, kind = 'full') => {
    try {
      setDownloadingBookId(bookId);
      const response = await deliveryApi.getSignedUrl(bookId, { kind, expires_in: 600 });
      if (response?.signed_url) {
        window.open(response.signed_url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('signed_url_not_returned');
      }
    } catch (err) {
      console.error('Error al obtener descarga digital:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudo obtener el acceso al contenido digital.' }
      }));
    } finally {
      setDownloadingBookId(null);
    }
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      await wishlistApi.removeMy(bookId);
      setWishlist((current) => current.filter((item) => (item.libro_id || item.book?.id) !== bookId));
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Favorito eliminado correctamente.' } }));
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo eliminar el favorito.' } }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      let sbUser = null;
      try { sbUser = JSON.parse(localStorage.getItem('sb_user')); } catch {}
      if (!sbUser) return;

      const updated = await updateProfile(sbUser.id, editForm);
      setUserData(updated);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Perfil actualizado correctamente.' } }));
    } catch (err) {
      console.error("Error al actualizar:", err);
    }
  };

  if (!userData && loading) {
    return (
      <div className={`${theme.pageShell} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#8f6443]" />
      </div>
    );
  }

  return (
    <div className={theme.pageShell}>
      <div className={theme.pageContainer}>
        
        <div className="flex flex-col items-center gap-8 border-b-2 border-[#b9926d] pb-10 md:flex-row">
          <div className="relative group">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-[#d2b08f] bg-[#fffaf4] transition-all group-hover:border-[#9d7553]">
              <User className="h-16 w-16 text-[#8f6443]" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full border-4 border-[#e7d4bf] bg-[#6f8a60]" title="Online"></div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-[#5a3f2b]">
              {userData?.username || 'Usuario'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className={`px-3 py-1 ${theme.statusBadge} ${statusStyles.info}`}>{userData?.role || 'Socio'}</span>
              <span className="flex items-center gap-2 text-[#7f5c40]">
                <Calendar className="w-3 h-3" /> Miembro desde: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6">
            <div className={`${theme.sectionCard} space-y-6`}>
              <div className="flex items-center justify-between border-b-2 border-[#d2b08f] pb-3">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">Información personal</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[#8f6443] transition-colors hover:text-[#5a3f2b]">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest text-[#7f5c40]">Nombre</label>
                    <input className={`${theme.input} px-3 py-2 text-xs`} value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest text-[#7f5c40]">Apellido</label>
                    <input className={`${theme.input} px-3 py-2 text-xs`} value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest text-[#7f5c40]">Correo</label>
                    <input className={`${theme.input} px-3 py-2 text-xs opacity-80`} value={userData?.email} disabled />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase tracking-widest text-[#7f5c40]">Dirección</label>
                    <input className={`${theme.input} px-3 py-2 text-xs`} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className={`${theme.dangerButton} flex flex-1 items-center justify-center gap-2 py-2 text-[9px]`}>
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button type="submit" className={`${theme.primaryButton} flex flex-1 items-center justify-center gap-2 py-2 text-[9px]`}>
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase text-[#7f5c40]">Nombre completo</label>
                    <p className="text-xs text-[#5a3f2b]">{userData?.first_name} {userData?.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase text-[#7f5c40]">Correo electrónico</label>
                    <p className="text-xs text-[#5a3f2b]">{userData?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold uppercase text-[#7f5c40]">Dirección registrada</label>
                    <div className="flex items-center gap-2 text-xs text-[#5a3f2b]">
                      <MapPin className="w-3 h-3 text-[#8f6443]" />
                      {userData?.address || 'Sin dirección registrada'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`${theme.sectionCard} space-y-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#d2b08f] pb-3">
                <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">
                  <Heart className="w-4 h-4 text-[#8f6443]" /> Favoritos
                </h2>
                <span className="text-[9px] font-bold text-[#7f5c40]">{wishlist.length} guardados</span>
              </div>

              {wishlist.length === 0 ? (
                <p className="text-[10px] uppercase tracking-widest text-[#7f5c40]">No tienes libros favoritos guardados.</p>
              ) : (
                <div className="space-y-3">
                  {wishlist.slice(0, 4).map((item) => {
                    const book = item.book || {};
                    const bookId = item.libro_id || book.id;
                    return (
                      <div key={item.id || bookId} className="flex items-center gap-3 rounded-xl border-2 border-[#d2b08f] bg-[#f8ede2] p-3">
                        <img
                          src={book.image_url ? withApiOrigin(book.image_url) : 'https://via.placeholder.com/80x120?text=BOOK'}
                          alt={book.title || 'Libro'}
                          className="h-16 w-12 rounded-md border-2 border-[#d2b08f] object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[10px] font-bold uppercase text-[#5a3f2b]">{book.title || `Libro #${bookId}`}</p>
                          <p className="truncate text-[9px] italic text-[#7f5c40]">{book.author || 'Autor no disponible'}</p>
                          <p className="mt-1 text-[9px] font-bold text-[#8f6443]">{book.pickup_location || 'Sin sede registrada'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(bookId)}
                          className={`${theme.dangerButton} px-2 py-1 text-[9px]`}
                        >
                          Quitar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${theme.sectionCard} space-y-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#d2b08f] pb-3">
                <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#5a3f2b]">
                  <CreditCard className="w-4 h-4 text-[#6f8a60]" /> Pagos
                </h2>
                <span className="text-[9px] font-bold text-[#7f5c40]">{payments.length} registros</span>
              </div>

              {payments.length === 0 ? (
                <p className="text-[10px] uppercase tracking-widest text-[#7f5c40]">Aún no hay pagos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 4).map((payment) => (
                    <div key={payment.id} className="space-y-2 rounded-xl border-2 border-[#d2b08f] bg-[#f8ede2] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-bold uppercase text-[#7f5c40]">Pago #{payment.id}</span>
                        <span className={`rounded px-2 py-0.5 text-[8px] font-black uppercase border-2 ${
                          payment.estado === 'pagado'
                            ? statusStyles.success
                            : payment.estado === 'reembolsado'
                              ? statusStyles.danger
                              : statusStyles.warning
                        }`}>
                          {formatPaymentStatus(payment.estado)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="uppercase text-[#6f523c]">{formatPaymentMethod(payment.metodo_pago)}</span>
                        <span className="font-black text-[#566b4a]">${payment.monto?.toLocaleString('es-CL')}</span>
                      </div>
                      <p className="text-[9px] uppercase text-[#9d7553]">Orden asociada: #{payment.orden_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-xl font-bold uppercase tracking-tighter text-[#5a3f2b]">
                <Package className="w-6 h-6 text-[#8f6443]" /> Historial de solicitudes
              </h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#8f6443]" />}
            </div>

            {error && (
              <div className="flex items-center gap-4 rounded-2xl border-2 border-[#d7a59d] bg-[#f5dfd8] p-6">
                <AlertCircle className="w-5 h-5 text-[#8a3f34]" />
                <p className="text-[10px] font-bold uppercase text-[#8a3f34]">{error}</p>
              </div>
            )}

            {!loading && orders.length === 0 ? (
              <div className={`${theme.emptyState} py-20`}>
                <Package className="mx-auto mb-4 h-10 w-10 text-[#b9926d]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f5c40]">No se registran solicitudes en el sistema.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id || order.id} className="group overflow-hidden rounded-2xl border-2 border-[#b9926d] bg-[#fffaf4] transition-all hover:border-[#9d7553]">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#d2b08f] bg-[#f8ede2] p-4">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-[#ead4bd] p-2">
                          <Clock className="w-4 h-4 text-[#8f6443]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tighter text-[#5a3f2b]">Solicitud #{order._id?.substr(-6) || order.id}</p>
                          <p className="text-[8px] font-bold text-[#9d7553]">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`rounded px-2 py-0.5 text-[8px] font-black uppercase border-2 ${
                          order.status === 'confirmed' ? statusStyles.success : statusStyles.warning
                        }`}>
                          {formatOrderStatus(order.status)}
                        </span>
                        {order.receipt_url && (
                          <a 
                            href={withApiOrigin(order.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${theme.outlineButton} p-2`}
                            title="Descargar Comprobante PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="divide-y-2 divide-[#ead4bd] p-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center text-[10px]">
                          <div className="flex flex-col">
                            <span className="font-bold uppercase text-[#5a3f2b]">{item.title}</span>
                            <span className="text-[8px] font-bold italic text-[#9d7553]">Sede: {item.pickup_location}</span>
                            <span className="text-[8px] font-bold uppercase text-[#7f5c40]">Tipo: {formatItemType(item.tipo_item || 'fisico')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {(item.tipo_item === 'digital' || item.tipo_item === 'prestamo') && (
                              <button
                                type="button"
                                onClick={() => handleDigitalDownload(item.libro_id, item.tipo_item === 'prestamo' ? 'preview' : 'full')}
                                disabled={downloadingBookId === item.libro_id}
                                className={`${theme.outlineButton} flex items-center gap-2 px-2 py-1 text-[8px]`}
                              >
                                {downloadingBookId === item.libro_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                DESCARGAR
                              </button>
                            )}
                            <span className="font-mono text-[#5a3f2b]">${item.price?.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      ))}
                      {order.despacho && (
                        <div className="py-4 space-y-3">
                          <div className="flex flex-col justify-between gap-3 rounded-xl border-2 border-[#d2b08f] bg-[#f8ede2] p-4 md:flex-row md:items-center">
                            <div className="space-y-2">
                              <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#7f5c40]">
                                <Truck className="w-3 h-3" /> Despacho asociado
                              </p>
                              <div className="flex flex-wrap gap-3 text-[9px] uppercase">
                                <span className="text-[#6f523c]">Código: <span className="font-black text-[#5a3f2b]">{order.despacho.codigo_seguimiento}</span></span>
                                <span className="text-[#6f523c]">Estado: <span className="font-black text-[#7f5c40]">{formatTrackingStatus(order.despacho.estado_envio || 'pendiente')}</span></span>
                              </div>
                              <p className="flex items-center gap-2 text-[9px] text-[#6f523c]">
                                <MapPin className="w-3 h-3 text-[#8f6443]" />
                                {order.despacho.direccion_destino || 'Retiro en biblioteca'}
                              </p>
                            </div>
                            <Link
                              to={`/tracking?codigo=${encodeURIComponent(order.despacho.codigo_seguimiento)}`}
                              className={`${theme.outlineButton} px-3 py-2 text-[9px] text-center`}
                            >
                              Ver tracking
                            </Link>
                          </div>
                        </div>
                      )}
                      <div className="pt-3 mt-1 flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#7f5c40]">Total transacción</span>
                        <span className="text-sm font-black text-[#566b4a]">${order.total_amount?.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
