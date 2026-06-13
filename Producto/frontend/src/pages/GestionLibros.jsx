import { useEffect, useMemo, useState } from 'react';
import { booksApi } from '../api/books';
import { ordersApi } from '../api/orders';
import { paymentsApi } from '../api/payments';
import { shippingApi } from '../api/shipping';
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  Search,
  X,
  Check,
  Upload,
  BookOpen,
  CreditCard,
  Package,
  RefreshCw,
  Ban,
  RotateCcw,
  ShieldAlert,
  Truck,
  LayoutDashboard,
  MapPin,
  Activity,
} from 'lucide-react';
import { withApiOrigin } from '../lib/supabase';

const STATUS_STYLES = {
  pagado: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  pendiente: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  cancelado: 'bg-red-500/10 text-red-300 border-red-500/20',
  reembolsado: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20',
};

const getStatusClasses = (status) => STATUS_STYLES[status] || 'bg-blue-500/10 text-blue-300 border-blue-500/20';
const getPercent = (value, total) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0);

const GestionLibros = () => {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trackings, setTrackings] = useState([]);
  const [libraryLocations, setLibraryLocations] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingTrackings, setLoadingTrackings] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderActionId, setOrderActionId] = useState(null);
  const [paymentActionId, setPaymentActionId] = useState(null);
  const [trackingActionId, setTrackingActionId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [trackingSearchTerm, setTrackingSearchTerm] = useState('');
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    orden_id: '',
    direccion_destino: '',
    sucursal_retiro_id: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: 0,
    description: '',
    pickup_location: 'Plaza de Maipú',
    categories: ['General'],
    status: 'available',
    is_new: true,
  });

  const sbProfile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
  const isAdmin = sbProfile?.role === 'admin';

  useEffect(() => {
    fetchBooks();
    if (isAdmin) {
      fetchOrders();
      fetchPayments();
      fetchTrackings();
      fetchLibraryLocations();
    }
  }, [isAdmin]);

  const fetchBooks = async () => {
    try {
      setLoadingBooks(true);
      const data = await booksApi.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Error al cargar libros:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const data = await paymentsApi.getAllPayments();
      setPayments(data.sort((a, b) => Number(b.id || 0) - Number(a.id || 0)));
    } catch (err) {
      console.error('Error al cargar pagos:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchTrackings = async () => {
    try {
      setLoadingTrackings(true);
      const data = await shippingApi.getTrackings();
      setTrackings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar trackings:', err);
    } finally {
      setLoadingTrackings(false);
    }
  };

  const fetchLibraryLocations = async () => {
    try {
      const data = await shippingApi.getLibraryLocations();
      setLibraryLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar sedes:', err);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price || 0,
      description: book.description || '',
      pickup_location: book.pickup_location || 'Plaza de Maipú',
      categories: book.categories || ['General'],
      status: book.status || 'available',
      is_new: book.is_new ?? true,
    });
    setImageFile(null);
    setShowForm(true);
  };

  const openNewBookForm = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      price: 0,
      description: '',
      pickup_location: 'Plaza de Maipú',
      categories: ['General'],
      status: 'available',
      is_new: true,
    });
    setImageFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBook(null);
    setImageFile(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ejemplar del inventario?')) {
      return;
    }

    try {
      await booksApi.delete(id);
      setBooks((current) => current.filter((book) => (book._id || book.id) !== id));
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Libro eliminado correctamente_' } }));
    } catch (err) {
      console.error('Error al eliminar:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] Error al eliminar el libro_' } }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      let savedBook;
      const finalFormData = {
        ...formData,
        price: Number(formData.price) || 0,
      };

      if (editingBook) {
        savedBook = await booksApi.update(editingBook._id || editingBook.id, finalFormData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Información actualizada_' } }));
      } else {
        savedBook = await booksApi.create(finalFormData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Nuevo libro registrado_' } }));
      }

      if (imageFile && (savedBook._id || savedBook.id)) {
        await booksApi.uploadImage(savedBook._id || savedBook.id, imageFile);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Portada actualizada correctamente_' } }));
      }

      closeForm();
      fetchBooks();
    } catch (err) {
      console.error('Error al guardar:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '[!] Error al guardar los cambios_' },
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      setOrderActionId(`status-${orderId}`);
      await ordersApi.updateStatus(orderId, status);
      await fetchOrders();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} actualizada a ${status}_` } }));
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo actualizar la orden_' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setOrderActionId(`cancel-${orderId}`);
      await ordersApi.cancel(orderId);
      await fetchOrders();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} cancelada correctamente_` } }));
    } catch (err) {
      console.error('Error al cancelar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo cancelar la orden_' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleRefundOrder = async (orderId) => {
    try {
      setOrderActionId(`refund-${orderId}`);
      await ordersApi.refund(orderId);
      await Promise.all([fetchOrders(), fetchPayments()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} reembolsada correctamente_` } }));
    } catch (err) {
      console.error('Error al reembolsar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo reembolsar la orden_' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      setPaymentActionId(`confirm-${paymentId}`);
      await paymentsApi.confirm(paymentId);
      await Promise.all([fetchPayments(), fetchOrders()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} confirmado correctamente_` } }));
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo confirmar el pago_' } }));
    } finally {
      setPaymentActionId(null);
    }
  };

  const handleRefundPayment = async (paymentId) => {
    try {
      setPaymentActionId(`refund-${paymentId}`);
      await paymentsApi.refund(paymentId);
      await Promise.all([fetchPayments(), fetchOrders()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} reembolsado correctamente_` } }));
    } catch (err) {
      console.error('Error al reembolsar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo reembolsar el pago_' } }));
    } finally {
      setPaymentActionId(null);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm(`¿Eliminar el pago #${paymentId}? Esta acción es irreversible.`)) {
      return;
    }

    try {
      setPaymentActionId(`delete-${paymentId}`);
      await paymentsApi.delete(paymentId);
      await fetchPayments();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} eliminado correctamente_` } }));
    } catch (err) {
      console.error('Error al eliminar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo eliminar el pago_' } }));
    } finally {
      setPaymentActionId(null);
    }
  };

  const handleCreateTracking = async (e) => {
    e.preventDefault();

    try {
      setTrackingActionId('create');
      await shippingApi.createTracking({
        orden_id: Number(trackingForm.orden_id),
        direccion_destino: trackingForm.direccion_destino || null,
        sucursal_retiro_id: trackingForm.sucursal_retiro_id ? Number(trackingForm.sucursal_retiro_id) : null,
      });
      setTrackingForm({
        orden_id: '',
        direccion_destino: '',
        sucursal_retiro_id: '',
      });
      await fetchTrackings();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Tracking creado correctamente_' } }));
    } catch (err) {
      console.error('Error al crear tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo crear el tracking_' } }));
    } finally {
      setTrackingActionId(null);
    }
  };

  const handleTrackingStatus = async (code, nuevoEstado) => {
    try {
      setTrackingActionId(`status-${code}`);
      await shippingApi.updateTracking(code, { nuevo_estado: nuevoEstado });
      await fetchTrackings();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Tracking ${code} actualizado a ${nuevoEstado}_` } }));
    } catch (err) {
      console.error('Error al actualizar tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo actualizar el tracking_' } }));
    } finally {
      setTrackingActionId(null);
    }
  };

  const handleDeleteTracking = async (code) => {
    if (!window.confirm(`¿Eliminar el tracking ${code}?`)) {
      return;
    }

    try {
      setTrackingActionId(`delete-${code}`);
      await shippingApi.deleteTracking(code);
      await fetchTrackings();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Tracking ${code} eliminado correctamente_` } }));
    } catch (err) {
      console.error('Error al eliminar tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '[!] No se pudo eliminar el tracking_' } }));
    } finally {
      setTrackingActionId(null);
    }
  };

  const filteredBooks = useMemo(
    () =>
      books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [books, searchTerm]
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const value = orderSearchTerm.toLowerCase();
        return (
          String(order._id || order.id).includes(value) ||
          String(order.usuario_id || '').toLowerCase().includes(value) ||
          String(order.status || '').toLowerCase().includes(value) ||
          order.items?.some((item) => item.title?.toLowerCase().includes(value))
        );
      }),
    [orders, orderSearchTerm]
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const value = paymentSearchTerm.toLowerCase();
        return (
          String(payment.id).includes(value) ||
          String(payment.orden_id).includes(value) ||
          String(payment.usuario_id || '').toLowerCase().includes(value) ||
          String(payment.metodo_pago || '').toLowerCase().includes(value) ||
          String(payment.estado || '').toLowerCase().includes(value)
        );
      }),
    [payments, paymentSearchTerm]
  );

  const filteredTrackings = useMemo(
    () =>
      trackings.filter((tracking) => {
        const value = trackingSearchTerm.toLowerCase();
        return (
          String(tracking.codigo_seguimiento || '').toLowerCase().includes(value) ||
          String(tracking.orden_id || '').includes(value) ||
          String(tracking.estado_envio || '').toLowerCase().includes(value) ||
          String(tracking.direccion_destino || '').toLowerCase().includes(value)
        );
      }),
    [trackings, trackingSearchTerm]
  );

  const dashboardMetrics = useMemo(() => {
    const totalRevenue = payments
      .filter((payment) => payment.estado === 'pagado')
      .reduce((sum, payment) => sum + Number(payment.monto || 0), 0);

    return {
      totalBooks: books.length,
      availableBooks: books.filter((book) => book.status === 'available').length,
      totalOrders: orders.length,
      paidOrders: orders.filter((order) => order.status === 'pagado').length,
      pendingOrders: orders.filter((order) => order.status === 'pendiente').length,
      totalPayments: payments.length,
      paidPayments: payments.filter((payment) => payment.estado === 'pagado').length,
      refundedPayments: payments.filter((payment) => payment.estado === 'reembolsado').length,
      totalRevenue,
      totalTrackings: trackings.length,
      activeTrackings: trackings.filter((tracking) => tracking.estado_envio !== 'entregado').length,
    };
  }, [books, orders, payments, trackings]);

  const dashboardSeries = useMemo(
    () => ({
      orders: [
        { label: 'Pagadas', value: dashboardMetrics.paidOrders, color: 'bg-emerald-500' },
        { label: 'Pendientes', value: dashboardMetrics.pendingOrders, color: 'bg-yellow-500' },
        {
          label: 'Otros estados',
          value: Math.max(0, dashboardMetrics.totalOrders - dashboardMetrics.paidOrders - dashboardMetrics.pendingOrders),
          color: 'bg-blue-500',
        },
      ],
      payments: [
        { label: 'Confirmados', value: dashboardMetrics.paidPayments, color: 'bg-emerald-500' },
        { label: 'Reembolsados', value: dashboardMetrics.refundedPayments, color: 'bg-fuchsia-500' },
        {
          label: 'Pendientes',
          value: Math.max(0, dashboardMetrics.totalPayments - dashboardMetrics.paidPayments - dashboardMetrics.refundedPayments),
          color: 'bg-yellow-500',
        },
      ],
      shipping: [
        { label: 'Activos', value: dashboardMetrics.activeTrackings, color: 'bg-blue-500' },
        {
          label: 'Entregados',
          value: Math.max(0, dashboardMetrics.totalTrackings - dashboardMetrics.activeTrackings),
          color: 'bg-emerald-500',
        },
      ],
    }),
    [dashboardMetrics]
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono flex items-center justify-center">
        <div className="max-w-lg w-full border border-red-500/20 bg-gray-900/40 rounded-3xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">ACCESO_RESTRINGIDO</h1>
          <p className="text-sm text-gray-400">Esta sección requiere privilegios administrativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-blue-500">CENTRO_ADMINISTRATIVO</h1>
            <p className="text-gray-500 text-xs mt-1 italic">Dashboard, inventario, órdenes, pagos y tracking en un único panel_</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePanel('dashboard')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                activePanel === 'dashboard' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              DASHBOARD
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('inventory')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                activePanel === 'inventory' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              INVENTARIO
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('orders')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                activePanel === 'orders' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              ÓRDENES
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('payments')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                activePanel === 'payments' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              PAGOS
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('shipping')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                activePanel === 'shipping' ? 'bg-blue-600/20 border-blue-500/30 text-blue-300' : 'bg-gray-900/40 border-gray-800 text-gray-400'
              }`}
            >
              TRACKING
            </button>
          </div>
        </div>

        {activePanel === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-400" /> DASHBOARD_OPERATIVO
              </h2>
              <p className="text-gray-500 text-xs mt-1">Resumen rápido del estado comercial y logístico del sistema_</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">CATÁLOGO</p>
                <p className="text-3xl font-black text-white">{dashboardMetrics.totalBooks}</p>
                <p className="text-[10px] text-blue-300 uppercase">Disponibles: {dashboardMetrics.availableBooks}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">ÓRDENES</p>
                <p className="text-3xl font-black text-white">{dashboardMetrics.totalOrders}</p>
                <p className="text-[10px] text-yellow-300 uppercase">Pendientes: {dashboardMetrics.pendingOrders}</p>
                <p className="text-[10px] text-emerald-300 uppercase">Pagadas: {dashboardMetrics.paidOrders}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">PAGOS</p>
                <p className="text-3xl font-black text-white">{dashboardMetrics.totalPayments}</p>
                <p className="text-[10px] text-emerald-300 uppercase">Confirmados: {dashboardMetrics.paidPayments}</p>
                <p className="text-[10px] text-fuchsia-300 uppercase">Reembolsados: {dashboardMetrics.refundedPayments}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-2">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">INGRESOS</p>
                <p className="text-3xl font-black text-emerald-400">${dashboardMetrics.totalRevenue.toLocaleString('es-CL')}</p>
                <p className="text-[10px] text-blue-300 uppercase">Trackings activos: {dashboardMetrics.activeTrackings}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" /> ÚLTIMAS_ÓRDENES
                </h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id || order.id} className="rounded-xl border border-gray-800 bg-black/30 p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">Orden #{order._id || order.id}</p>
                        <p className="text-[9px] text-gray-500 uppercase">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full border text-[8px] font-black uppercase ${getStatusClasses(order.status)}`}>{order.status}</span>
                        <p className="text-[10px] text-emerald-400 font-black mt-2">${Number(order.total_amount || 0).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" /> TRACKING_RECIENTE
                </h3>
                <div className="space-y-3">
                  {trackings.slice(0, 5).map((tracking) => (
                    <div key={tracking.codigo_seguimiento} className="rounded-xl border border-gray-800 bg-black/30 p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{tracking.codigo_seguimiento}</p>
                        <p className="text-[9px] text-gray-500 uppercase">Orden #{tracking.orden_id}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[8px] font-black uppercase">
                        {tracking.estado_envio}
                      </span>
                    </div>
                  ))}
                  {trackings.length === 0 && (
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">No hay despachos registrados_</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">GRÁFICO_ÓRDENES</h3>
                {dashboardSeries.orders.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 uppercase">{entry.label}</span>
                      <span className="text-white font-black">{entry.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className={`h-full ${entry.color}`}
                        style={{ width: `${getPercent(entry.value, dashboardMetrics.totalOrders)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">GRÁFICO_PAGOS</h3>
                {dashboardSeries.payments.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 uppercase">{entry.label}</span>
                      <span className="text-white font-black">{entry.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className={`h-full ${entry.color}`}
                        style={{ width: `${getPercent(entry.value, dashboardMetrics.totalPayments)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">GRÁFICO_ENVÍOS</h3>
                {dashboardSeries.shipping.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 uppercase">{entry.label}</span>
                      <span className="text-white font-black">{entry.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className={`h-full ${entry.color}`}
                        style={{ width: `${getPercent(entry.value, dashboardMetrics.totalTrackings)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" /> GESTIÓN_DE_INVENTARIO
                </h2>
                <p className="text-gray-500 text-xs mt-1">Administración central de ejemplares y portadas_</p>
              </div>
              <button
                onClick={openNewBookForm}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" /> REGISTRAR_NUEVO_ACTIVO
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por título o autor..."
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>

            <div className="bg-gray-900/20 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Portada</th>
                    <th className="px-6 py-4">Detalles del Libro</th>
                    <th className="px-6 py-4">Ubicación / Sede</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4 text-right">Acciones_</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {loadingBooks ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                      </td>
                    </tr>
                  ) : filteredBooks.map((book) => (
                    <tr key={book._id || book.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-16 bg-black rounded border border-gray-800 overflow-hidden flex items-center justify-center">
                          {book.image_url ? (
                            <img src={withApiOrigin(book.image_url)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={book.title} />
                          ) : (
                            <BookOpen className="w-6 h-6 text-gray-700" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-200 uppercase">{book.title}</p>
                        <p className="text-[10px] text-gray-600 italic">Autor: {book.author}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-bold">{book.pickup_location}</td>
                      <td className="px-6 py-4 font-black text-green-500">${(book.price || 0).toLocaleString('es-CL')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(book)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(book._id || book.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePanel === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" /> ÓRDENES_DEL_SISTEMA
                </h2>
                <p className="text-gray-500 text-xs mt-1">Control de estado, cancelación y reembolso de pedidos_</p>
              </div>
              <button onClick={fetchOrders} className="px-4 py-2 rounded-xl border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> REFRESCAR
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por orden, usuario, estado o libro..."
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredOrders.length === 0 ? (
                <div className="border border-dashed border-gray-800 rounded-2xl py-14 text-center text-[11px] text-gray-500 uppercase tracking-widest">
                  No hay órdenes para mostrar_
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order._id || order.id} className="border border-gray-800 bg-gray-900/20 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-white font-black uppercase tracking-tight">Orden #{order._id || order.id}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Usuario: {order.usuario_id}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Fecha: {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${getStatusClasses(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-emerald-400 font-black">${Number(order.total_amount || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(order.items || []).map((item, index) => (
                        <div key={`${order._id || order.id}-${index}`} className="rounded-xl border border-gray-800 bg-black/30 p-3 flex justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold text-gray-200 uppercase">{item.title}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Tipo: {item.tipo_item || 'fisico'}</p>
                            <p className="text-[9px] text-gray-500 uppercase">Cantidad: {item.quantity}</p>
                          </div>
                          <span className="text-[10px] text-white font-black">${Number(item.price || 0).toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleOrderStatus(order._id || order.id, 'pendiente')}
                        className="px-3 py-2 rounded-xl border border-yellow-500/20 text-yellow-300 bg-yellow-500/10 text-[10px] font-black uppercase"
                      >
                        {orderActionId === `status-${order._id || order.id}` ? 'PROCESANDO...' : 'MARCAR_PENDIENTE'}
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleOrderStatus(order._id || order.id, 'pagado')}
                        className="px-3 py-2 rounded-xl border border-emerald-500/20 text-emerald-300 bg-emerald-500/10 text-[10px] font-black uppercase"
                      >
                        MARCAR_PAGADO
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleCancelOrder(order._id || order.id)}
                        className="px-3 py-2 rounded-xl border border-red-500/20 text-red-300 bg-red-500/10 text-[10px] font-black uppercase flex items-center gap-2"
                      >
                        <Ban className="w-3 h-3" /> CANCELAR
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleRefundOrder(order._id || order.id)}
                        className="px-3 py-2 rounded-xl border border-fuchsia-500/20 text-fuchsia-300 bg-fuchsia-500/10 text-[10px] font-black uppercase flex items-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3" /> REEMBOLSAR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePanel === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" /> PAGOS_DEL_SISTEMA
                </h2>
                <p className="text-gray-500 text-xs mt-1">Auditoría, confirmación, reembolso y limpieza de intents_</p>
              </div>
              <button onClick={fetchPayments} className="px-4 py-2 rounded-xl border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> REFRESCAR
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por pago, orden, usuario, estado o método..."
                className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            </div>

            <div className="space-y-4">
              {loadingPayments ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredPayments.length === 0 ? (
                <div className="border border-dashed border-gray-800 rounded-2xl py-14 text-center text-[11px] text-gray-500 uppercase tracking-widest">
                  No hay pagos para mostrar_
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <div key={payment.id} className="border border-gray-800 bg-gray-900/20 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-white font-black uppercase tracking-tight">Pago #{payment.id}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Orden asociada: #{payment.orden_id}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Usuario: {payment.usuario_id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${getStatusClasses(payment.estado)}`}>
                          {payment.estado}
                        </span>
                        <span className="text-blue-300 font-black uppercase text-[10px]">{payment.metodo_pago}</span>
                        <span className="text-emerald-400 font-black">${Number(payment.monto || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleConfirmPayment(payment.id)}
                        className="px-3 py-2 rounded-xl border border-emerald-500/20 text-emerald-300 bg-emerald-500/10 text-[10px] font-black uppercase"
                      >
                        {paymentActionId === `confirm-${payment.id}` ? 'PROCESANDO...' : 'CONFIRMAR'}
                      </button>
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleRefundPayment(payment.id)}
                        className="px-3 py-2 rounded-xl border border-fuchsia-500/20 text-fuchsia-300 bg-fuchsia-500/10 text-[10px] font-black uppercase flex items-center gap-2"
                      >
                        <RotateCcw className="w-3 h-3" /> REEMBOLSAR
                      </button>
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleDeletePayment(payment.id)}
                        className="px-3 py-2 rounded-xl border border-red-500/20 text-red-300 bg-red-500/10 text-[10px] font-black uppercase flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" /> ELIMINAR
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePanel === 'shipping' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400" /> TRACKING_Y_ENVÍOS
                </h2>
                <p className="text-gray-500 text-xs mt-1">Creación, seguimiento y actualización de guías de despacho_</p>
              </div>
              <button onClick={fetchTrackings} className="px-4 py-2 rounded-xl border border-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/5 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> REFRESCAR
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/20 p-5 space-y-4">
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" /> NUEVO_TRACKING
                </h3>
                <form onSubmit={handleCreateTracking} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">ORDEN</label>
                    <select
                      required
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none"
                      value={trackingForm.orden_id}
                      onChange={(e) => setTrackingForm((current) => ({ ...current, orden_id: e.target.value }))}
                    >
                      <option value="">Selecciona una orden</option>
                      {orders.map((order) => (
                        <option key={order._id || order.id} value={order._id || order.id}>
                          Orden #{order._id || order.id} - {order.usuario_id}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">DIRECCIÓN_DESTINO</label>
                    <input
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none"
                      value={trackingForm.direccion_destino}
                      onChange={(e) => setTrackingForm((current) => ({ ...current, direccion_destino: e.target.value }))}
                      placeholder="Ej: Av. Central 123, Maipú"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">SUCURSAL_RETIRO</label>
                    <select
                      className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none"
                      value={trackingForm.sucursal_retiro_id}
                      onChange={(e) => setTrackingForm((current) => ({ ...current, sucursal_retiro_id: e.target.value }))}
                    >
                      <option value="">Sin sucursal específica</option>
                      {libraryLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.nombre || location.name || `Sucursal #${location.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={trackingActionId !== null}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {trackingActionId === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    CREAR_TRACKING
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por código, orden, estado o dirección..."
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-blue-500 outline-none transition-all"
                    value={trackingSearchTerm}
                    onChange={(e) => setTrackingSearchTerm(e.target.value)}
                  />
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                </div>

                <div className="space-y-4">
                  {loadingTrackings ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                  ) : filteredTrackings.length === 0 ? (
                    <div className="border border-dashed border-gray-800 rounded-2xl py-14 text-center text-[11px] text-gray-500 uppercase tracking-widest">
                      No hay trackings para mostrar_
                    </div>
                  ) : (
                    filteredTrackings.map((tracking) => (
                      <div key={tracking.codigo_seguimiento} className="border border-gray-800 bg-gray-900/20 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-white font-black uppercase tracking-tight">{tracking.codigo_seguimiento}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Orden #{tracking.orden_id}</p>
                            <p className="text-[10px] text-gray-500 uppercase flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {tracking.direccion_destino || 'Sin dirección'}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-[9px] font-black uppercase">
                            {tracking.estado_envio}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'en_preparacion')}
                            className="px-3 py-2 rounded-xl border border-yellow-500/20 text-yellow-300 bg-yellow-500/10 text-[10px] font-black uppercase"
                          >
                            PREPARACIÓN
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'en_ruta')}
                            className="px-3 py-2 rounded-xl border border-blue-500/20 text-blue-300 bg-blue-500/10 text-[10px] font-black uppercase"
                          >
                            EN_RUTA
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'entregado')}
                            className="px-3 py-2 rounded-xl border border-emerald-500/20 text-emerald-300 bg-emerald-500/10 text-[10px] font-black uppercase"
                          >
                            ENTREGADO
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleDeleteTracking(tracking.codigo_seguimiento)}
                            className="px-3 py-2 rounded-xl border border-red-500/20 text-red-300 bg-red-500/10 text-[10px] font-black uppercase flex items-center gap-2"
                          >
                            <Trash2 className="w-3 h-3" /> ELIMINAR
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                <h2 className="text-xl font-black uppercase tracking-tighter">{editingBook ? 'EDITAR_ACTIVO' : 'NUEVO_ACTIVO'}</h2>
                <button onClick={closeForm} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">TÍTULO</label>
                    <input required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">AUTOR</label>
                    <input required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">PRECIO ($)</label>
                    <input type="number" required className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">SEDE_RETIRO</label>
                    <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.pickup_location} onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}>
                      <option value="Plaza de Maipú">Plaza de Maipú</option>
                      <option value="Ciudad Satélite">Ciudad Satélite</option>
                      <option value="El Abrazo">El Abrazo</option>
                      <option value="Hospital El Carmen">Hospital El Carmen</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">ÁREA_TEMÁTICA</label>
                    <select className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none" value={formData.categories[0]} onChange={(e) => setFormData({ ...formData, categories: [e.target.value] })}>
                      <option value="General">General</option>
                      <option value="Historia">Historia</option>
                      <option value="Educación">Educación</option>
                      <option value="Literatura">Literatura</option>
                      <option value="Ciencia">Ciencia</option>
                      <option value="Infantil">Infantil</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">DESCRIPCIÓN</label>
                    <textarea rows="3" className="w-full bg-black border border-gray-800 rounded-xl px-4 py-2 text-xs focus:border-blue-500 outline-none resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-600 uppercase mb-1 block">PORTADA (OPCIONAL)</label>
                    <div className="mb-3 h-40 bg-black border border-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
                      {imageFile || editingBook?.image_url ? (
                        <img
                          src={imageFile ? URL.createObjectURL(imageFile) : withApiOrigin(editingBook.image_url)}
                          alt="Vista previa de portada"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-10 h-10 text-gray-700" />
                      )}
                    </div>
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setImageFile(e.target.files[0])} />
                      <div className="bg-black border border-gray-800 rounded-xl px-4 py-2 text-[10px] flex items-center gap-2 text-gray-500 italic">
                        <Upload className="w-3 h-3" /> {imageFile ? imageFile.name : 'Click para subir imagen...'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeForm} className="px-6 py-2 border border-gray-800 rounded-xl text-[10px] font-bold uppercase hover:bg-white/5 transition-all text-gray-500">CANCELAR</button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingBook ? 'GUARDAR_CAMBIOS' : 'REGISTRAR_ACTIVO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionLibros;
