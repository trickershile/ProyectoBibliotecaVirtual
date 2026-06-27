import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryApi } from '../api/delivery';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { wishlistApi } from '../api/wishlist';
import { getProfile, updateProfile, withApiOrigin } from '../lib/supabase';
import { User, Package, Download, Calendar, MapPin, Clock, Loader2, AlertCircle, Edit3, Check, X, Heart, CreditCard, Truck } from 'lucide-react';

const Perfil = () => {
  const [orders, setOrders] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchProfileData();
    fetchOrders();
    fetchWishlist();
    fetchPayments();
  }, []);

  const fetchProfileData = async () => {
    try {
      const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
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
      setLoading(false);
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
      setLoading(false);
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
        detail: { message: '[!] No se pudo obtener el acceso al contenido digital_' }
      }));
    } finally {
      setDownloadingBookId(null);
    }
  };

  const handleRemoveFavorite = async (bookId) => {
    try {
      await wishlistApi.removeMy(bookId);
      setWishlist((current) => current.filter((item) => (item.libro_id || item.book?.id) !== bookId));
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Favorito eliminado correctamente_' } }));
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo eliminar el favorito_' } }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
      if (!sbUser) return;

      const updated = await updateProfile(sbUser.id, editForm);
      setUserData(updated);
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: "Perfil actualizado correctamente_" } }));
    } catch (err) {
      console.error("Error al actualizar:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!userData && loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row items-center gap-8 border-b border-gray-800 pb-10">
          <div className="relative group">
            <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center border-2 border-blue-500/50 group-hover:border-blue-500 transition-all">
              <User className="w-16 h-16 text-blue-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0a0a0a]" title="Online"></div>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white">
              {'>'} {userData?.username || 'USUARIO_SISTEMA'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{userData?.role || 'Socio'}</span>
              <span className="text-gray-500 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> MIEMBRO_DESDE: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">INFO_SISTEMA</h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-blue-500 hover:text-blue-400 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Nombre</label>
                    <input className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Apellido</label>
                    <input className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Correo</label>
                    <input className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" value={userData?.email} disabled />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Dirección</label>
                    <input className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 border border-gray-800 rounded-lg text-[9px] font-bold uppercase hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-[9px] font-bold uppercase text-white transition-all flex items-center justify-center gap-2">
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase">NOMBRE_COMPLETO</label>
                    <p className="text-xs text-gray-300">{userData?.first_name} {userData?.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase">CORREO_ELECTRÓNICO</label>
                    <p className="text-xs text-gray-300">{userData?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] text-gray-600 font-bold uppercase">DIRECCIÓN_REGISTRADA</label>
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      {userData?.address || 'Sin dirección registrada'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" /> FAVORITOS
                </h2>
                <span className="text-[9px] text-gray-500 font-bold">{wishlist.length} GUARDADOS</span>
              </div>

              {wishlist.length === 0 ? (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">No tienes libros favoritos guardados_</p>
              ) : (
                <div className="space-y-3">
                  {wishlist.slice(0, 4).map((item) => {
                    const book = item.book || {};
                    const bookId = item.libro_id || book.id;
                    return (
                      <div key={item.id || bookId} className="flex items-center gap-3 border border-gray-800 rounded-xl p-3 bg-black/30">
                        <img
                          src={book.image_url ? withApiOrigin(book.image_url) : 'https://via.placeholder.com/80x120?text=BOOK'}
                          alt={book.title || 'Libro'}
                          className="w-12 h-16 object-cover rounded-md border border-gray-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-200 uppercase truncate">{book.title || `Libro #${bookId}`}</p>
                          <p className="text-[9px] text-gray-500 italic truncate">{book.author || 'Autor no disponible'}</p>
                          <p className="text-[9px] text-blue-400 font-bold mt-1">{book.pickup_location || 'Sin sede registrada'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(bookId)}
                          className="px-2 py-1 text-[9px] font-bold uppercase rounded-lg border border-pink-500/20 text-pink-400 hover:bg-pink-500/10 transition-all"
                        >
                          quitar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" /> PAGOS
                </h2>
                <span className="text-[9px] text-gray-500 font-bold">{payments.length} REGISTROS</span>
              </div>

              {payments.length === 0 ? (
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Aún no hay pagos registrados_</p>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 4).map((payment) => (
                    <div key={payment.id} className="border border-gray-800 rounded-xl p-3 bg-black/30 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] text-gray-500 font-bold uppercase">Pago #{payment.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          payment.estado === 'pagado'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : payment.estado === 'reembolsado'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {payment.estado}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-400 uppercase">{payment.metodo_pago}</span>
                        <span className="text-emerald-400 font-black">${payment.monto?.toLocaleString('es-CL')}</span>
                      </div>
                      <p className="text-[9px] text-gray-600 uppercase">Orden asociada: #{payment.orden_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tighter uppercase text-white flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-500" /> HISTORIAL_SOLICITUDES
              </h2>
              {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>

            {error && (
              <div className="p-6 border border-red-500/30 bg-red-500/5 rounded-2xl flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400 text-[10px] font-bold uppercase">{error}</p>
              </div>
            )}

            {!loading && orders.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                <Package className="w-10 h-10 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">No se registran solicitudes en el sistema_</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">
                    <div className="p-4 bg-gray-900/50 border-b border-gray-800 flex flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tighter">SOLICITUD #{order._id?.substr(-6) || order.id}</p>
                          <p className="text-[8px] text-gray-500 font-bold">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          order.status === 'confirmed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {order.status}
                        </span>
                        {order.receipt_url && (
                          <a 
                            href={withApiOrigin(order.receipt_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-black rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                            title="Descargar Comprobante PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-4 divide-y divide-gray-800/50">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between items-center text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-gray-300 font-bold uppercase">{item.title}</span>
                            <span className="text-gray-600 text-[8px] font-bold italic">Sede: {item.pickup_location}</span>
                            <span className="text-[8px] text-purple-400 font-bold uppercase">Tipo: {item.tipo_item || 'fisico'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {(item.tipo_item === 'digital' || item.tipo_item === 'prestamo') && (
                              <button
                                type="button"
                                onClick={() => handleDigitalDownload(item.libro_id, item.tipo_item === 'prestamo' ? 'preview' : 'full')}
                                disabled={downloadingBookId === item.libro_id}
                                className="px-2 py-1 rounded-lg border border-blue-500/20 text-blue-300 hover:bg-blue-500/10 text-[8px] font-black uppercase flex items-center gap-2"
                              >
                                {downloadingBookId === item.libro_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                DESCARGAR
                              </button>
                            )}
                            <span className="text-white font-mono">${item.price?.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      ))}
                      {order.despacho && (
                        <div className="py-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                            <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-2">
                                <Truck className="w-3 h-3" /> DESPACHO_ASOCIADO
                              </p>
                              <div className="flex flex-wrap gap-3 text-[9px] uppercase">
                                <span className="text-gray-400">Código: <span className="text-white font-black">{order.despacho.codigo_seguimiento}</span></span>
                                <span className="text-gray-400">Estado: <span className="text-blue-300 font-black">{order.despacho.estado_envio || 'pendiente'}</span></span>
                              </div>
                              <p className="text-[9px] text-gray-400 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-blue-400" />
                                {order.despacho.direccion_destino || 'Retiro en biblioteca'}
                              </p>
                            </div>
                            <Link
                              to={`/tracking?codigo=${encodeURIComponent(order.despacho.codigo_seguimiento)}`}
                              className="px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-[9px] font-black uppercase tracking-widest text-center"
                            >
                              VER_TRACKING
                            </Link>
                          </div>
                        </div>
                      )}
                      <div className="pt-3 mt-1 flex justify-between items-center">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">TOTAL_TRANSACCIÓN</span>
                        <span className="text-sm font-black text-green-500">${order.total_amount?.toLocaleString('es-CL')}</span>
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
