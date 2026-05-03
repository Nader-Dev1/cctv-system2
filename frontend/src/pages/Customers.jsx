import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { customers as api } from '../api';
import { useToast } from '../context/ToastContext';

const empty = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = () => api.getAll().then(r => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setModal(true); };
  const openView = async (c) => {
    const r = await api.getOne(c.id);
    setViewing(r.data); setViewModal(true);
  };

  const save = async () => {
    if (!form.name) return toast('اسم العميل مطلوب', 'error');
    try {
      if (editing) await api.update(editing.id, form);
      else await api.create(form);
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModal(false); load();
    } catch { toast('حدث خطأ', 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('حذف العميل؟')) return;
    try { await api.delete(id); toast('تم الحذف', 'success'); load(); } catch { toast('حدث خطأ', 'error'); }
  };

  const filtered = items.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
  );

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const statusMap = {
    pending: { label: 'معلق', cls: 'badge-yellow' },
    in_progress: { label: 'قيد التنفيذ', cls: 'badge-blue' },
    done: { label: 'منتهي', cls: 'badge-green' },
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h2>إدارة العملاء</h2><p>{items.length} عميل مسجل</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />إضافة عميل</button>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search />
            <input className="form-input" placeholder="بحث بالاسم أو الرقم..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><Users /><h3>لا يوجد عملاء</h3><p>أضف عميلك الأول</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الاسم</th><th>رقم الجوال</th><th>البريد</th><th>العنوان</th><th>تاريخ التسجيل</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>{c.phone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.address || '—'}</td>
                      <td style={{ color: 'var(--text3)' }}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openView(c)}><Eye size={13} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
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

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الاسم *</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الجوال</label>
                  <input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-input" value={form.email} onChange={e => f('email', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">العنوان</label>
                  <input className="form-input" value={form.address} onChange={e => f('address', e.target.value)} />
                </div>
                <div className="form-group span-2">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => f('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'حفظ' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && viewing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>ملف العميل — {viewing.name}</h3>
              <button className="modal-close" onClick={() => setViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div><div className="form-label" style={{ marginBottom: 4 }}>الجوال</div><div>{viewing.phone || '—'}</div></div>
                <div><div className="form-label" style={{ marginBottom: 4 }}>العنوان</div><div>{viewing.address || '—'}</div></div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 12 }}>سجل الصيانة</div>
                {viewing.maintenance?.length === 0 ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>لا يوجد سجل صيانة</p> : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>رقم التذكرة</th><th>الجهاز</th><th>المشكلة</th><th>الحالة</th><th>التكلفة</th></tr></thead>
                      <tbody>
                        {viewing.maintenance?.map(t => (
                          <tr key={t.id}>
                            <td>{t.ticket_number}</td>
                            <td>{t.device_name}</td>
                            <td>{t.problem}</td>
                            <td><span className={`badge ${statusMap[t.status]?.cls || 'badge-gray'}`}>{statusMap[t.status]?.label || t.status}</span></td>
                            <td>{t.cost} ر.س</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
