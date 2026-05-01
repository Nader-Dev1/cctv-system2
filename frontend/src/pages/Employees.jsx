import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, Clock } from 'lucide-react';
import { employees as api } from '../api';
import { useToast } from '../context/ToastContext';

const ROLES = ['فني صيانة', 'مندوب مبيعات', 'مدير', 'محاسب', 'سائق', 'أخرى'];
const empty = { name: '', phone: '', role: 'فني صيانة', salary: '', hire_date: '', notes: '', status: 'active' };

export default function Employees() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [attEmp, setAttEmp] = useState(null);
  const [form, setForm] = useState(empty);
  const [attForm, setAttForm] = useState({ date: new Date().toISOString().slice(0,10), check_in: '', check_out: '', notes: '' });
  const [loading, setLoading] = useState(true);

  const load = () => api.getAll().then(r => { setItems(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (e) => { setEditing(e); setForm({ ...e }); setModal(true); };
  const openAtt = (e) => { setAttEmp(e); setAttModal(true); };

  const save = async () => {
    if (!form.name) return toast('الاسم مطلوب', 'error');
    try {
      if (editing) await api.update(editing.id, form);
      else await api.create(form);
      toast(editing ? 'تم التحديث' : 'تمت الإضافة', 'success');
      setModal(false); load();
    } catch { toast('خطأ', 'error'); }
  };

  const saveAtt = async () => {
    if (!attForm.date) return toast('التاريخ مطلوب', 'error');
    try {
      await api.addAttendance(attEmp.id, attForm);
      toast('تم تسجيل الحضور', 'success');
      setAttModal(false);
    } catch { toast('خطأ', 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('حذف الموظف؟')) return;
    try { await api.delete(id); toast('تم الحذف', 'success'); load(); } catch { toast('خطأ', 'error'); }
  };

  const filtered = items.filter(e => !search || e.name.includes(search) || (e.role || '').includes(search));
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const af = (k, v) => setAttForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <div className="page-header">
        <div className="page-title"><h2>إدارة الموظفين</h2><p>{items.filter(e => e.status === 'active').length} موظف نشط</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} />إضافة موظف</button>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input-wrap">
            <Search />
            <input className="form-input" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><UserCheck /><h3>لا يوجد موظفين</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>الاسم</th><th>الجوال</th><th>الوظيفة</th><th>الراتب</th><th>تاريخ التوظيف</th><th>الحالة</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td dir="ltr" style={{ textAlign: 'right' }}>{e.phone || '—'}</td>
                      <td><span className="badge badge-purple">{e.role}</span></td>
                      <td>{e.salary ? `${Number(e.salary).toLocaleString()} ر.س` : '—'}</td>
                      <td style={{ color: 'var(--text3)' }}>{e.hire_date || '—'}</td>
                      <td>
                        <span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                          {e.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-secondary btn-sm" title="تسجيل حضور" onClick={() => openAtt(e)}><Clock size={13} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(e.id)}><Trash2 size={13} /></button>
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
              <h3>{editing ? 'تعديل موظف' : 'إضافة موظف جديد'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الاسم *</label>
                  <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">الجوال</label>
                  <input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">الوظيفة</label>
                  <select className="form-select" value={form.role} onChange={e => f('role', e.target.value)}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الراتب (ر.س)</label>
                  <input className="form-input" type="number" value={form.salary} onChange={e => f('salary', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ التوظيف</label>
                  <input className="form-input" type="date" value={form.hire_date} onChange={e => f('hire_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">الحالة</label>
                  <select className="form-select" value={form.status} onChange={e => f('status', e.target.value)}>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
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
              <button className="btn btn-primary" onClick={save}>{editing ? 'حفظ' : 'إضافة'}</button>
            </div>
          </div>
        </div>
      )}

      {attModal && attEmp && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAttModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>تسجيل حضور — {attEmp.name}</h3>
              <button className="modal-close" onClick={() => setAttModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid cols-1">
                <div className="form-group">
                  <label className="form-label">التاريخ</label>
                  <input className="form-input" type="date" value={attForm.date} onChange={e => af('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت الدخول</label>
                  <input className="form-input" type="time" value={attForm.check_in} onChange={e => af('check_in', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت الخروج</label>
                  <input className="form-input" type="time" value={attForm.check_out} onChange={e => af('check_out', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">ملاحظات</label>
                  <textarea className="form-textarea" value={attForm.notes} onChange={e => af('notes', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAttModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveAtt}>تسجيل</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
