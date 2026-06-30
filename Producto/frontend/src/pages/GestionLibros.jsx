import { useEffect, useMemo, useState, useRef } from 'react';
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
import {
  formatItemType,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatTrackingStatus,
} from '../lib/labels';
import { statusStyles, theme } from '../lib/theme';

const STATUS_STYLES = {
  pagado: statusStyles.success,
  pendiente: statusStyles.warning,
  cancelado: statusStyles.danger,
  reembolsado: statusStyles.accent,
  confirmed: statusStyles.success,
  approved: statusStyles.success,
  rejected: statusStyles.danger,
  en_preparacion: statusStyles.warning,
  en_ruta: statusStyles.info,
  entregado: statusStyles.success,
};

const DASHBOARD_STATUS_STYLES = {
  pagado: 'border-[#a9cdbb] bg-[#eff9f3] text-[#4f7b67]',
  pendiente: 'border-[#d9c29b] bg-[#fbf3e5] text-[#8a6b40]',
  cancelado: 'border-[#dfb5b0] bg-[#fbefee] text-[#9b5550]',
  reembolsado: 'border-[#d1c0e3] bg-[#f5effb] text-[#75618f]',
  confirmed: 'border-[#a9cdbb] bg-[#eff9f3] text-[#4f7b67]',
  approved: 'border-[#a9cdbb] bg-[#eff9f3] text-[#4f7b67]',
  rejected: 'border-[#dfb5b0] bg-[#fbefee] text-[#9b5550]',
  en_preparacion: 'border-[#d9c29b] bg-[#fbf3e5] text-[#8a6b40]',
  en_ruta: 'border-[#b9d8ea] bg-[#f1f9fe] text-[#4f7898]',
  entregado: 'border-[#a9cdbb] bg-[#eff9f3] text-[#4f7b67]',
};

