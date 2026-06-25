import { useState } from 'react';
import Swal from 'sweetalert2';
import PageHeader from '../../../shared/components/PageHeader';
import DataTable from '../../../shared/components/DataTable';
import AppModal from '../../../shared/components/AppModal';
import { useTableParams } from '../../../shared/hooks/useTableParams';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatDate } from '../../../shared/utils/formatters';
import { useAuth } from '../../../shared/hooks/useAuth';
import {
  useCorporates,
  useApproveCorporate,
  useRejectCorporate,
  useSuspendCorporate,
  useReactivateCorporate,
  useUpdateCreditTerms,
  usePaymentTerms,
} from '../api';

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer: 1800, showConfirmButton: false });

const STATUS_BADGE = {
  pending:   'bg-warning text-dark',
  active:    'bg-success',
  approved:  'bg-success',
  rejected:  'bg-danger',
  suspended: 'bg-dark',
};

const STATUS_LABEL = {
  pending:   'Pending',
  active:    'Active',
  approved:  'Approved',
  rejected:  'Rejected',
  suspended: 'Suspended',
};

const EMPTY_APPROVE = { credit_limit: '', payment_terms: 'net_30', admin_notes: '' };
const EMPTY_CREDIT  = { credit_limit: '', payment_terms: 'net_30' };

