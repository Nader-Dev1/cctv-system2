import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import { products as api } from '../api';
import { useToast } from '../context/ToastContext';

const CATS = ['كاميرات CCTV', 'راوتر', 'سويتش', 'أكسس بوينت', 'كابلات', 'إكسسوارات', 'أخرى'];

const empty = { name: '', category: 'كاميرات CCTV', brand: '', model: '', buy_price: '', sell_price: '', quantity: '', min_quantity: '5', description: '' };

export default function Products() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = () => api.getAll().then(r => { setItems(r.data.products || []); setLowStock(r.data.lowStock || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = async () => {
    if (!form.name) return toast('اسم المنتج مطلوب', 'error');
    try {
      if (editing) await api.update(editing.id, form);
      else await api.create(form);
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      closeModal(); load();
    } catch { toast('حدث خطأ', 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try { await api.delete(id); toast('تم الحذف', 'success'); load(); } catch { toast('حدث خطأ', 'error'); }
  };

  const filtered = items.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.category === catFilter)
  );

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h2>إدارة المنتجات</h2><p>{items.length} منتج في المخزون</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />إضافة منتج</button>
      </div>
      <div className="page-body">
        {lowStock.length > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            {lowStock.length} منتج وصل للحد الأدنى: {lowStock.map(p => p.name).join(' ، ')}
          </div>
        )}
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search />
            <input className="form-input" placeholder="بحث باسم أو براند..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 180 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">كل الفئات</option>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><Package /><h3>لا توجد منتجات</h3><p>أضف منتجك الأول</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم المنتج</th>
                    <th>الفئة</th>
                    <th>البراند / الموديل</th>
                    <th>سعر الشراء</th>
                    <th>سعر البيع</th>
                    <th>الكمية</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td><span className="badge badge-blue">{p.category}</span></td>
                      <td style={{ color: 'var(--text3)' }}>{[p.brand, p.model].filter(Boolean).join(' / ') || '—'}</td>
                      <td>{p.buy_price?.toLocaleString()} ر.س</td>
                      <td>{p.sell_price?.toLocaleString()} ر.س</td>
                      <td><strong style={{ color: p.quantity <= p.min_quantity ? 'var(--red)' : 'var(--green)' }}>{p.quantity}</strong></td>
                      <td>
                        {p.quantity <= p.min_quantity
                          ? <span className="badge badge-red">مخزون منخفض</span>
                          : <span className="badge badge-green">متوفر</span>}
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label className="form-label">اسم المنتج *</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="مثال: كاميرا هايك فيجن 4MP" />
                </div>
                <div className="form-group">
                  <label className="form-label">الفئة</label>
                  <select className="form-select" value={form.category} onChange={e => f('category', e.target.value)}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">البراند</label>
                  <input className="form-input" value={form.brand} onChange={e => f('brand', e.target.value)} placeholder="Hikvision, TP-Link..." />
                </div>
                <div className="form-group">
                  <label className="form-label">الموديل</label>
                  <input className="form-input" value={form.model} onChange={e => f('model', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية</label>
                  <input className="form-input" type="number" value={form.quantity} onChange={e => f('quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحد الأدنى للتنبيه</label>
                  <input className="form-input" type="number" value={form.min_quantity} onChange={e => f('min_quantity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر الشراء (ر.س)</label>
                  <input className="form-input" type="number" value={form.buy_price} onChange={e => f('buy_price', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر البيع (ر.س)</label>
                  <input className="form-input" type="number" value={form.sell_price} onChange={e => f('sell_price', e.target.value)} />
                </div>
                <div className="form-group span-2">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => f('description', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>إلغاء</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