const getStatusClasses = (status) => STATUS_STYLES[status] || statusStyles.info;
const getDashboardStatusClasses = (status) => DASHBOARD_STATUS_STYLES[status] || 'border-[#b9d8ea] bg-[#f1f9fe] text-[#4f7898]';
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
  const blobUrlRef = useRef(null);

  const handleFileSelect = (file) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    setImageFile(file);
    blobUrlRef.current = file ? URL.createObjectURL(file) : null;
  };

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);
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

  let sbProfile = null;
  try { sbProfile = JSON.parse(localStorage.getItem('sb_profile')); } catch {}
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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Libro eliminado correctamente.' } }));
    } catch (err) {
      console.error('Error al eliminar:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo eliminar el libro.' } }));
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
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Información actualizada.' } }));
      } else {
        savedBook = await booksApi.create(finalFormData);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Nuevo libro registrado.' } }));
      }

      if (imageFile && (savedBook._id || savedBook.id)) {
        await booksApi.uploadImage(savedBook._id || savedBook.id, imageFile);
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Portada actualizada correctamente.' } }));
      }

      closeForm();
      fetchBooks();
    } catch (err) {
      console.error('Error al guardar:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'No se pudieron guardar los cambios.' },
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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} actualizada a ${formatOrderStatus(status)}.` } }));
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo actualizar la orden.' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setOrderActionId(`cancel-${orderId}`);
      await ordersApi.cancel(orderId);
      await fetchOrders();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} cancelada correctamente.` } }));
    } catch (err) {
      console.error('Error al cancelar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo cancelar la orden.' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleRefundOrder = async (orderId) => {
    try {
      setOrderActionId(`refund-${orderId}`);
      await ordersApi.refund(orderId);
      await Promise.all([fetchOrders(), fetchPayments()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Orden #${orderId} reembolsada correctamente.` } }));
    } catch (err) {
      console.error('Error al reembolsar orden:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo reembolsar la orden.' } }));
    } finally {
      setOrderActionId(null);
    }
  };

  const handleConfirmPayment = async (paymentId) => {
    try {
      setPaymentActionId(`confirm-${paymentId}`);
      await paymentsApi.confirm(paymentId);
      await Promise.all([fetchPayments(), fetchOrders()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} confirmado correctamente.` } }));
    } catch (err) {
      console.error('Error al confirmar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo confirmar el pago.' } }));
    } finally {
      setPaymentActionId(null);
    }
  };

  const handleRefundPayment = async (paymentId) => {
    try {
      setPaymentActionId(`refund-${paymentId}`);
      await paymentsApi.refund(paymentId);
      await Promise.all([fetchPayments(), fetchOrders()]);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} reembolsado correctamente.` } }));
    } catch (err) {
      console.error('Error al reembolsar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo reembolsar el pago.' } }));
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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Pago #${paymentId} eliminado correctamente.` } }));
    } catch (err) {
      console.error('Error al eliminar pago:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo eliminar el pago.' } }));
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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Tracking creado correctamente.' } }));
    } catch (err) {
      console.error('Error al crear tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo crear el tracking.' } }));
    } finally {
      setTrackingActionId(null);
    }
  };

  const handleTrackingStatus = async (code, nuevoEstado) => {
    try {
      setTrackingActionId(`status-${code}`);
      await shippingApi.updateTracking(code, { nuevo_estado: nuevoEstado });
      await fetchTrackings();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Tracking ${code} actualizado a ${formatTrackingStatus(nuevoEstado)}.` } }));
    } catch (err) {
      console.error('Error al actualizar tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo actualizar el tracking.' } }));
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
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Tracking ${code} eliminado correctamente.` } }));
    } catch (err) {
      console.error('Error al eliminar tracking:', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'No se pudo eliminar el tracking.' } }));
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
          <h1 className="text-2xl font-black uppercase tracking-tighter">Acceso restringido</h1>
          <p className="text-sm text-gray-400">Esta sección requiere privilegios administrativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.pageShell}>
      <div className={theme.pageContainer}>
        <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-[#b9926d] pb-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#224870]">Centro administrativo</h1>
            <p className="mt-1 text-xs italic text-[#4f6983]">Dashboard, inventario, órdenes, pagos y tracking en un solo panel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActivePanel('dashboard')}
              className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                activePanel === 'dashboard' ? 'border-[#2f5d86] bg-[#dbe8f5] text-[#224870]' : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40]'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('inventory')}
              className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                activePanel === 'inventory' ? 'border-[#2f5d86] bg-[#dbe8f5] text-[#224870]' : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40]'
              }`}
            >
              Inventario
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('orders')}
              className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                activePanel === 'orders' ? 'border-[#2f5d86] bg-[#dbe8f5] text-[#224870]' : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40]'
              }`}
            >
              Órdenes
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('payments')}
              className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                activePanel === 'payments' ? 'border-[#2f5d86] bg-[#dbe8f5] text-[#224870]' : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40]'
              }`}
            >
              Pagos
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('shipping')}
              className={`rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                activePanel === 'shipping' ? 'border-[#2f5d86] bg-[#dbe8f5] text-[#224870]' : 'border-[#d2b08f] bg-[#fffaf4] text-[#7f5c40]'
              }`}
            >
              Tracking
            </button>
          </div>
        </div>

        {activePanel === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#224870]">
                <LayoutDashboard className="w-5 h-5 text-[#2f5d86]" /> Dashboard operativo
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#4f6983]">Resumen rápido del estado comercial y logístico del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-black bg-[#eaf7ff] p-5 space-y-2 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5e7890]">CATÁLOGO</p>
                <p className="text-3xl font-black text-[#355873]">{dashboardMetrics.totalBooks}</p>
                <p className="text-[10px] font-bold uppercase text-[#4f7898]">Disponibles: {dashboardMetrics.availableBooks}</p>
              </div>
              <div className="rounded-2xl border border-black bg-[#eaf7ff] p-5 space-y-2 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5e7890]">ÓRDENES</p>
                <p className="text-3xl font-black text-[#355873]">{dashboardMetrics.totalOrders}</p>
                <p className="text-[10px] font-bold uppercase text-[#9a8154]">Pendientes: {dashboardMetrics.pendingOrders}</p>
                <p className="text-[10px] font-bold uppercase text-[#5e8d74]">Pagadas: {dashboardMetrics.paidOrders}</p>
              </div>
              <div className="rounded-2xl border border-black bg-[#eaf7ff] p-5 space-y-2 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5e7890]">PAGOS</p>
                <p className="text-3xl font-black text-[#355873]">{dashboardMetrics.totalPayments}</p>
                <p className="text-[10px] font-bold uppercase text-[#5e8d74]">Confirmados: {dashboardMetrics.paidPayments}</p>
                <p className="text-[10px] font-bold uppercase text-[#80709c]">Reembolsados: {dashboardMetrics.refundedPayments}</p>
              </div>
              <div className="rounded-2xl border border-black bg-[#eaf7ff] p-5 space-y-2 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5e7890]">INGRESOS</p>
                <p className="text-3xl font-black text-[#5e8d74]">${dashboardMetrics.totalRevenue.toLocaleString('es-CL')}</p>
                <p className="text-[10px] font-bold uppercase text-[#4f7898]">Trackings activos: {dashboardMetrics.activeTrackings}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-black bg-[#e3f4ff] p-5 space-y-4 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">
                  <Activity className="w-4 h-4 text-[#5f89aa]" /> Últimas órdenes
                </h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id || order.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#aacde2] bg-[#f7fcff] p-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#355873]">Orden #{order._id || order.id}</p>
                        <p className="text-[9px] font-semibold uppercase text-[#5e7890]">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full border-2 px-2 py-1 text-[8px] font-black uppercase ${getDashboardStatusClasses(order.status)}`}>{formatOrderStatus(order.status)}</span>
                        <p className="mt-2 text-[10px] font-black text-[#5e8d74]">${Number(order.total_amount || 0).toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black bg-[#e3f4ff] p-5 space-y-4 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">
                  <Truck className="w-4 h-4 text-[#5f89aa]" /> Tracking reciente
                </h3>
                <div className="space-y-3">
                  {trackings.slice(0, 5).map((tracking) => (
                    <div key={tracking.codigo_seguimiento} className="flex items-center justify-between gap-3 rounded-xl border border-[#aacde2] bg-[#f7fcff] p-3">
                      <div>
                        <p className="text-[10px] font-black uppercase text-[#355873]">{tracking.codigo_seguimiento}</p>
                        <p className="text-[9px] font-semibold uppercase text-[#5e7890]">Orden #{tracking.orden_id}</p>
                      </div>
                      <span className={`rounded-full border-2 px-2 py-1 text-[8px] font-black uppercase ${getDashboardStatusClasses(tracking.estado_envio)}`}>
                        {formatTrackingStatus(tracking.estado_envio)}
                      </span>
                    </div>
                  ))}
                  {trackings.length === 0 && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5e7890]">No hay despachos registrados.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-black bg-[#e3f4ff] p-5 space-y-4 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">Gráfico de órdenes</h3>
                {dashboardSeries.orders.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[#5e7890]">{entry.label}</span>
                      <span className="font-black text-[#355873]">{entry.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#c1deef]">
                      <div
                        className={`h-full ${entry.color}`}
                        style={{ width: `${getPercent(entry.value, dashboardMetrics.totalOrders)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-black bg-[#e3f4ff] p-5 space-y-4 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">Gráfico de pagos</h3>
                {dashboardSeries.payments.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[#5e7890]">{entry.label}</span>
                      <span className="font-black text-[#355873]">{entry.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#c1deef]">
                      <div
                        className={`h-full ${entry.color}`}
                        style={{ width: `${getPercent(entry.value, dashboardMetrics.totalPayments)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-black bg-[#e3f4ff] p-5 space-y-4 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">Gráfico de envíos</h3>
                {dashboardSeries.shipping.map((entry) => (
                  <div key={entry.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase text-[#5e7890]">{entry.label}</span>
                      <span className="font-black text-[#355873]">{entry.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#c1deef]">
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
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#224870]">
                  <BookOpen className="w-5 h-5 text-[#2f5d86]" /> Gestión de inventario
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#4f6983]">Administración central de ejemplares y portadas.</p>
              </div>
              <button
                onClick={openNewBookForm}
                className="flex items-center gap-2 rounded-xl border border-black bg-[#d6ecfa] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#224870] shadow-[0_12px_24px_rgba(93,149,190,0.14)] transition-all hover:bg-[#c7e4f7]"
              >
                <Plus className="w-4 h-4" /> Registrar nuevo libro
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por título o autor..."
                className="w-full rounded-xl border border-black bg-[#f7fcff] pl-10 pr-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f89aa]" />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-black bg-[#e3f4ff] shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-black bg-[#d6ecfa] text-[10px] font-black uppercase tracking-widest text-[#355873]">
                    <th className="px-6 py-4">Portada</th>
                    <th className="px-6 py-4">Detalles del Libro</th>
                    <th className="px-6 py-4">Ubicación / Sede</th>
                    <th className="px-6 py-4">Precio</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#aacde2]">
                  {loadingBooks ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#5f89aa]" />
                      </td>
                    </tr>
                  ) : filteredBooks.map((book) => (
                    <tr key={book._id || book.id} className="group transition-all hover:bg-[#f7fcff]">
                      <td className="px-6 py-4">
                        <div className="flex h-16 w-12 items-center justify-center overflow-hidden rounded border border-[#aacde2] bg-[#f7fcff]">
                          {book.image_url ? (
                            <img src={withApiOrigin(book.image_url)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={book.title} />
                          ) : (
                            <BookOpen className="w-6 h-6 text-[#5f89aa]" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black uppercase text-[#355873]">{book.title}</p>
                        <p className="text-[10px] font-semibold italic text-[#5e7890]">Autor: {book.author}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-[#5e7890]">{book.pickup_location}</td>
                      <td className="px-6 py-4 font-black text-[#4f7b67]">${(book.price || 0).toLocaleString('es-CL')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(book)} className="rounded-lg border border-black bg-[#d6ecfa] p-2 text-[#355873] transition-all hover:bg-[#c7e4f7]"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(book._id || book.id)} className="rounded-lg border border-[#dfb5b0] bg-[#fbefee] p-2 text-[#9b5550] transition-all hover:bg-[#f8e1df]"><Trash2 className="w-4 h-4" /></button>
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
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#224870]">
                  <Package className="w-5 h-5 text-[#2f5d86]" /> Órdenes del sistema
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#4f6983]">Control de estado, cancelación y reembolso de pedidos.</p>
              </div>
              <button onClick={fetchOrders} className="flex items-center gap-2 rounded-xl border border-black bg-[#d6ecfa] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#224870] transition-all hover:bg-[#c7e4f7]">
                <RefreshCw className="w-4 h-4" /> Refrescar
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por orden, usuario, estado o libro..."
                className="w-full rounded-xl border border-black bg-[#f7fcff] pl-10 pr-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f89aa]" />
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#5f89aa]" /></div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#aacde2] bg-[#e3f4ff] px-4 py-14 text-center text-[11px] font-bold uppercase tracking-widest text-[#5e7890]">
                  No hay órdenes para mostrar.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order._id || order.id} className="space-y-4 rounded-2xl border border-black bg-[#e3f4ff] p-5 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tight text-[#355873]">Orden #{order._id || order.id}</p>
                        <p className="text-[10px] font-bold uppercase text-[#5e7890]">Usuario: {order.usuario_id}</p>
                        <p className="text-[10px] font-bold uppercase text-[#5e7890]">Fecha: {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase ${getDashboardStatusClasses(order.status)}`}>
                          {formatOrderStatus(order.status)}
                        </span>
                        <span className="font-black text-[#4f7b67]">${Number(order.total_amount || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(order.items || []).map((item, index) => (
                        <div key={`${order._id || order.id}-${index}`} className="flex justify-between gap-3 rounded-xl border border-[#aacde2] bg-[#f7fcff] p-3">
                          <div>
                            <p className="text-[10px] font-black uppercase text-[#355873]">{item.title}</p>
                            <p className="text-[9px] font-semibold uppercase text-[#5e7890]">Tipo: {formatItemType(item.tipo_item || 'fisico')}</p>
                            <p className="text-[9px] font-semibold uppercase text-[#5e7890]">Cantidad: {item.quantity}</p>
                          </div>
                          <span className="text-[10px] font-black text-[#355873]">${Number(item.price || 0).toLocaleString('es-CL')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleOrderStatus(order._id || order.id, 'pendiente')}
                        className="rounded-xl border-2 border-[#d9c29b] bg-[#fbf3e5] px-3 py-2 text-[10px] font-black uppercase text-[#8a6b40]"
                      >
                        {orderActionId === `status-${order._id || order.id}` ? 'Procesando...' : 'Marcar pendiente'}
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleOrderStatus(order._id || order.id, 'pagado')}
                        className="rounded-xl border-2 border-[#a9cdbb] bg-[#eff9f3] px-3 py-2 text-[10px] font-black uppercase text-[#4f7b67]"
                      >
                        Marcar pagado
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleCancelOrder(order._id || order.id)}
                        className="flex items-center gap-2 rounded-xl border-2 border-[#dfb5b0] bg-[#fbefee] px-3 py-2 text-[10px] font-black uppercase text-[#9b5550]"
                      >
                        <Ban className="w-3 h-3" /> Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={orderActionId !== null}
                        onClick={() => handleRefundOrder(order._id || order.id)}
                        className="flex items-center gap-2 rounded-xl border-2 border-[#d1c0e3] bg-[#f5effb] px-3 py-2 text-[10px] font-black uppercase text-[#75618f]"
                      >
                        <RotateCcw className="w-3 h-3" /> Reembolsar
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
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#224870]">
                  <CreditCard className="w-5 h-5 text-[#2f5d86]" /> Pagos del sistema
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#4f6983]">Auditoría, confirmación, reembolso y limpieza de intents.</p>
              </div>
              <button onClick={fetchPayments} className="flex items-center gap-2 rounded-xl border border-black bg-[#d6ecfa] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#224870] transition-all hover:bg-[#c7e4f7]">
                <RefreshCw className="w-4 h-4" /> Refrescar
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por pago, orden, usuario, estado o método..."
                className="w-full rounded-xl border border-black bg-[#f7fcff] pl-10 pr-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white"
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f89aa]" />
            </div>

            <div className="space-y-4">
              {loadingPayments ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#5f89aa]" /></div>
              ) : filteredPayments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#aacde2] bg-[#e3f4ff] px-4 py-14 text-center text-[11px] font-bold uppercase tracking-widest text-[#5e7890]">
                  No hay pagos para mostrar.
                </div>
              ) : (
                filteredPayments.map((payment) => (
                  <div key={payment.id} className="space-y-4 rounded-2xl border border-black bg-[#e3f4ff] p-5 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tight text-[#355873]">Pago #{payment.id}</p>
                        <p className="text-[10px] font-bold uppercase text-[#5e7890]">Orden asociada: #{payment.orden_id}</p>
                        <p className="text-[10px] font-bold uppercase text-[#5e7890]">Usuario: {payment.usuario_id}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase ${getDashboardStatusClasses(payment.estado)}`}>
                          {formatPaymentStatus(payment.estado)}
                        </span>
                        <span className="text-[10px] font-black uppercase text-[#5e7890]">{formatPaymentMethod(payment.metodo_pago)}</span>
                        <span className="font-black text-[#4f7b67]">${Number(payment.monto || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleConfirmPayment(payment.id)}
                        className="rounded-xl border-2 border-[#a9cdbb] bg-[#eff9f3] px-3 py-2 text-[10px] font-black uppercase text-[#4f7b67]"
                      >
                        {paymentActionId === `confirm-${payment.id}` ? 'Procesando...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleRefundPayment(payment.id)}
                        className="flex items-center gap-2 rounded-xl border-2 border-[#d1c0e3] bg-[#f5effb] px-3 py-2 text-[10px] font-black uppercase text-[#75618f]"
                      >
                        <RotateCcw className="w-3 h-3" /> Reembolsar
                      </button>
                      <button
                        type="button"
                        disabled={paymentActionId !== null}
                        onClick={() => handleDeletePayment(payment.id)}
                        className="flex items-center gap-2 rounded-xl border-2 border-[#dfb5b0] bg-[#fbefee] px-3 py-2 text-[10px] font-black uppercase text-[#9b5550]"
                      >
                        <Trash2 className="w-3 h-3" /> Eliminar
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
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter text-[#224870]">
                  <Truck className="w-5 h-5 text-[#2f5d86]" /> Tracking y envíos
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#4f6983]">Creación, seguimiento y actualización de guías de despacho.</p>
              </div>
              <button onClick={fetchTrackings} className="flex items-center gap-2 rounded-xl border border-black bg-[#d6ecfa] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#224870] transition-all hover:bg-[#c7e4f7]">
                <RefreshCw className="w-4 h-4" /> Refrescar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
              <div className="space-y-4 rounded-2xl border border-black bg-[#e3f4ff] p-5 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#355873]">
                  <Plus className="w-4 h-4 text-[#5f89aa]" /> Nuevo tracking
                </h3>
                <form onSubmit={handleCreateTracking} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Orden</label>
                    <select
                      required
                      className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all focus:border-[#7fb0d0] focus:bg-white"
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
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Dirección destino</label>
                    <input
                      className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white"
                      value={trackingForm.direccion_destino}
                      onChange={(e) => setTrackingForm((current) => ({ ...current, direccion_destino: e.target.value }))}
                      placeholder="Ej: Av. Central 123, Maipú"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Sucursal retiro</label>
                    <select
                      className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all focus:border-[#7fb0d0] focus:bg-white"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-black bg-[#d6ecfa] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#224870] transition-all hover:bg-[#c7e4f7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {trackingActionId === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                    Crear tracking
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por código, orden, estado o dirección..."
                    className="w-full rounded-xl border border-black bg-[#f7fcff] pl-10 pr-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white"
                    value={trackingSearchTerm}
                    onChange={(e) => setTrackingSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f89aa]" />
                </div>

                <div className="space-y-4">
                  {loadingTrackings ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#5f89aa]" /></div>
                  ) : filteredTrackings.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#aacde2] bg-[#e3f4ff] px-4 py-14 text-center text-[11px] font-bold uppercase tracking-widest text-[#5e7890]">
                      No hay trackings para mostrar.
                    </div>
                  ) : (
                    filteredTrackings.map((tracking) => (
                      <div key={tracking.codigo_seguimiento} className="space-y-4 rounded-2xl border border-black bg-[#e3f4ff] p-5 shadow-[0_12px_24px_rgba(93,149,190,0.14)]">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-black uppercase tracking-tight text-[#355873]">{tracking.codigo_seguimiento}</p>
                            <p className="text-[10px] font-bold uppercase text-[#5e7890]">Orden #{tracking.orden_id}</p>
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#5e7890]">
                              <MapPin className="w-3 h-3" />
                              {tracking.direccion_destino || 'Sin dirección'}
                            </p>
                          </div>
                          <span className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase ${getDashboardStatusClasses(tracking.estado_envio)}`}>
                            {formatTrackingStatus(tracking.estado_envio)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'en_preparacion')}
                            className="rounded-xl border-2 border-[#d9c29b] bg-[#fbf3e5] px-3 py-2 text-[10px] font-black uppercase text-[#8a6b40]"
                          >
                            En preparación
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'en_ruta')}
                            className="rounded-xl border-2 border-[#b9d8ea] bg-[#f1f9fe] px-3 py-2 text-[10px] font-black uppercase text-[#4f7898]"
                          >
                            En ruta
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleTrackingStatus(tracking.codigo_seguimiento, 'entregado')}
                            className="rounded-xl border-2 border-[#a9cdbb] bg-[#eff9f3] px-3 py-2 text-[10px] font-black uppercase text-[#4f7b67]"
                          >
                            Entregado
                          </button>
                          <button
                            type="button"
                            disabled={trackingActionId !== null}
                            onClick={() => handleDeleteTracking(tracking.codigo_seguimiento)}
                            className="flex items-center gap-2 rounded-xl border-2 border-[#dfb5b0] bg-[#fbefee] px-3 py-2 text-[10px] font-black uppercase text-[#9b5550]"
                          >
                            <Trash2 className="w-3 h-3" /> Eliminar
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
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-black bg-[#eaf7ff] shadow-[0_18px_36px_rgba(93,149,190,0.18)]">
              <div className="flex items-center justify-between border-b-2 border-black bg-[#d6ecfa] p-6">
                <h2 className="text-xl font-black uppercase tracking-tighter text-[#224870]">{editingBook ? 'Editar libro' : 'Nuevo libro'}</h2>
                <button onClick={closeForm} className="text-[#355873] hover:text-[#224870]"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Título</label>
                    <input required className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Autor</label>
                    <input required className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Precio ($)</label>
                    <input type="number" required className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Sede retiro</label>
                    <select className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all focus:border-[#7fb0d0] focus:bg-white" value={formData.pickup_location} onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}>
                      <option value="Plaza de Maipú">Plaza de Maipú</option>
                      <option value="Ciudad Satélite">Ciudad Satélite</option>
                      <option value="El Abrazo">El Abrazo</option>
                      <option value="Hospital El Carmen">Hospital El Carmen</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Área temática</label>
                    <select className="w-full rounded-xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all focus:border-[#7fb0d0] focus:bg-white" value={formData.categories[0]} onChange={(e) => setFormData({ ...formData, categories: [e.target.value] })}>
                      <option value="General">General</option>
                      <option value="Historia">Historia</option>
                      <option value="Educación">Educación</option>
                      <option value="Literatura">Literatura</option>
                      <option value="Ciencia">Ciencia</option>
                      <option value="Infantil">Infantil</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Descripción</label>
                    <textarea rows="3" className="w-full rounded-2xl border border-black bg-[#f7fcff] px-4 py-2 text-xs font-semibold text-[#355873] outline-none transition-all placeholder:text-[#7d98ae] focus:border-[#7fb0d0] focus:bg-white resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[9px] font-black uppercase text-[#5e7890]">Portada (opcional)</label>
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#aacde2] bg-[#f7fcff]">
                      {imageFile || editingBook?.image_url ? (
                        <img
                          src={blobUrlRef.current || withApiOrigin(editingBook.image_url)}
                          alt="Vista previa de portada"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-10 h-10 text-[#5f89aa]" />
                      )}
                    </div>
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileSelect(e.target.files[0])} />
                      <div className="flex items-center gap-2 rounded-xl border-2 border-[#aacde2] bg-[#f7fcff] px-4 py-2 text-[10px] font-semibold italic text-[#5e7890]">
                        <Upload className="w-3 h-3" /> {imageFile ? imageFile.name : 'Click para subir imagen...'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeForm} className="rounded-xl border-2 border-[#aacde2] bg-[#f7fcff] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[#355873] transition-all hover:bg-white">Cancelar</button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl border-2 border-black bg-[#d6ecfa] px-8 py-2 text-[10px] font-black uppercase tracking-widest text-[#224870] transition-all hover:bg-[#c7e4f7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingBook ? 'Guardar cambios' : 'Registrar libro'}
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
