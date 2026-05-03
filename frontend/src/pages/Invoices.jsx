import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, FileText, Download, CheckCircle } from 'lucide-react';
import { invoices as api, customers, products, maintenance } from '../api';
import { useToast } from '../context/ToastContext';

const empty = { type: 'sale', customer_id: '', items: [], discount: 0, notes: '' };

export default function Invoices() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [custs, setCusts] = useState([]);
  const [prods, setProds] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getAll().then(r => { setItems(Array.isArray(r.data) ? r.data : []); setLoading(false); }).catch(() => { setItems([]); setLoading(false); });
    customers.getAll().then(r => setCusts(Array.isArray(r.data) ? r.data : [])).catch(() => setCusts([]));
    products.getAll().then(r => setProds(r.data?.products || [])).catch(() => setProds([]));
    maintenance.getAll().then(r => setTickets(Array.isArray(r.data) ? r.data : [])).catch(() => setTickets([]));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...empty, items: [] }); setModal(true); };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: '', quantity: 1, price: 0, product_id: '' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setForm(p => {
    const items = [...p.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'product_id' && v) {
      const prod = prods.find(p => p.id === v);
      if (prod) { items[i].name = prod.name; items[i].price = prod.sell_price; }
    }
    return { ...p, items };
  });

  const subtotal = form.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.price)), 0);
  const total = subtotal - Number(form.discount || 0);

  const save = async () => {
    if (form.items.length === 0) return toast('أضف منتجاً على الأقل', 'error');
    try {
      await api.create({ ...form, subtotal, total });
      toast('تم إنشاء الفاتورة', 'success');
      setModal(false); load();
    } catch { toast('خطأ', 'error'); }
  };

  const markPaid = async (id) => {
    try { await api.updateStatus(id, 'paid'); toast('تم تحديث الحالة', 'success'); load(); } catch { toast('خطأ', 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('حذف الفاتورة؟')) return;
    try { await api.delete(id); toast('تم الحذف', 'success'); load(); } catch { toast('خطأ', 'error'); }
  };

  const downloadPdf = (id) => window.open(api.getPdfUrl(id), '_blank');

  const filtered = Array.isArray(items) ? items.filter(inv =>
    !search || inv.invoice_number?.includes(search) || inv.customer_name?.includes(search)
  ) : [];

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h2>الفواتير</h2><p>{Array.isArray(items) ? items.length : 0} فاتورة</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />فاتورة جديدة</button>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search />
            <input className="form-input" placeholder="بحث برقم الفاتورة أو العميل..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><FileText /><h3>لا توجد فواتير</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>رقم الفاتورة</th><th>النوع</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{inv.invoice_number}</td>
                      <td><span className={`badge ${inv.type === 'sale' ? 'badge-blue' : 'badge-purple'}`}>{inv.type === 'sale' ? 'بيع' : 'صيانة'}</span></td>
                      <td>{inv.customer_name || 'عميل عابر'}</td>
                      <td><strong>{inv.total?.toLocaleString()} ر.س</strong></td>
                      <td><span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}</span></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <div className="actions">
                          {inv.status !== 'paid' && (
                            <button className="btn btn-success btn-sm" title="تحديد كمدفوعة" onClick={() => markPaid(inv.id)}><CheckCircle size={13} /></button>
                          )}
                          <button className="btn btn-secondary btn-sm" title="تحميل PDF" onClick={() => downloadPdf(inv.id)}><Download size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(inv.id)}><Trash2 size={13} /></button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>إنشاء فاتورة جديدة</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">نوع الفاتورة</label>
                  <select className="form-select" value={form.type} onChange={e => f('type', e.target.value)}>
                    <option value="sale">فاتورة بيع</option>
                    <option value="maintenance">فاتورة صيانة</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">العميل</label>
                  <select className="form-select" value={form.customer_id} onChange={e => f('customer_id', e.target.value)}>
                    <option value="">عميل عابر</option>
                    {custs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="card-title">البنود</span>
                  <button className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} />إضافة بند</button>
                </div>
                {form.items.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد بنود — أضف بنداً</p>}
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, marginBottom: 10, alignItems: 'end' }}>
                    {form.type === 'sale' ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">المنتج</label>
                        <select className="form-select" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                          <option value="">اختر منتج أو أدخل يدوياً</option>
                          {prods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">الوصف</label>
                        <input className="form-input" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="وصف الخدمة" />
                      </div>
                    )}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">الكمية</label>
                      <input className="form-input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">السعر</label>
                      <input className="form-input" type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
                    </div>
                    <button className="btn btn-danger btn-sm" style={{ marginBottom: 1 }} onClick={() => removeItem(i)}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, alignItems: 'center' }}>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 }}>
                  <label className="form-label" style={{ whiteSpace: 'nowrap' }}>خصم (ر.س)</label>
                  <input className="form-input" type="number" style={{ width: 100 }} value={form.discount} onChange={e => f('discount', e.target.value)} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>المجموع الفرعي: {subtotal.toLocaleString()} ر.س</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent2)' }}>الإجمالي: {total.toLocaleString()} ر.س</div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">ملاحظات</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => f('notes', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={save}>إنشاء الفاتورة</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
