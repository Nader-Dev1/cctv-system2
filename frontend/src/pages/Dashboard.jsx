import { useEffect, useState } from 'react';
import { Package, Users, Wrench, UserCheck, FileText, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { dashboard } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />جاري التحميل...</div>;
  if (!data) return null;

  const { stats, recentTickets, recentInvoices, lowStockItems } = data;

  const statCards = [
    { label: 'إجمالي المنتجات', value: stats.totalProducts, icon: Package, color: 'blue', sub: `${stats.lowStockProducts} يحتاج تعبئة` },
    { label: 'العملاء', value: stats.totalCustomers, icon: Users, color: 'green' },
    { label: 'طلبات الصيانة المعلقة', value: stats.pendingTickets, icon: Wrench, color: 'yellow', sub: `${stats.inProgressTickets} قيد التنفيذ` },
    { label: 'الموظفين النشطين', value: stats.totalEmployees, icon: UserCheck, color: 'purple' },
    { label: 'إجمالي الفواتير', value: stats.totalInvoices, icon: FileText, color: 'blue' },
    { label: 'الإيرادات المحصلة', value: `${stats.totalRevenue?.toLocaleString()} ر.س`, icon: TrendingUp, color: 'green' },
  ];

  const statusMap = {
    pending: { label: 'معلق', cls: 'badge-yellow' },
    in_progress: { label: 'قيد التنفيذ', cls: 'badge-blue' },
    done: { label: 'منتهي', cls: 'badge-green' },
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h2>لوحة التحكم</h2>
          <p>نظرة عامة على أعمالك</p>
        </div>
      </div>
      <div className="page-body">
        {stats.lowStockProducts > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            تنبيه: {stats.lowStockProducts} منتج وصل للحد الأدنى من المخزون
          </div>
        )}

        <div className="stats-grid">
          {statCards.map((s, i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${s.color}`}><s.icon /></div>
              <div className="stat-info">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">آخر طلبات الصيانة</span>
              <Clock size={16} color="var(--text3)" />
            </div>
            {recentTickets.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>لا توجد طلبات</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentTickets.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.ticket_number}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.customer_name} — {t.device_name}</div>
                    </div>
                    <span className={`badge ${statusMap[t.status]?.cls || 'badge-gray'}`}>
                      {statusMap[t.status]?.label || t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">تنبيهات المخزون</span>
              <AlertTriangle size={16} color="var(--yellow)" />
            </div>
            {lowStockItems.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>المخزون بخير ✓</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lowStockItems.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.category}</div>
                    </div>
                    <span className="badge badge-red">الكمية: {p.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">آخر الفواتير</span>
          </div>
          {recentInvoices.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>لا توجد فواتير</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>العميل</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.invoice_number}</td>
                      <td>{inv.customer_name || 'عميل عابر'}</td>
                      <td>{inv.type === 'sale' ? 'بيع' : 'صيانة'}</td>
                      <td>{inv.total?.toLocaleString()} ر.س</td>
                      <td>
                        <span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                          {inv.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
