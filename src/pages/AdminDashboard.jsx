import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, BarChart3, Package, ShoppingBag, Users, Tag, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Search, RefreshCw, X, ArrowUpRight, Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();
  const { formatPrice } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [categorySales, setCategorySales] = useState([]);

  // Products State
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // Form State for Product Add/Edit
  const [productForm, setProductForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category_id: 1,
    base_price: 9800,
    sale_price: '',
    gender: 'Unisex',
    concentration: 'Extrait de Parfum',
    top_notes: 'Wild Bergamot, Saffron',
    heart_notes: 'Damask Rose, Aged Oud',
    base_notes: 'Amber, Musk',
    longevity: '16+ Hours',
    sillage: 'Enormous',
    image_url: '/images/oud_royal.jpg',
    is_featured: true,
    is_bestseller: false
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customers State
  const [customers, setCustomers] = useState([]);

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(3000);

  useEffect(() => {
    if (!token || !isAdmin) {
      navigate('/login?demo=admin');
      return;
    }
    loadDashboardData();
  }, [token, isAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics
      const resAnalytics = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data.analytics);
        setRecentOrders(data.recentOrders || []);
        setCategorySales(data.categorySales || []);
      }

      // 2. Fetch Products
      const resProducts = await fetch('/api/products');
      if (resProducts.ok) {
        const data = await resProducts.json();
        setProducts(data.products || []);
      }

      // 3. Fetch Admin Orders
      const resOrders = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data.orders || []);
      }

      // 4. Fetch Customers
      const resCustomers = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resCustomers.ok) {
        const data = await resCustomers.json();
        setCustomers(data.customers || []);
      }

      // 5. Fetch Coupons
      const resCoupons = await fetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resCoupons.ok) {
        const data = await resCoupons.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this luxury fragrance formulation?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Update Order Status Transition
  const handleUpdateOrderStatus = async (orderId, newStatus, trackingNumber) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          order_status: newStatus,
          tracking_number: trackingNumber || `KEX-${Math.floor(100000 + Math.random() * 900000)}`
        })
      });
      if (res.ok) loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Coupon
  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCouponCode,
          discount_type: newCouponType,
          discount_value: Number(newCouponValue),
          min_order_value: Number(newCouponMin)
        })
      });
      if (res.ok) {
        setNewCouponCode('');
        loadDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Upload an image to Supabase Storage via the backend, then set the URL.
  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    setImageError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(res.status === 401
          ? 'Session expired — please log in again'
          : `Server error (${res.status})`);
      }
      if (res.ok) {
        setProductForm((f) => ({ ...f, image_url: data.url }));
      } else {
        setImageError(data.error || 'Upload failed');
      }
    } catch (e) {
      setImageError(e.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setImageError('');
    setProductForm({
      title: '',
      subtitle: '',
      description: '',
      category_id: 1,
      base_price: 9800,
      sale_price: '',
      gender: 'Unisex',
      concentration: 'Extrait de Parfum',
      top_notes: 'Wild Bergamot, Kashmiri Saffron',
      heart_notes: 'Damask Rose, Aged Cambodian Oud',
      base_notes: 'Baltic Amber, Musk',
      longevity: '16+ Hours',
      sillage: 'Enormous',
      image_url: '/images/oud_royal.jpg',
      is_featured: true,
      is_bestseller: false
    });
    setShowProductModal(true);
  };

  const openEditProductModal = (p) => {
    setEditingProduct(p);
    setImageError('');
    setProductForm({
      title: p.title,
      subtitle: p.subtitle || '',
      description: p.description || '',
      category_id: p.category_id || 1,
      base_price: p.base_price,
      sale_price: p.sale_price || '',
      gender: p.gender || 'Unisex',
      concentration: p.concentration || 'Extrait de Parfum',
      top_notes: p.top_notes || '',
      heart_notes: p.heart_notes || '',
      base_notes: p.base_notes || '',
      longevity: p.longevity || '16+ Hours',
      sillage: p.sillage || 'Enormous',
      image_url: p.image_url || '/images/oud_royal.jpg',
      is_featured: p.is_featured === 1,
      is_bestseller: p.is_bestseller === 1
    });
    setShowProductModal(true);
  };

  if (loading) {
    return <div className="py-32 text-center text-gold text-sm animate-pulse">Loading KATHRAZ Admin Suite...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold/15 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
            <Shield className="w-4 h-4" /> KATHRAZ Admin
          </div>
          <h1 className="font-cinzel text-3xl font-bold text-ivory">Dashboard</h1>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-outline-gold px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Database
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gold/20 pb-2 text-xs uppercase font-bold tracking-wider">
        {[
          { id: 'analytics', label: 'Analytics & Sales', icon: BarChart3 },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gold text-charcoal border-gold shadow-lg font-extrabold'
                  : 'bg-card border-gold/20 text-ivory/80 hover:border-gold/50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8 animate-fadeIn">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Total Gross Revenue</span>
              <div className="font-num text-3xl font-bold text-gold">{formatPrice(analytics.totalRevenue)}</div>
              <span className="text-[10px] text-emerald-400 font-num">+18.4% vs last period</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Total Orders Placed</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalOrders}</div>
              <span className="text-[10px] text-gold font-num">Completed & Shipped</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Registered Clients</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalCustomers}</div>
              <span className="text-[10px] text-gold font-num">VIP Members</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Active Formulations</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalProducts}</div>
              <span className="text-[10px] text-emerald-400 font-num">All in stock</span>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-4">
            <h3 className="font-cinzel text-lg font-bold text-ivory">Recent Orders Feed</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gold/15 text-gold uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gold/5">
                      <td className="py-3 px-4 font-num text-gold font-bold">{ord.order_number}</td>
                      <td className="py-3 px-4 text-ivory font-serif">{ord.customer_name}</td>
                      <td className="py-3 px-4 font-num font-bold text-gold">{formatPrice(ord.total_amount)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-gold/20 text-gold rounded font-bold uppercase text-[10px]">
                          {ord.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">{new Date(ord.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h2 className="font-cinzel text-xl font-bold text-ivory">Catalog Management</h2>
            <button
              onClick={openAddProductModal}
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add New Fragrance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-card border border-gold/20 rounded-2xl p-5 shadow-xl glass-panel space-y-3 flex flex-col justify-between">
                <div className="flex gap-4">
                  <img src={p.image_url} alt={p.title} className="w-20 h-20 object-cover rounded-xl border border-gold/20" />
                  <div className="flex-1">
                    <span className="text-[10px] uppercase text-gold font-bold block">{p.concentration}</span>
                    <h3 className="font-serif font-bold text-base text-ivory">{p.title}</h3>
                    <div className="font-num font-bold text-gold mt-1">{formatPrice(p.base_price)}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-obsidian border border-gold/10 text-[11px] text-muted space-y-1">
                  <div><strong className="text-gold">Top:</strong> {p.top_notes}</div>
                  <div><strong className="text-gold">Heart:</strong> {p.heart_notes}</div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gold/15">
                  <button
                    onClick={() => openEditProductModal(p)}
                    className="flex-1 btn-outline-gold py-2 rounded text-xs font-bold uppercase flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-400 text-red-700 rounded text-xs font-bold"
                    title="Delete formulation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT & STATUS TRANSITIONS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="font-cinzel text-xl font-bold text-ivory">All Orders</h2>
            <a
              href="/invoice-all"
              className="btn-outline-gold px-5 py-2.5 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Download All Invoices (PDF)
            </a>
          </div>

          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gold/15 text-gold uppercase tracking-wider">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status Transition</th>
                  <th className="py-3 px-4">Tracking Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gold/5">
                    <td className="py-3 px-4 font-num text-gold font-bold">
                      {ord.order_number}
                      <a
                        href={`/invoice/${ord.order_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-muted hover:text-gold align-middle"
                        title="View / print invoice"
                      >
                        <Printer className="w-3.5 h-3.5 inline" />
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-ivory block font-serif">{ord.customer_name}</strong>
                      <span className="text-muted block text-[11px]">{ord.customer_email}</span>
                      <span className="text-gold block text-[10px]">{ord.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-muted max-w-xs truncate">{ord.shipping_address}</td>
                    <td className="py-3 px-4 font-num font-bold text-gold">{formatPrice(ord.total_amount)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value, ord.tracking_number)}
                        className="bg-obsidian border border-gold/30 text-gold text-xs font-bold p-2 rounded focus:outline-none uppercase"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-num text-xs text-ivory">
                      {ord.tracking_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="font-cinzel text-xl font-bold text-ivory">Customers</h2>
          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gold/15 text-gold uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gold/5">
                    <td className="py-3 px-4 font-serif font-bold text-ivory">{c.name}</td>
                    <td className="py-3 px-4 font-num text-muted">{c.email}</td>
                    <td className="py-3 px-4 text-gold">{c.phone}</td>
                    <td className="py-3 px-4 font-bold text-ivory">{c.total_orders}</td>
                    <td className="py-3 px-4 font-num font-bold text-gold">{formatPrice(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Create Coupon Form */}
            <form onSubmit={handleAddCoupon} className="md:col-span-4 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4 text-xs">
              <h3 className="font-cinzel text-base font-bold text-gold">Create Coupon</h3>

              <div>
                <label className="text-muted block mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="e.g. KANNAUJROYAL20"
                  required
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-muted block mb-1">Discount Type</label>
                <select
                  value={newCouponType}
                  onChange={(e) => setNewCouponType(e.target.value)}
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="text-muted block mb-1">Discount Value</label>
                <input
                  type="number"
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(e.target.value)}
                  required
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted block mb-1">Min Order Value (₹)</label>
                <input
                  type="number"
                  value={newCouponMin}
                  onChange={(e) => setNewCouponMin(e.target.value)}
                  required
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full btn-gold py-3 rounded-lg font-bold uppercase tracking-wider">
                Create Coupon Code
              </button>
            </form>

            {/* Coupons List */}
            <div className="md:col-span-8 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4">
              <h3 className="font-cinzel text-base font-bold text-ivory">Active Coupons</h3>
              <div className="divide-y divide-gold/10">
                {coupons.map((cop) => (
                  <div key={cop.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <span className="font-num text-base font-bold text-gold">{cop.code}</span>
                      <p className="text-muted text-[11px]">
                        {cop.discount_type === 'percentage' ? `${cop.discount_value}% OFF` : `₹${cop.discount_value} OFF`} • Min order: ₹{cop.min_order_value.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(cop.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-gold/40 rounded-2xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gold/20 pb-4">
              <h3 className="font-cinzel text-lg font-bold text-gold">
                {editingProduct ? 'Edit Fragrance Formulation' : 'Create New Fragrance'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-muted hover:text-ivory">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted block mb-1">Title</label>
                  <input
                    type="text"
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    required
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Subtitle / Note Summary</label>
                  <input
                    type="text"
                    value={productForm.subtitle}
                    onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-muted block mb-1">Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  >
                    <option value={1}>Personal Fragrances</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted block mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({ ...productForm, base_price: Number(e.target.value) })}
                    required
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Gender</label>
                  <select
                    value={productForm.gender}
                    onChange={(e) => setProductForm({ ...productForm, gender: e.target.value })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  >
                    <option>Unisex</option>
                    <option>For Him</option>
                    <option>For Her</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Product Image</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 flex-shrink-0 bg-obsidian border border-gold/20 overflow-hidden flex items-center justify-center">
                    {productForm.image_url ? (
                      <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-muted text-[10px]">No image</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-block cursor-pointer btn-outline-gold px-4 py-2 text-xs uppercase font-bold">
                      {uploadingImage ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) handleImageUpload(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-muted">JPG, PNG, WebP or AVIF · up to 5 MB</p>
                    {imageError && <p className="text-[11px] text-red-500">{imageError}</p>}
                    {/* Advanced: direct URL */}
                    <details className="text-[11px] text-muted">
                      <summary className="cursor-pointer hover:text-ivory">Or paste an image URL</summary>
                      <input
                        type="text"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="/images/oud_royal.jpg or https://…"
                        className="mt-2 w-full bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none font-num"
                      />
                    </details>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-muted block mb-1">Top Notes</label>
                  <input
                    type="text"
                    value={productForm.top_notes}
                    onChange={(e) => setProductForm({ ...productForm, top_notes: e.target.value })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Heart Notes</label>
                  <input
                    type="text"
                    value={productForm.heart_notes}
                    onChange={(e) => setProductForm({ ...productForm, heart_notes: e.target.value })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Base Notes</label>
                  <input
                    type="text"
                    value={productForm.base_notes}
                    onChange={(e) => setProductForm({ ...productForm, base_notes: e.target.value })}
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted block mb-1">Full Olfactory Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows="3"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured}
                    onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })}
                    className="accent-gold"
                  />
                  <span>Featured Collection</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_bestseller}
                    onChange={(e) => setProductForm({ ...productForm, is_bestseller: e.target.checked })}
                    className="accent-gold"
                  />
                  <span>Bestseller Badge</span>
                </label>
              </div>

              <button type="submit" className="w-full btn-gold py-3 rounded-lg font-bold uppercase tracking-wider">
                {editingProduct ? 'Save Changes' : 'Create Fragrance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
