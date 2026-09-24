import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, BarChart3, Package, ShoppingBag, Users, Tag, Inbox, Mail, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Search, RefreshCw, X, ArrowUpRight, Printer, Instagram, ArrowLeft, ArrowRight, Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();
  const { formatPrice } = useCart();
  const navigate = useNavigate();

  // Turn a title into a URL-friendly slug — mirrors the backend's slugify()
  // so the preview shown in the editor matches what actually gets saved.
  const slugify = (title) =>
    String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

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
  const [saveError, setSaveError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

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
  // Custom URL slug. When the admin hasn't touched the field (slugTouched),
  // it live-previews slugify(title); once edited by hand it follows the
  // admin's input instead.
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Sizes & Pricing (variants) editor state
  const emptyVariant = () => ({ id: null, size_label: '', price: '', stock_quantity: '' });
  const [variants, setVariants] = useState([]);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customers State
  const [customers, setCustomers] = useState([]);

  // Coupons State
  const [coupons, setCoupons] = useState([]);

  // Contact Inquiries State (customer messages from Contact page)
  const [inquiries, setInquiries] = useState([]);
  const newInquiriesCount = inquiries.filter((i) => i.status === 'new').length;
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');
  const [newCouponValue, setNewCouponValue] = useState(15);
  const [newCouponMin, setNewCouponMin] = useState(3000);

  // Instagram feed posts state
  const [feedPosts, setFeedPosts] = useState([]);
  const [uploadingPost, setUploadingPost] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postLink, setPostLink] = useState('');
  const [postError, setPostError] = useState('');

  // Ad banner state (Home page spotlight)
  const [adBanners, setAdBanners] = useState([]);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [adHeadline, setAdHeadline] = useState('');
  const [adSubtext, setAdSubtext] = useState('');
  const [adLink, setAdLink] = useState('');
  const [adError, setAdError] = useState('');

  // Admin management state (Admins tab)
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', phone: '' });
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminNotice, setAdminNotice] = useState('');
  const [pwModal, setPwModal] = useState(null); // { id, name, password }

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminNotice('');
    setAdminBusy(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      setAdminNotice(`Admin "${data.admin.name}" created.`);
      setNewAdmin({ name: '', email: '', password: '', phone: '' });
      loadAdmins();
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminBusy(false);
    }
  };

  // Fetch the admin roster whenever the Admins tab is opened
  useEffect(() => {
    if (activeTab === 'admins') loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const adminAction = async (method, path, body) => {
    setAdminError('');
    setAdminNotice('');
    setAdminBusy(true);
    try {
      const res = await fetch(path, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setAdminNotice(data.message || 'Done');
      loadAdmins();
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminBusy(false);
    }
  };

  useEffect(() => {
    if (!token || !isAdmin) {
      navigate('/login');
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

      // 6. Fetch Contact Inquiries
      const resInquiries = await fetch('/api/inquiries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resInquiries.ok) {
        const data = await resInquiries.json();
        setInquiries(data.inquiries || []);
      }

      // 7. Fetch Instagram feed posts
      const resPosts = await fetch('/api/admin/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resPosts.ok) {
        const data = await resPosts.json();
        setFeedPosts(data.posts || []);
      }

      // 8. Fetch ad banners
      const resAds = await fetch('/api/admin/ads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resAds.ok) {
        const data = await resAds.json();
        setAdBanners(data.ads || []);
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
    setSaveError('');
    setSavingProduct(true);
    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      // Coerce empty optional numeric fields to null — Postgres rejects "" for REAL columns
      const newSale = productForm.sale_price === '' ? null : Number(productForm.sale_price);
      const newOriginal = Number(productForm.base_price);
      const newEffective = newSale !== null ? newSale : newOriginal;

      // When the offer/original price changes, sizes that were following the
      // old effective price follow the new one automatically (custom per-size
      // prices entered by hand are preserved).
      const oldEffective = editingProduct
        ? (editingProduct.sale_price != null ? Number(editingProduct.sale_price) : Number(editingProduct.base_price))
        : null;

      const payload = {
        ...productForm,
        sale_price: newSale,
        // Send the slug the admin chose; empty means "auto-generate from title"
        slug: slugTouched ? slug.trim() : '',
        gallery,
        variants: variants.map((v) => {
          let price = Number(v.price);
          if (oldEffective != null && price === oldEffective) {
            price = newEffective;
          }
          return {
            id: v.id || undefined,
            size_label: v.size_label,
            price,
            stock_quantity: v.stock_quantity === '' ? 0 : Number(v.stock_quantity)
          };
        })
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        // Surface non-fatal notices from the backend (e.g. a size kept
        // because past orders reference it)
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          window.alert(data.warnings.join('\n'));
        }
        loadDashboardData();
        return;
      }
      setSaveError(data.error || `Save failed (${res.status})`);
    } catch (e) {
      console.error(e);
      setSaveError(e.message || 'Network error while saving');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
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

  // Mark inquiry as read
  const handleMarkInquiryRead = async (id) => {
    try {
      await fetch(`/api/inquiries/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete inquiry
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Upload a reel video or image straight into a new feed post
  const handlePostMediaUpload = async (file) => {
    if (!file) return;
    setUploadingPost(true);
    setPostError('');
    const isVideo = file.type.startsWith('video/');
    try {
      const fd = new FormData();
      if (isVideo) {
        fd.append('video', file);
      } else {
        fd.append('image', file);
      }
      const res = await fetch(isVideo ? '/api/admin/upload-video' : '/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const addRes = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: data.url,
          caption: postCaption,
          link_url: postLink,
          media_type: isVideo ? 'video' : 'image'
        })
      });
      const addData = await addRes.json().catch(() => ({}));
      if (!addRes.ok) {
        throw new Error(addData.error || `Failed to save post (server ${addRes.status})`);
      }

      setPostCaption('');
      setPostLink('');
      loadDashboardData();
    } catch (e) {
      setPostError(e.message || 'Upload failed');
    } finally {
      setUploadingPost(false);
    }
  };

  const handleMovePost = async (id, direction) => {
    try {
      await fetch(`/api/admin/posts/${id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ direction })
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Remove this post from the feed?')) return;
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  // Upload a wide photo straight into a new ad banner
  const handleAdImageUpload = async (file) => {
    if (!file) return;
    setUploadingAd(true);
    setAdError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const addRes = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: data.url,
          headline: adHeadline,
          subtext: adSubtext,
          link_url: adLink
        })
      });
      const addData = await addRes.json().catch(() => ({}));
      if (!addRes.ok) {
        throw new Error(addData.error || `Failed to save ad (server ${addRes.status})`);
      }

      setAdHeadline('');
      setAdSubtext('');
      setAdLink('');
      loadDashboardData();
    } catch (e) {
      setAdError(e.message || 'Upload failed');
    } finally {
      setUploadingAd(false);
    }
  };

  const handleMoveAd = async (id, direction) => {
    try {
      await fetch(`/api/admin/ads/${id}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ direction })
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAd = async (id) => {
    try {
      await fetch(`/api/admin/ads/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAd = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    try {
      await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadDashboardData();
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

  // Upload one or more gallery images; appends URLs to the gallery list.
  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    setImageError('');
    const uploaded = [];
    let lastError = '';
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          uploaded.push(data.url);
        } else {
          lastError = data.error || 'Upload failed';
        }
      } catch (e) {
        lastError = e.message || 'Upload failed';
      }
    }
    if (uploaded.length > 0) {
      setGallery((g) => [...g, ...uploaded]);
      // First gallery image becomes the cover if none is set yet
      setProductForm((f) => (f.image_url && f.image_url !== '/images/oud_royal.jpg' ? f : { ...f, image_url: uploaded[0] }));
    }
    if (lastError) setImageError(lastError);
    setUploadingGallery(false);
  };

  const removeGalleryImage = (url) => {
    setGallery((g) => g.filter((u) => u !== url));
  };

  const setGalleryCover = (url) => {
    setProductForm((f) => ({ ...f, image_url: url }));
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setImageError('');
    setSaveError('');
    setGallery([]);
    setVariants([{ ...emptyVariant(), size_label: '50ml', price: 9800, stock_quantity: 50 }]);
    setSlug('');
    setSlugTouched(false);
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
    setSaveError('');
    setVariants(
      (p.variants && p.variants.length > 0 ? p.variants : []).map((v) => ({
        id: v.id,
        size_label: v.size_label,
        price: v.price,
        stock_quantity: v.stock_quantity
      }))
    );
    let gal = [];
    if (p.gallery && Array.isArray(p.gallery)) {
      gal = p.gallery;
    } else if (p.gallery_json) {
      try { gal = JSON.parse(p.gallery_json); } catch { gal = []; }
    }
    setGallery(gal);
    setSlug(p.slug || '');
    // A stored slug that differs from slugify(title) was customized by hand —
    // lock it (touched) so saving doesn't clobber it with auto-generation.
    setSlugTouched((p.slug || '') !== slugify(p.title || ''));
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
    return <div className="py-32 text-center text-muted text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gold/15 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
            <Shield className="w-4 h-4" /> KATHRAZ Admin
          </div>
          <h1 className="font-sans text-3xl font-bold text-ivory">Dashboard</h1>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-outline-gold px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gold/20 pb-2 text-xs uppercase font-bold tracking-wider">
        {[
          { id: 'analytics', label: 'Analytics & Sales', icon: BarChart3 },
          { id: 'products', label: `Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
          { id: 'inquiries', label: `Inquiries${newInquiriesCount > 0 ? ` (${newInquiriesCount})` : ''}`, icon: Inbox },
          { id: 'posts', label: `Reels (${feedPosts.length})`, icon: Instagram },
          { id: 'ads', label: `Ads (${adBanners.length})`, icon: Megaphone },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { id: 'admins', label: `Admins (${admins.length})`, icon: Shield }
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
              <span className="text-[10px] text-muted font-num">All-time gross</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Total Orders Placed</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalOrders}</div>
              <span className="text-[10px] text-gold font-num">Completed & Shipped</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Registered Clients</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalCustomers}</div>
              <span className="text-[10px] text-muted font-num">Registered accounts</span>
            </div>

            <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-medium">Active Formulations</span>
              <div className="font-num text-3xl font-bold text-ivory">{analytics.totalProducts}</div>
              <span className="text-[10px] text-muted font-num">Listed</span>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-4">
            <h3 className="font-sans text-lg font-bold text-ivory">Recent Orders Feed</h3>
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
                      <td className="py-3 px-4 text-ivory font-sans">{ord.customer_name}</td>
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
            <h2 className="font-sans text-xl font-bold text-ivory">Products</h2>
            <button
              onClick={openAddProductModal}
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-card border border-gold/20 rounded-2xl p-5 shadow-xl glass-panel space-y-3 flex flex-col justify-between">
                <div className="flex gap-4">
                  <img src={p.image_url} alt={p.title} className="w-20 h-20 object-cover rounded-xl border border-gold/20" />
                  <div className="flex-1">
                    <span className="text-[10px] uppercase text-gold font-bold block">{p.concentration}</span>
                    <h3 className="font-sans font-bold text-base text-ivory">{p.title}</h3>
                    <div className="font-num font-bold text-gold mt-1">
                      {formatPrice(p.sale_price || p.base_price)}
                      {p.sale_price ? <span className="text-muted line-through font-normal ml-2">{formatPrice(p.base_price)}</span> : null}
                    </div>
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
                    className="px-3 py-2 bg-card hover:bg-ivory hover:text-obsidian border border-ivory/30 text-ivory rounded text-xs font-bold"
                    title="Delete product"
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
            <h2 className="font-sans text-xl font-bold text-ivory">All Orders</h2>
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
                      <strong className="text-ivory block font-sans">{ord.customer_name}</strong>
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
          <h2 className="font-sans text-xl font-bold text-ivory">Customers</h2>
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
                    <td className="py-3 px-4 font-sans font-bold text-ivory">{c.name}</td>
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

      {/* TAB: FEED POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Add a post */}
          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-4">
            <h3 className="font-sans text-base font-bold text-ivory">Add a reel to the Home page feed</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <label className="inline-block cursor-pointer btn-gold px-5 py-2.5 text-xs uppercase font-bold whitespace-nowrap">
                {uploadingPost ? 'Uploading…' : 'Upload reel (MP4/MOV/WebM) or image'}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={uploadingPost}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) handlePostMediaUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Caption (optional) — shows on hover"
                  maxLength={200}
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
                <input
                  type="url"
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  placeholder="Link (optional) — e.g. an Instagram post URL"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted">
              Caption and link are applied to the file you upload next. Videos play muted and looping,
              Instagram-style. Keep reels under 50 MB. New posts appear first in the feed.
            </p>
            {postError && <p className="text-[11px] text-ivory">{postError}</p>}
          </div>

          {/* Existing posts */}
          {feedPosts.length === 0 ? (
            <div className="bg-card border border-gold/20 rounded-2xl p-10 text-center text-sm text-muted">
              No reels yet. Upload a video or image and it will appear in the Home page feed.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {feedPosts.map((post, idx) => (
                <div key={post.id} className="bg-card border border-gold/20 rounded-2xl overflow-hidden shadow-xl glass-panel">
                  <div className="relative aspect-square bg-obsidian">
                    {post.media_type === 'video' ? (
                      <video
                        src={post.image_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img src={post.image_url} alt={post.caption || 'Feed post'} className="w-full h-full object-cover" />
                    )}
                    {post.link_url && (
                      <a
                        href={post.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 bg-obsidian/80 text-ivory rounded-full p-1.5"
                        title="Open link"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {post.caption && (
                    <p className="px-3 pt-2 text-[11px] text-muted line-clamp-2">{post.caption}</p>
                  )}
                  <div className="flex items-center justify-between p-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMovePost(post.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 border border-ivory/20 rounded disabled:opacity-30 hover:bg-ivory hover:text-obsidian"
                        title="Move earlier"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMovePost(post.id, 'down')}
                        disabled={idx === feedPosts.length - 1}
                        className="p-1.5 border border-ivory/20 rounded disabled:opacity-30 hover:bg-ivory hover:text-obsidian"
                        title="Move later"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 border border-ivory/20 rounded hover:bg-ivory hover:text-obsidian"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ADS */}
      {activeTab === 'ads' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Create an ad */}
          <div className="bg-card border border-gold/20 rounded-2xl p-6 shadow-xl glass-panel space-y-4">
            <h3 className="font-sans text-base font-bold text-ivory">Add an ad to the Home page spotlight</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <label className="inline-block cursor-pointer btn-gold px-5 py-2.5 text-xs uppercase font-bold whitespace-nowrap">
                {uploadingAd ? 'Uploading…' : 'Upload ad photo (wide works best)'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={uploadingAd}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) handleAdImageUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={adHeadline}
                  onChange={(e) => setAdHeadline(e.target.value)}
                  placeholder="Headline (optional)"
                  maxLength={80}
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
                <input
                  type="text"
                  value={adSubtext}
                  onChange={(e) => setAdSubtext(e.target.value)}
                  placeholder="Sub-text (optional)"
                  maxLength={140}
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
                <input
                  type="url"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  placeholder="Link (optional) — product or page URL"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted">
              Headline, sub-text and link are applied to the photo you upload next. Wide photos
              (roughly 21:9, e.g. 1600×680) fill the spotlight best. New ads appear first.
            </p>
            {adError && <p className="text-[11px] text-ivory">{adError}</p>}
          </div>

          {/* Existing ads */}
          {adBanners.length === 0 ? (
            <div className="bg-card border border-gold/20 rounded-2xl p-10 text-center text-sm text-muted">
              No ads yet. Upload a photo and it will appear in the Home page spotlight.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adBanners.map((ad, idx) => (
                <div
                  key={ad.id}
                  className={`bg-card border rounded-2xl overflow-hidden shadow-xl glass-panel ${
                    ad.active === 1 ? 'border-gold/20' : 'border-gold/10 opacity-60'
                  }`}
                >
                  <div className="relative aspect-[21/9] bg-obsidian">
                    <img src={ad.image_url} alt={ad.headline || 'Ad'} className="w-full h-full object-cover" />
                    {ad.active === 0 && (
                      <span className="absolute top-2 left-2 bg-obsidian/85 text-ivory text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                    {idx === 0 && ad.active === 1 && (
                      <span className="absolute top-2 right-2 bg-ivory text-obsidian text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                        Live now
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    {ad.headline && <p className="text-sm font-semibold text-ivory truncate">{ad.headline}</p>}
                    {ad.subtext && <p className="text-[11px] text-muted truncate">{ad.subtext}</p>}
                    {ad.link_url && <p className="text-[10px] text-muted truncate">Links to: {ad.link_url}</p>}
                  </div>
                  <div className="flex items-center justify-between p-2.5 border-t border-gold/10">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveAd(ad.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 border border-ivory/20 rounded disabled:opacity-30 hover:bg-ivory hover:text-obsidian"
                        title="Move earlier"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveAd(ad.id, 'down')}
                        disabled={idx === adBanners.length - 1}
                        className="p-1.5 border border-ivory/20 rounded disabled:opacity-30 hover:bg-ivory hover:text-obsidian"
                        title="Move later"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleAd(ad.id)}
                        className="ml-1 px-2.5 py-1.5 border border-ivory/20 rounded text-[10px] font-bold uppercase hover:bg-ivory hover:text-obsidian"
                        title={ad.active === 1 ? 'Hide from the site' : 'Show on the site'}
                      >
                        {ad.active === 1 ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-1.5 border border-ivory/20 rounded hover:bg-ivory hover:text-obsidian"
                      title="Delete ad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Create Coupon Form */}
            <form onSubmit={handleAddCoupon} className="md:col-span-4 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4 text-xs">
              <h3 className="font-sans text-base font-bold text-gold">Create Coupon</h3>

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
              <h3 className="font-sans text-base font-bold text-ivory">Active Coupons</h3>
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
                      className="text-muted hover:text-ivory p-2"
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

      {/* TAB: INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="font-sans text-xl font-bold text-ivory">Customer Inquiries</h2>
          {inquiries.length === 0 ? (
            <div className="bg-card border border-gold/20 rounded-2xl p-10 text-center text-sm text-muted">
              No inquiries yet. Messages sent from the Contact page will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className={`bg-card border rounded-2xl p-5 space-y-3 ${
                    inq.status === 'new' ? 'border-gold/60' : 'border-gold/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-ivory text-sm">{inq.name}</strong>
                      <a href={`mailto:${inq.email}`} className="font-num text-xs text-gold hover:underline">
                        {inq.email}
                      </a>
                      {inq.status === 'new' && (
                        <span className="text-[10px] bg-gold text-charcoal px-2 py-0.5 rounded-full font-bold uppercase">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted font-num">
                      {new Date(inq.created_at).toLocaleString()}
                    </span>
                  </div>

                  {inq.subject && (
                    <p className="text-[11px] text-gold uppercase tracking-wider">{inq.subject}</p>
                  )}
                  <p className="text-xs text-ivory/80 whitespace-pre-wrap leading-relaxed">{inq.message}</p>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gold/10">
                    <a
                      href={`mailto:${inq.email}?subject=${encodeURIComponent('Re: ' + (inq.subject || 'Your KATHRAZ inquiry'))}`}
                      className="btn-gold px-4 py-2 rounded text-[11px] font-bold uppercase flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" /> Reply by Email
                    </a>
                    {inq.status === 'new' && (
                      <button
                        onClick={() => handleMarkInquiryRead(inq.id)}
                        className="btn-outline-gold px-4 py-2 rounded text-[11px] font-bold uppercase"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInquiry(inq.id)}
                      className="px-3 py-2 bg-card hover:bg-ivory hover:text-obsidian border border-ivory/30 text-ivory rounded text-[11px] font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-gold/40 rounded-2xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gold/20 pb-4">
              <h3 className="font-sans text-lg font-bold text-gold">
                {editingProduct ? 'Edit product' : 'New product'}
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

              {/* URL slug — auto-follows the title until edited by hand */}
              <div>
                <label className="text-muted block mb-1">URL slug</label>
                <input
                  type="text"
                  value={slugTouched ? slug : slugify(productForm.title)}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  onBlur={() =>
                    setSlug((s) =>
                      s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                    )
                  }
                  placeholder="auto-generated from title"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
                <p className="text-muted mt-1">
                  Product page: <span className="text-gold/80">/product/{(slugTouched ? slugify(slug) : slugify(productForm.title)) || '…'}</span>
                  {!slugTouched && ' (follows the title — type to customize)'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div>
                  <label className="text-muted block mb-1">Concentration tag</label>
                  <input
                    type="text"
                    value={productForm.concentration}
                    onChange={(e) => setProductForm({ ...productForm, concentration: e.target.value })}
                    placeholder="e.g. Extrait de Parfum"
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-muted block mb-1">Original Price (₹) — shown struck-through</label>
                  <input
                    type="number"
                    value={productForm.base_price}
                    onChange={(e) => setProductForm({ ...productForm, base_price: Number(e.target.value) })}
                    required
                    min="1"
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted block mb-1">Offer Price (₹) — what customers pay</label>
                  <input
                    type="number"
                    value={productForm.sale_price}
                    onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value === '' ? '' : Number(e.target.value) })}
                    min="1"
                    placeholder="Leave empty for no offer"
                    className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                  />
                  {productForm.sale_price !== '' && Number(productForm.sale_price) >= Number(productForm.base_price) && (
                    <p className="text-[11px] text-ivory mt-1">Offer price must be lower than the original price</p>
                  )}
                </div>
              </div>

              {/* Sizes & Pricing (per-size editor) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-muted">Sizes & Pricing — what customers select on the product page</label>
                  <button
                    type="button"
                    onClick={() => setVariants([...variants, { ...emptyVariant() }])}
                    className="btn-outline-gold px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Size
                  </button>
                </div>
                <div className="space-y-2">
                  {variants.map((v, idx) => (
                    <div key={v.id || `new-${idx}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={v.size_label}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...v, size_label: e.target.value };
                          setVariants(next);
                        }}
                        placeholder="Size (e.g. 50ml Extrait)"
                        className="flex-1 bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={v.price}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...v, price: e.target.value };
                          setVariants(next);
                        }}
                        placeholder="Price ₹"
                        className="w-24 bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none font-num"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.stock_quantity}
                        onChange={(e) => {
                          const next = [...variants];
                          next[idx] = { ...v, stock_quantity: e.target.value };
                          setVariants(next);
                        }}
                        placeholder="Stock"
                        className="w-20 bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none font-num"
                      />
                      <button
                        type="button"
                        onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                        className="p-2 bg-card hover:bg-ivory hover:text-obsidian border border-ivory/30 text-ivory rounded"
                        title="Remove this size"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted">
                  Each size gets its own price and stock. Sizes referenced by past orders can't be deleted — you'll be warned after saving.
                </p>
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
                    {imageError && <p className="text-[11px] text-ivory">{imageError}</p>}
                    {/* Advanced: direct URL */}
                    <details className="text-[11px] text-muted">
                      <summary className="cursor-pointer hover:text-ivory">Or paste an image URL</summary>
                      <input
                        type="text"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="/images/oud_royal.jpg or https://…"
                        className="w-full bg-obsidian border border-gold/30 text-ivory p-2 rounded focus:outline-none font-num"
                      />
                    </details>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              {/* Multi-Image Gallery */}
              <div className="space-y-2">
                <label className="text-muted block">Product Gallery — all images shown on the product page</label>
                {gallery.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {gallery.map((url) => (
                      <div
                        key={url}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden border group ${
                          productForm.image_url === url ? 'border-gold ring-2 ring-gold/50' : 'border-gold/20'
                        }`}
                      >
                        <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                        {productForm.image_url === url ? (
                          <span className="absolute bottom-0 inset-x-0 bg-gold text-charcoal text-[8px] font-bold uppercase text-center py-0.5">
                            Cover
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setGalleryCover(url)}
                            className="absolute bottom-0 inset-x-0 bg-obsidian/80 text-ivory text-[8px] font-bold uppercase text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gold hover:text-charcoal"
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(url)}
                          className="absolute top-1 right-1 w-5 h-5 bg-obsidian/80 hover:bg-ivory hover:text-obsidian text-ivory rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="inline-block cursor-pointer btn-outline-gold px-4 py-2 text-xs uppercase font-bold">
                  {uploadingGallery ? 'Uploading…' : '+ Add More Images'}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    disabled={uploadingGallery}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) handleGalleryUpload(files);
                      e.target.value = '';
                    }}
                  />
                </label>
                <p className="text-[10px] text-muted">
                  First image is the cover (shown in shop grid). All images appear in the product page gallery.
                </p>
              </div>

              <div>
                <label className="text-muted block mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows="3"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2 flex-wrap">
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
              </div>                  {saveError && (
                <div className="bg-charcoal border border-ivory/40 text-ivory text-[11px] px-3 py-2 rounded">
                  {saveError}
                </div>
              )}

              <button
                type="submit"
                disabled={savingProduct}
                className="w-full btn-gold py-3 rounded-lg font-bold uppercase tracking-wider disabled:opacity-60"
              >
                {savingProduct ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: ADMINS */}
      {activeTab === 'admins' && (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="font-sans text-xl font-bold text-ivory">Manage Admins</h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Add admin form */}
            <form onSubmit={handleAddAdmin} className="md:col-span-4 bg-card border border-gold/20 rounded-2xl p-6 shadow-2xl glass-panel space-y-4 text-xs">
              <h3 className="font-sans text-base font-bold text-gold">Add a new admin</h3>

              {adminError && (
                <div className="bg-charcoal border border-ivory/40 text-ivory text-[11px] px-3 py-2 rounded">{adminError}</div>
              )}
              {adminNotice && (
                <div className="bg-charcoal border border-gold/50 text-gold text-[11px] px-3 py-2 rounded">{adminNotice}</div>
              )}

              <div>
                <label className="text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="text-muted block mb-1">Email</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="text-muted block mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>
              <div>
                <label className="text-muted block mb-1">Password (min 8 chars)</label>
                <input
                  type="text"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                  minLength={8}
                  placeholder="Share this with them securely"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={adminBusy}
                className="w-full btn-gold py-3 rounded-lg font-bold uppercase tracking-wider disabled:opacity-60"
              >
                {adminBusy ? 'Working…' : 'Create admin'}
              </button>
            </form>

            {/* Admin roster */}
            <div className="md:col-span-8 space-y-3">
              {admins.map((a) => {
                const isSelf = a.id === user?.id;
                const isLastAdmin = admins.length <= 1;
                return (
                  <div key={a.id} className="bg-card border border-gold/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-ivory text-sm">{a.name}</strong>
                        {isSelf && (
                          <span className="text-[10px] bg-gold/15 border border-gold/40 text-gold px-2 py-0.5 rounded-full font-bold uppercase">You</span>
                        )}
                      </div>
                      <div className="font-num text-xs text-gold">{a.email}</div>
                      {a.phone && <div className="font-num text-[11px] text-muted">{a.phone}</div>}
                      <div className="text-[10px] text-muted font-num">Admin since {new Date(a.created_at).toLocaleDateString()}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <button
                        onClick={() => setPwModal({ id: a.id, name: a.name, password: '' })}
                        disabled={adminBusy}
                        className="px-3 py-2 rounded-lg border border-gold/40 text-gold hover:bg-gold hover:text-charcoal transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        Reset password
                      </button>
                      {!isSelf && !isLastAdmin && (
                        <button
                          onClick={() => adminAction('PUT', `/api/admin/admins/${a.id}/role`, { role: 'customer' })}
                          disabled={adminBusy}
                          className="px-3 py-2 rounded-lg border border-ivory/30 text-ivory/80 hover:bg-ivory hover:text-charcoal transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          Demote
                        </button>
                      )}
                      {!isSelf && !isLastAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove admin "${a.name}"? They will no longer have dashboard access.`)) {
                              adminAction('DELETE', `/api/admin/admins/${a.id}`);
                            }
                          }}
                          disabled={adminBusy}
                          className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-ivory transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {admins.length === 0 && (
                <div className="bg-card border border-gold/20 rounded-2xl p-10 text-center text-sm text-muted">
                  No admins found.
                </div>
              )}
            </div>
          </div>

          {/* Reset password modal */}
          {pwModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPwModal(null)}>
              <div className="bg-card border border-gold/30 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-sans text-base font-bold text-gold">Reset password — {pwModal.name}</h3>
                <input
                  type="text"
                  autoFocus
                  value={pwModal.password}
                  onChange={(e) => setPwModal({ ...pwModal, password: e.target.value })}
                  placeholder="New password (min 8 chars)"
                  className="w-full bg-obsidian border border-gold/30 text-ivory p-2.5 rounded text-xs focus:outline-none"
                />
                <div className="flex gap-2 justify-end text-xs">
                  <button
                    onClick={() => setPwModal(null)}
                    className="px-4 py-2 rounded-lg border border-ivory/30 text-ivory/80 hover:bg-ivory hover:text-charcoal transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={adminBusy || pwModal.password.length < 8}
                    onClick={async () => {
                      await adminAction('PUT', `/api/admin/admins/${pwModal.id}/password`, { password: pwModal.password });
                      setPwModal(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-gold text-charcoal font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
