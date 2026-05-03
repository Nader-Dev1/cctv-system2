import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Wrench } from 'lucide-react';
import { maintenance as api, customers } from '../api';
import { useToast } from '../context/ToastContext';

const STATUS = {
  pending: { label: 'معلق', cls: 'badge-yellow' },
  in_progress: { label: 'قيد التنفيذ', cls: 'badge-blue' },
  done: { label: 'منتهي', cls: 'badge-green' },
};

const empty = { customer_id: '', device_name: '', problem: '', technician: '', cost: '', notes: '', status: 'pending' };

export default function Maintenance() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [custs, setCusts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getAll().then(r => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
    customers.getAll().then(r => setCusts(r.data || []));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ ...t, customer_id: t.customer_id || '' }); setModal(true); };

  const save = async () => {
    if (!form.device_name || !form.problem) return toast('اسم الجهاز والمشكلة مطلوبان', 'error');
    try {
      if (editing) await api.update(editing.id, form);
      else await api.create(form);
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModal(false); load();
    } catch { toast('حدث خطأ', 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('حذف التذكرة؟')) return;
    try { await api.delete(id); toast('تم الحذف', 'success'); load(); } catch { toast('خطأ', 'error'); }
  };

  const filtered = items.filter(t =>
    (!search || t.ticket_number?.includes(search) || t.customer_name?.includes(search) || t.device_name?.includes(search)) &&
    (!statusFilter || t.status === statusFilter)
  );

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h2>إدارة الصيانة</h2><p>{items.filter(t => t.status !== 'done').length} طلب نشط</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />تذكرة جديدة</button>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search />
            <input className="form-input" placeholder="بحث برقم التذكرة أو العميل..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="pending">معلق</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="done">منتهي</option>
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><Wrench /><h3>لا توجد تذاكر</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>رقم التذكرة</th><th>العميل</th><th>الجهاز</th><th>المشكلة</th><th>الفني</th><th>التكلفة</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.ticket_number}</td>
                      <td>{t.customer_name || 'عميل عابر'}</td>
                      <td>{t.device_name}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.problem}</td>
                      <td>{t.technician || '—'}</td>
                      <td>{t.cost ? `${t.cost} ر.س` : '—'}</td>
                      <td><span className={`badge ${STATUS[t.status]?.cls || 'badge-gray'}`}>{STATUS[t.status]?.label}</span></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(t.id)}><Trash2 size={13} /></button>
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
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'تعديل التذكرة' : 'تذكرة صيانة جديدة'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group span-2">
                  <label className="form-label">العميل</label>
                  <select className="form-select" value={form.customer_id} onChange={e => f('customer_id', e.target.value)}>
                    <option value="">عميل عابر</option>
                    {custs.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الجهاز *</label>
                  <input className="form-input" value={form.device_name} onChange={e => f('device_name', e.target.value)} placeholder="مثال: DVR هايك فيجن" />
                </div>
                <div className="form-group">
                  <label className="form-label">الفني المسؤول</label>
                  <input className="form-input" value={form.technician} onChange={e => f('technician', e.target.value)} />
                </div>
                <div className="form-group span-2">
                  <label className="form-label">وصف المشكلة *</label>
                  <textarea className="form-textarea" value={form.problem} onChange={e => f('problem', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">تكلفة الصيانة (ر.س)</label>
                  <input className="form-input" type="number" value={form.cost} onChange={e => f('cost', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة</label>
                  <select className="form-select" value={form.status} onChange={e => f('status', e.target.value)}>
                    <option value="pending">معلق</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="done">منتهي</option>
                  </select>
                </div>
                <div className="form-group span-2">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => f('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'حفظ' : 'إنشاء'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