export default function ApprovalsPage() {
  const { hasPermission, isAdmin } = useAuth();
  const canAction = isAdmin || hasPermission('approvals.action');

  const [activeTab, setActiveTab] = useState('corporate');
  const [searchInput, setSearchInput]   = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const [detailTarget,  setDetailTarget]  = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm,   setApproveForm]   = useState(EMPTY_APPROVE);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [creditTarget,  setCreditTarget]  = useState(null);
  const [creditForm,    setCreditForm]    = useState(EMPTY_CREDIT);

  const debouncedSearch = useDebounce(searchInput, 400);
  const { params, setPage } = useTableParams({ orderBy: 'created_at', direction: 'desc', perPage: 15 });

  const queryParams = {
    page:     params.page,
    per_page: params.per_page,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter    && { status: statusFilter }),
  };

  const { data, isLoading } = useCorporates(queryParams);

  const paymentTerms_      = usePaymentTerms();

  const approveMutation    = useApproveCorporate();
  const rejectMutation     = useRejectCorporate();
  const suspendMutation    = useSuspendCorporate();
  const reactivateMutation = useReactivateCorporate();
  const creditMutation     = useUpdateCreditTerms();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const contactName  = (row) => row.corporateProfile?.primary_contact_name  ?? '—';
  const contactPhone = (row) => row.corporateProfile?.primary_contact_phone  ?? '—';
  const creditLimit  = (row) => row.corporateProfile?.credit_limit  ?? 0;
  const paymentTerms = (row) => row.corporateProfile?.payment_terms ?? '—';

  // ── Approve flow ───────────────────────────────────────────────────────────

  const openApprove = (row) => {
    setApproveForm({ ...EMPTY_APPROVE, credit_limit: creditLimit(row), payment_terms: paymentTerms(row) !== '—' ? paymentTerms(row) : 'net_30' });
    setApproveTarget(row);
  };

  const handleApprove = () => {
    if (!approveForm.credit_limit) return toast('warning', 'Enter a credit limit');
    approveMutation.mutate(
      { id: approveTarget.id, ...approveForm },
      {
        onSuccess: (res) => {
          toast('success', res.message ?? 'Account approved');
          setApproveTarget(null);
        },
        onError: (err) => toast('error', err.response?.data?.message ?? 'Approval failed'),
      },
    );
  };

  // ── Reject flow ────────────────────────────────────────────────────────────

  const handleReject = () => {
    if (!rejectReason.trim()) return toast('warning', 'Rejection reason is required');
    rejectMutation.mutate(
      { id: rejectTarget.id, rejection_reason: rejectReason },
      {
        onSuccess: (res) => {
          toast('success', res.message ?? 'Account rejected');
          setRejectTarget(null);
          setRejectReason('');
        },
        onError: (err) => toast('error', err.response?.data?.message ?? 'Rejection failed'),
      },
    );
  };

  // ── Suspend flow ───────────────────────────────────────────────────────────

  const handleSuspend = () => {
    if (!suspendReason.trim()) return toast('warning', 'Suspension reason is required');
    suspendMutation.mutate(
      { id: suspendTarget.id, suspension_reason: suspendReason },
      {
        onSuccess: (res) => {
          toast('success', res.message ?? 'Account suspended');
          setSuspendTarget(null);
          setSuspendReason('');
        },
        onError: (err) => toast('error', err.response?.data?.message ?? 'Suspension failed'),
      },
    );
  };

  // ── Reactivate flow ────────────────────────────────────────────────────────

  const handleReactivate = (row) => {
    Swal.fire({
      title: `Reactivate ${row.company_name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, reactivate',
      confirmButtonColor: '#2563eb',
    }).then((r) => {
      if (!r.isConfirmed) return;
      reactivateMutation.mutate(row.id, {
        onSuccess: (res) => toast('success', res.message ?? 'Account reactivated'),
        onError:   (err) => toast('error', err.response?.data?.message ?? 'Reactivation failed'),
      });
    });
  };

  // ── Credit terms flow ──────────────────────────────────────────────────────

  const openCredit = (row) => {
    setCreditForm({ credit_limit: creditLimit(row), payment_terms: paymentTerms(row) !== '—' ? paymentTerms(row) : 'net_30' });
    setCreditTarget(row);
  };

  const handleCreditUpdate = () => {
    if (!creditForm.credit_limit) return toast('warning', 'Enter a credit limit');
    creditMutation.mutate(
      { id: creditTarget.id, ...creditForm },
      {
        onSuccess: (res) => {
          toast('success', res.message ?? 'Credit terms updated');
          setCreditTarget(null);
        },
        onError: (err) => toast('error', err.response?.data?.message ?? 'Update failed'),
      },
    );
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'company_name',
      label: 'Company',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.company_name}</div>
          <small className="text-muted">{contactName(row)}</small>
        </div>
      ),
    },
    {
      label: 'Contact',
      render: (row) => (
        <div>
          <div className="small">{contactPhone(row)}</div>
          {row.email && <small className="text-muted">{row.email}</small>}
        </div>
      ),
    },
    {
      label: 'Credit Terms',
      render: (row) => (
        <div className="small">
          <div>Limit: <strong>৳{Number(creditLimit(row)).toLocaleString()}</strong></div>
          <div className="text-muted">{paymentTerms_.find((t) => t.value === paymentTerms(row))?.label ?? paymentTerms(row)}</div>
        </div>
      ),
    },
    {
      label: 'Status',
      className: 'text-center',
      render: (row) => (
        <span className={`badge ${STATUS_BADGE[row.status] ?? 'bg-secondary'}`}>
          {STATUS_LABEL[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested',
      render: (row) => <small className="text-muted">{formatDate(row.created_at)}</small>,
    },
    {
      label: 'Actions',
      className: 'text-center',
      render: (row) => (
        <div className="d-flex gap-1 justify-content-center">
          <button className="btn btn-sm btn-outline-info btn-icon" title="View details" onClick={() => setDetailTarget(row)}>
            <i className="fa-solid fa-eye" />
          </button>
          {row.status === 'pending' && canAction && (
            <>
              <button className="btn btn-sm btn-outline-success btn-icon" title="Approve" onClick={() => openApprove(row)}>
                <i className="fa-solid fa-check" />
              </button>
              <button className="btn btn-sm btn-outline-danger btn-icon" title="Reject" onClick={() => { setRejectTarget(row); setRejectReason(''); }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </>
          )}
          {(row.status === 'active' || row.status === 'approved') && canAction && (
            <>
              <button className="btn btn-sm btn-outline-primary btn-icon" title="Update credit terms" onClick={() => openCredit(row)}>
                <i className="fa-solid fa-credit-card" />
              </button>
              <button className="btn btn-sm btn-outline-warning btn-icon" title="Suspend" onClick={() => { setSuspendTarget(row); setSuspendReason(''); }}>
                <i className="fa-solid fa-ban" />
              </button>
            </>
          )}
          {row.status === 'suspended' && canAction && (
            <button className="btn btn-sm btn-outline-success btn-icon" title="Reactivate" onClick={() => handleReactivate(row)}>
              <i className="fa-solid fa-rotate-right" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Approvals"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Approvals' }]}
      />

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'corporate' ? 'active' : ''}`} onClick={() => setActiveTab('corporate')}>
            <i className="fa-solid fa-building me-1" />Corporate Accounts
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link disabled text-muted" disabled>
            <i className="fa-solid fa-star me-1" />Product Reviews
            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link disabled text-muted" disabled>
            <i className="fa-solid fa-ellipsis me-1" />Other Approvals
            <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
          </button>
        </li>
      </ul>

      {activeTab === 'corporate' && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <div className="d-flex gap-2">
                <div className="input-group" style={{ maxWidth: 260 }}>
                  <span className="input-group-text"><i className="fa-solid fa-magnifying-glass" /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Company name or email…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <select
                  className="form-select"
                  style={{ width: 150 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              {data?.meta && (
                <span className="text-muted small">{data.meta.total} total</span>
              )}
            </div>

            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading}
              meta={data?.meta}
              onPageChange={setPage}
              emptyText="No approval requests found."
            />
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <AppModal
        show={Boolean(detailTarget)}
        title="Corporate Account Details"
        onHide={() => setDetailTarget(null)}
        size="md"
      >
        {detailTarget && (
          <div>
            <table className="table table-sm table-bordered mb-0">
              <tbody>
                <tr><th style={{ width: 160 }}>Company</th><td>{detailTarget.company_name}</td></tr>
                <tr><th>Contact Person</th><td>{contactName(detailTarget)}</td></tr>
                <tr><th>Phone</th><td>{contactPhone(detailTarget)}</td></tr>
                <tr><th>Email</th><td>{detailTarget.email || '—'}</td></tr>
                <tr><th>Credit Limit</th><td>৳{Number(creditLimit(detailTarget)).toLocaleString()}</td></tr>
                <tr>
                  <th>Payment Terms</th>
                  <td>{paymentTerms_.find((t) => t.value === paymentTerms(detailTarget))?.label ?? paymentTerms(detailTarget)}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <span className={`badge ${STATUS_BADGE[detailTarget.status] ?? 'bg-secondary'}`}>
                      {STATUS_LABEL[detailTarget.status] ?? detailTarget.status}
                    </span>
                  </td>
                </tr>
                <tr><th>Registered</th><td>{formatDate(detailTarget.created_at)}</td></tr>
              </tbody>
            </table>
            {detailTarget.status === 'pending' && (
              <div className="d-flex gap-2 mt-3">
                {canAction && <button className="btn btn-sm btn-success" onClick={() => { setDetailTarget(null); openApprove(detailTarget); }}>
                  <i className="fa-solid fa-check me-1" />Approve
                </button>}
                {canAction && <button className="btn btn-sm btn-danger" onClick={() => { setDetailTarget(null); setRejectTarget(detailTarget); setRejectReason(''); }}>
                  <i className="fa-solid fa-xmark me-1" />Reject
                </button>}
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ── Approve Modal ────────────────────────────────────────────────── */}
      <AppModal
        show={Boolean(approveTarget)}
        title={`Approve — ${approveTarget?.company_name}`}
        onHide={() => setApproveTarget(null)}
        onSubmit={handleApprove}
        submitLabel="Approve"
        submitVariant="success"
        isLoading={approveMutation.isPending}
        size="sm"
      >
        <div className="mb-3">
          <label className="form-label">Credit Limit (৳) <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control"
            placeholder="50000"
            value={approveForm.credit_limit}
            onChange={(e) => setApproveForm((f) => ({ ...f, credit_limit: e.target.value }))}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Payment Terms</label>
          <select
            className="form-select"
            value={approveForm.payment_terms}
            onChange={(e) => setApproveForm((f) => ({ ...f, payment_terms: e.target.value }))}
          >
            {paymentTerms_.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Admin Notes</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Optional notes…"
            value={approveForm.admin_notes}
            onChange={(e) => setApproveForm((f) => ({ ...f, admin_notes: e.target.value }))}
          />
        </div>
      </AppModal>

      {/* ── Reject Modal ─────────────────────────────────────────────────── */}
      <AppModal
        show={Boolean(rejectTarget)}
        title={`Reject — ${rejectTarget?.company_name}`}
        onHide={() => setRejectTarget(null)}
        onSubmit={handleReject}
        submitLabel="Confirm Reject"
        submitVariant="danger"
        isLoading={rejectMutation.isPending}
        size="sm"
      >
        <div className="mb-2">
          <label className="form-label">Reason <span className="text-danger">*</span></label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Incomplete documentation, credit history issue…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <small className="text-muted">Required. Sent to the applicant.</small>
        </div>
      </AppModal>

      {/* ── Suspend Modal ────────────────────────────────────────────────── */}
      <AppModal
        show={Boolean(suspendTarget)}
        title={`Suspend — ${suspendTarget?.company_name}`}
        onHide={() => setSuspendTarget(null)}
        onSubmit={handleSuspend}
        submitLabel="Suspend Account"
        submitVariant="warning"
        isLoading={suspendMutation.isPending}
        size="sm"
      >
        <div className="mb-2">
          <label className="form-label">Suspension Reason <span className="text-danger">*</span></label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Payment overdue, policy violation…"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
        </div>
      </AppModal>

      {/* ── Credit Terms Modal ───────────────────────────────────────────── */}
      <AppModal
        show={Boolean(creditTarget)}
        title={`Credit Terms — ${creditTarget?.company_name}`}
        onHide={() => setCreditTarget(null)}
        onSubmit={handleCreditUpdate}
        submitLabel="Update Terms"
        isLoading={creditMutation.isPending}
        size="sm"
      >
        <div className="mb-3">
          <label className="form-label">Credit Limit (৳) <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control"
            placeholder="50000"
            value={creditForm.credit_limit}
            onChange={(e) => setCreditForm((f) => ({ ...f, credit_limit: e.target.value }))}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Payment Terms <span className="text-danger">*</span></label>
          <select
            className="form-select"
            value={creditForm.payment_terms}
            onChange={(e) => setCreditForm((f) => ({ ...f, payment_terms: e.target.value }))}
          >
            {paymentTerms_.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </AppModal>
    </div>
  );
}
