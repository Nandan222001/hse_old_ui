import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2, RefreshCcw, Save, Send, ShieldAlert } from 'lucide-react';
import {
  bootstrapChecklistTemplates,
  createChecklistSubmission,
  getChecklistSubmissionDetail,
  getChecklistSubmissions,
  getChecklistTemplates,
  saveChecklistSubmissionItems,
  submitChecklistSubmission,
  type ChecklistSubmissionDetail,
  type ChecklistSubmissionSummary,
  type ChecklistTemplate,
} from '../../services/checklists.service';
import { getShifts, getSites, getZones } from '../../services/infrastructure.service';
import { useAuth } from '../context/AuthContext';

const RESPONSE_OPTIONS = [
  { value: 'yes', label: 'Yes / Compliant' },
  { value: 'no', label: 'No / Issue Found' },
  { value: 'na', label: 'Not Applicable' },
] as const;

export function ChecklistPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [submissions, setSubmissions] = useState<ChecklistSubmissionSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [checklistDate, setChecklistDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sites, setSites] = useState<Array<{ Site_ID: string; Site_Name: string }>>([]);
  const [zones, setZones] = useState<Array<{ Zone_ID: string; Zone_Name: string; Site_ID: string }>>([]);
  const [shifts, setShifts] = useState<Array<{ Shift_ID: string; Shift_Name: string }>>([]);
  const [activeSubmission, setActiveSubmission] = useState<ChecklistSubmissionDetail | null>(null);
  const [responses, setResponses] = useState<Record<number, { response_value: string; remark: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowedTemplates = useMemo(
    () => templates.filter((template) => !user?.role || template.submitter_roles.includes(user.role)),
    [templates, user?.role],
  );

  const refreshData = async (preserveSubmissionUuid?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [templateData, submissionData, siteData, zoneData, shiftData] = await Promise.all([
        getChecklistTemplates(),
        getChecklistSubmissions({ limit: 20 }),
        getSites(),
        getZones(),
        getShifts(),
      ]);

      setTemplates(templateData);
      setSubmissions(submissionData);
      setSites(siteData.map((site) => ({ Site_ID: site.Site_ID, Site_Name: site.Site_Name })));
      setZones(zoneData.map((zone) => ({ Zone_ID: zone.Zone_ID, Zone_Name: zone.Zone_Name, Site_ID: zone.Site_ID })));
      setShifts(shiftData.map((shift) => ({ Shift_ID: shift.Shift_ID, Shift_Name: shift.Shift_Name })));

      const keepUuid = preserveSubmissionUuid || activeSubmission?.submission.submission_uuid;
      if (keepUuid) {
        const detail = await getChecklistSubmissionDetail(keepUuid);
        hydrateSubmission(detail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load checklist data.');
    } finally {
      setLoading(false);
    }
  };

  const hydrateSubmission = (detail: ChecklistSubmissionDetail) => {
    setActiveSubmission(detail);
    setSelectedTemplate(detail.submission.checklist_type);
    setSelectedSite(detail.submission.site_id ?? '');
    setSelectedZone(detail.submission.zone_id ?? '');
    setSelectedShift(detail.submission.shift_name ?? '');
    setChecklistDate(detail.submission.checklist_date);
    setResponses(
      Object.fromEntries(
        detail.items.map((item) => [
          item.item_no,
          {
            response_value: item.response_value ?? '',
            remark: item.remark ?? '',
          },
        ]),
      ),
    );
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedTemplate && allowedTemplates.length > 0) {
      setSelectedTemplate(allowedTemplates[0].checklist_type);
    }
  }, [allowedTemplates, selectedTemplate]);

  const filteredZones = useMemo(
    () => zones.filter((zone) => !selectedSite || zone.Site_ID === selectedSite),
    [selectedSite, zones],
  );

  const createDraft = async () => {
    if (!selectedTemplate) {
      setError('Select a checklist template first.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const created = await createChecklistSubmission({
        checklist_type: selectedTemplate,
        site_id: selectedSite || undefined,
        zone_id: selectedZone || undefined,
        shift_name: selectedShift || undefined,
        checklist_date: checklistDate,
      });
      const detail = await getChecklistSubmissionDetail(created.submission_uuid);
      hydrateSubmission(detail);
      await refreshData(created.submission_uuid);
      setMessage('Draft checklist created. Fill the items and save when ready.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create checklist draft.');
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!activeSubmission) {
      setError('Create or open a draft checklist first.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveChecklistSubmissionItems(
        activeSubmission.submission.submission_uuid,
        activeSubmission.items.map((item) => ({
          item_no: item.item_no,
          response_value: responses[item.item_no]?.response_value || null,
          remark: responses[item.item_no]?.remark || null,
        })),
      );
      await refreshData(activeSubmission.submission.submission_uuid);
      setMessage('Checklist draft saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save checklist draft.');
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = async () => {
    if (!activeSubmission) {
      setError('Create or open a draft checklist first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await saveChecklistSubmissionItems(
        activeSubmission.submission.submission_uuid,
        activeSubmission.items.map((item) => ({
          item_no: item.item_no,
          response_value: responses[item.item_no]?.response_value || null,
          remark: responses[item.item_no]?.remark || null,
        })),
      );
      await submitChecklistSubmission(activeSubmission.submission.submission_uuid);
      await refreshData(activeSubmission.submission.submission_uuid);
      setMessage('Checklist submitted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  const bootstrapIfNeeded = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await bootstrapChecklistTemplates();
      await refreshData();
      setMessage('Checklist templates initialized.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initialize checklist templates.');
    } finally {
      setSaving(false);
    }
  };

  const completion = activeSubmission
    ? activeSubmission.items.filter((item) => responses[item.item_no]?.response_value).length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1>Daily Checklists</h1>
          <p className="text-[13px] mt-1" style={{ color: '#4A5568' }}>
            Create, save and submit field checklists for inspectors, engineers, supervisors, workers and contractors.
          </p>
        </div>
        <button
          onClick={() => refreshData()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-[13px]"
          style={{ borderColor: '#D6E4FF', color: '#1D4ED8', fontWeight: 600 }}
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {message && (
        <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 500 }}>
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl px-4 py-3 text-[13px]" style={{ background: '#FFF1F2', color: '#BE123C', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E6EEFF' }}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5" style={{ color: '#1D4ED8' }} />
              <h2 className="text-[16px]" style={{ fontWeight: 700 }}>New checklist</h2>
            </div>

            {allowedTemplates.length === 0 ? (
              <div className="space-y-3">
                <p className="text-[13px]" style={{ color: '#6B7280' }}>
                  No checklist templates are available for your role yet.
                </p>
                {user?.role === 'Admin' && (
                  <button
                    onClick={bootstrapIfNeeded}
                    className="px-4 py-2 rounded-lg text-white text-[13px]"
                    style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', fontWeight: 600 }}
                  >
                    Initialize templates
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Template</label>
                  <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="w-full h-10 px-3 rounded-lg border bg-white text-[13px]" style={{ borderColor: '#D6E4FF' }}>
                    {allowedTemplates.map((template) => (
                      <option key={template.checklist_type} value={template.checklist_type}>
                        {template.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Site</label>
                    <select value={selectedSite} onChange={(e) => { setSelectedSite(e.target.value); setSelectedZone(''); }} className="w-full h-10 px-3 rounded-lg border bg-white text-[13px]" style={{ borderColor: '#D6E4FF' }}>
                      <option value="">Select site</option>
                      {sites.map((site) => <option key={site.Site_ID} value={site.Site_ID}>{site.Site_Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Zone</label>
                    <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full h-10 px-3 rounded-lg border bg-white text-[13px]" style={{ borderColor: '#D6E4FF' }}>
                      <option value="">Select zone</option>
                      {filteredZones.map((zone) => <option key={zone.Zone_ID} value={zone.Zone_ID}>{zone.Zone_Name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Shift</label>
                    <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="w-full h-10 px-3 rounded-lg border bg-white text-[13px]" style={{ borderColor: '#D6E4FF' }}>
                      <option value="">Select shift</option>
                      {shifts.map((shift) => <option key={shift.Shift_ID} value={shift.Shift_Name}>{shift.Shift_Name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Checklist date</label>
                    <input type="date" value={checklistDate} onChange={(e) => setChecklistDate(e.target.value)} className="w-full h-10 px-3 rounded-lg border bg-white text-[13px]" style={{ borderColor: '#D6E4FF' }} />
                  </div>
                </div>

                <button
                  onClick={createDraft}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-[13px] disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', fontWeight: 600 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                  Create draft checklist
                </button>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E6EEFF' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px]" style={{ fontWeight: 700 }}>Recent submissions</h2>
              <span className="text-[12px] px-2 py-1 rounded-full" style={{ background: '#F3F7FF', color: '#1D4ED8', fontWeight: 700 }}>
                {submissions.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {loading ? (
                <div className="py-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1D4ED8' }} /></div>
              ) : submissions.length === 0 ? (
                <p className="text-[13px]" style={{ color: '#6B7280' }}>No checklist submissions yet.</p>
              ) : submissions.map((submission) => (
                <button
                  key={submission.submission_uuid}
                  onClick={async () => {
                    const detail = await getChecklistSubmissionDetail(submission.submission_uuid);
                    hydrateSubmission(detail);
                    setMessage(null);
                    setError(null);
                  }}
                  className="w-full text-left rounded-xl border p-3 hover:bg-[#F9FBF9] transition-colors"
                  style={{ borderColor: activeSubmission?.submission.submission_uuid === submission.submission_uuid ? '#93C5FD' : '#E6EEFF' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{submission.checklist_type.replaceAll('_', ' ')}</div>
                      <div className="text-[12px] mt-1" style={{ color: '#6B7280' }}>{submission.site_id || 'No site'} • {submission.checklist_date}</div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full uppercase" style={{ background: submission.status === 'submitted' ? '#ECFDF3' : '#FFF7ED', color: submission.status === 'submitted' ? '#15803D' : '#C2410C', fontWeight: 700 }}>
                      {submission.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl border p-5 min-h-[720px]" style={{ borderColor: '#E6EEFF' }}>
          {!activeSubmission ? (
            <div className="h-full min-h-[620px] flex flex-col items-center justify-center text-center px-8">
              <ClipboardList className="w-12 h-12 mb-4" style={{ color: '#AFC4EE' }} />
              <h2 className="text-[18px] mb-2" style={{ color: '#0A0A0A', fontWeight: 700 }}>No active checklist</h2>
              <p className="text-[13px] max-w-md" style={{ color: '#6B7280' }}>
                Create a draft from the left panel or open a recent checklist to start entering inspection responses.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[18px]" style={{ color: '#0A0A0A', fontWeight: 700 }}>
                    {activeSubmission.template.ui?.form_title || activeSubmission.template.display_name}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2 text-[12px]" style={{ color: '#6B7280' }}>
                    <span>Site: {activeSubmission.submission.site_id || '—'}</span>
                    <span>Zone: {activeSubmission.submission.zone_id || '—'}</span>
                    <span>Shift: {activeSubmission.submission.shift_name || '—'}</span>
                    <span>Date: {activeSubmission.submission.checklist_date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] uppercase tracking-[0.6px]" style={{ color: '#6B7280', fontWeight: 700 }}>Completion</div>
                  <div className="text-[24px]" style={{ color: '#1D4ED8', fontWeight: 700 }}>{completion}/{activeSubmission.items.length}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={saveDraft}
                  disabled={saving || activeSubmission.submission.status !== 'draft'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[13px] disabled:opacity-60"
                  style={{ borderColor: '#D6E4FF', color: '#1D4ED8', fontWeight: 700 }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save draft
                </button>
                <button
                  onClick={submitDraft}
                  disabled={submitting || activeSubmission.submission.status !== 'draft'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', fontWeight: 700 }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit checklist
                </button>
                {activeSubmission.submission.status !== 'draft' && (
                  <span className="text-[12px] flex items-center gap-1.5" style={{ color: '#15803D', fontWeight: 700 }}>
                    <CheckCircle2 className="w-4 h-4" /> {activeSubmission.submission.status}
                  </span>
                )}
              </div>

              <div className="space-y-4 max-h-[760px] overflow-auto pr-1">
                {activeSubmission.items.map((item) => (
                  <div key={item.item_no} className="rounded-xl border p-4" style={{ borderColor: '#E6EEFF', background: '#FCFDFF' }}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.6px] mb-1" style={{ color: '#6B7280', fontWeight: 700 }}>{item.section_name}</div>
                        <div className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{item.item_no}. {item.item_text}</div>
                      </div>
                      {item.is_required ? (
                        <span className="text-[10px] px-2 py-1 rounded-full uppercase" style={{ background: '#FFF7ED', color: '#C2410C', fontWeight: 700 }}>
                          Required
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-3">
                      <select
                        value={responses[item.item_no]?.response_value || ''}
                        disabled={activeSubmission.submission.status !== 'draft'}
                        onChange={(e) => setResponses((prev) => ({
                          ...prev,
                          [item.item_no]: { response_value: e.target.value, remark: prev[item.item_no]?.remark || '' },
                        }))}
                        className="h-10 px-3 rounded-lg border bg-white text-[13px] disabled:opacity-70"
                        style={{ borderColor: '#D6E4FF' }}
                      >
                        <option value="">Select response</option>
                        {RESPONSE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <input
                        value={responses[item.item_no]?.remark || ''}
                        disabled={activeSubmission.submission.status !== 'draft'}
                        onChange={(e) => setResponses((prev) => ({
                          ...prev,
                          [item.item_no]: { response_value: prev[item.item_no]?.response_value || '', remark: e.target.value },
                        }))}
                        placeholder="Remark or observation"
                        className="h-10 px-3 rounded-lg border bg-white text-[13px] disabled:opacity-70"
                        style={{ borderColor: '#D6E4FF' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {activeSubmission.logs.length > 0 && (
                <div className="rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4" style={{ color: '#1D4ED8' }} />
                    <h3 className="text-[14px]" style={{ fontWeight: 700 }}>Workflow log</h3>
                  </div>
                  <div className="space-y-2">
                    {activeSubmission.logs.map((log, index) => (
                      <div key={`${log.created_at}-${index}`} className="text-[12px]" style={{ color: '#4A5568' }}>
                        <span style={{ fontWeight: 700 }}>{log.action_type}</span> • {log.actor_role} • {new Date(log.created_at).toLocaleString()}
                        {log.notes ? <span> — {log.notes}</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
