import { useState, useRef } from "react";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Upload, Plus, Copy, Eye, EyeOff, Trash2, Palette, FileText, Loader2 } from "lucide-react";

const integrations = [
  { name: "Jira", status: "Connected", desc: "Issue tracking integration" },
  { name: "SharePoint", status: "Connected", desc: "Document management" },
  { name: "SAP ERP", status: "Disconnected", desc: "Enterprise resource planning" },
  { name: "Twilio", status: "Connected", desc: "SMS notifications" },
  { name: "SendGrid", status: "Connected", desc: "Email delivery" },
  { name: "Power BI", status: "Connected", desc: "Business intelligence" },
  { name: "Workday", status: "Disconnected", desc: "HR management" },
  { name: "ServiceNow", status: "Disconnected", desc: "IT service management" },
];

const apiKeys = [
  { name: "Production API", prefix: "hse_prod_***", created: "Jan 15, 2026", lastUsed: "2 min ago", scopes: "Read, Write" },
  { name: "Staging API", prefix: "hse_stg_***", created: "Dec 1, 2025", lastUsed: "3 days ago", scopes: "Read" },
  { name: "CI/CD Pipeline", prefix: "hse_ci_***", created: "Nov 20, 2025", lastUsed: "1 hour ago", scopes: "Read, Deploy" },
];

const webhooks = [
  { url: "https://hooks.company.com/hse/violations", events: "New Violation, Status Change", status: "Active", lastTriggered: "2 min ago" },
  { url: "https://hooks.company.com/hse/devices", events: "Device Offline", status: "Active", lastTriggered: "6 hrs ago" },
];

const knowledgeBaseDocs = [
  { name: "Site_Safety_SOP.pdf", size: "2.4 MB", uploaded: "Jan 12, 2026", status: "Indexed" },
  { name: "Emergency_Evacuation_Plan.docx", size: "1.1 MB", uploaded: "Feb 05, 2026", status: "Indexed" },
  { name: "Incident_Reporting_Guidelines.txt", size: "45 KB", uploaded: "Mar 10, 2026", status: "Pending" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isUploading, setIsUploading] = useState(false);
  const [docsList, setDocsList] = useState(knowledgeBaseDocs);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = [
    { id: "general", label: "General" },
    { id: "integrations", label: "Integrations" },
    { id: "api", label: "API Keys" },
    { id: "webhooks", label: "Webhooks" },
    { id: "branding", label: "Branding" },
    { id: "knowledge", label: "AI Knowledge Base" },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('layer', '3'); // Demo value
      formData.append('org_code', 'ENFINITY'); // Demo value
      // formData.append('country_code', 'UK'); // Optional demo value

      const response = await fetch('/api/kb/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Add to list statically for demo
      setDocsList(prev => [{
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploaded: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: "Pending"
      }, ...prev]);

    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1>System Settings</h1>

      <div className="flex gap-1 border-b" style={{ borderColor: '#E2E8E2' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-[13px] transition-colors relative"
            style={{ color: activeTab === tab.id ? '#1B5E20' : '#4A5568', fontWeight: activeTab === tab.id ? 600 : 400 }}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }} />}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="max-w-xl space-y-6">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">General Settings</h2>
            <div className="space-y-5">
              <div>
                <label className="block mb-1.5">Platform Name</label>
                <input defaultValue="HSE Intelligence" className="w-full h-10 px-4 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2', color: '#0A0A0A' }} />
              </div>
              <div>
                <label className="block mb-1.5">Logo</label>
                <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F7F4] transition-colors" style={{ borderColor: '#E2E8E2' }}>
                  <Upload className="w-8 h-8 mb-2" style={{ color: '#9CA3AF' }} />
                  <span className="text-[13px]" style={{ color: '#4A5568' }}>Drag & drop or click to upload</span>
                  <span className="text-[11px]" style={{ color: '#9CA3AF' }}>PNG, SVG, max 2MB</span>
                </div>
              </div>
              <div>
                <label className="block mb-1.5">Default Timezone</label>
                <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: '#E2E8E2' }}>
                  <option>CST (UTC-6)</option>
                  <option>EST (UTC-5)</option>
                  <option>MST (UTC-7)</option>
                  <option>PST (UTC-8)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5">Default Language</label>
                <select className="w-full h-10 px-3 rounded-lg border text-[13px] bg-white" style={{ borderColor: '#E2E8E2' }}>
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>Portuguese</option>
                  <option>French</option>
                </select>
              </div>
              <button className="px-6 py-2.5 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {integrations.map(int => (
            <div key={int.name} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-[14px]" style={{ background: '#F4F7F4', color: '#1B5E20', fontWeight: 700 }}>
                  {int.name[0]}
                </div>
                <StatusBadge status={int.status} size="sm" />
              </div>
              <div className="text-[14px] mb-1" style={{ color: '#0A0A0A', fontWeight: 600 }}>{int.name}</div>
              <div className="text-[12px] mb-4" style={{ color: '#9CA3AF' }}>{int.desc}</div>
              <button
                className="w-full py-2 rounded-lg text-[12px] transition-colors"
                style={
                  int.status === "Connected"
                    ? { border: '1px solid #DC2626', color: '#DC2626', fontWeight: 500 }
                    : { background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff', fontWeight: 500 }
                }
              >
                {int.status === "Connected" ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "api" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Generate New Key
            </button>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["Key Name", "Prefix", "Created", "Last Used", "Scopes", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiKeys.map(k => (
                  <tr key={k.name} style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{k.name}</td>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: '#4A5568' }}>{k.prefix}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{k.created}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{k.lastUsed}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{k.scopes}</td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1 rounded text-[12px] border transition-colors hover:bg-red-50" style={{ borderColor: '#FEE2E2', color: '#DC2626', fontWeight: 500 }}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Add Webhook
            </button>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["URL", "Events", "Status", "Last Triggered", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {webhooks.map((w, i) => (
                  <tr key={i} className="group" style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: '#0A0A0A' }}>{w.url}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{w.events}</td>
                    <td className="px-4 py-3"><StatusBadge status={w.status} size="sm" /></td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{w.lastTriggered}</td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "branding" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Brand Customization</h2>
            <div className="space-y-5">
              <div>
                <label className="block mb-1.5">Logo</label>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F7F4]" style={{ borderColor: '#E2E8E2' }}>
                  <Upload className="w-6 h-6 mb-2" style={{ color: '#9CA3AF' }} />
                  <span className="text-[12px]" style={{ color: '#4A5568' }}>Upload logo</span>
                </div>
              </div>
              <div>
                <label className="block mb-1.5">Primary Color</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg cursor-pointer" style={{ background: '#1B5E20' }} />
                  <input defaultValue="#1B5E20" className="flex-1 h-10 px-4 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8E2' }} />
                </div>
              </div>
              <button className="px-6 py-2.5 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
                Save Branding
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Preview</h2>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#E2E8E2' }}>
              {/* Mini sidebar preview */}
              <div className="flex h-48">
                <div className="w-16" style={{ background: '#0D1F0D' }}>
                  <div className="p-2 space-y-2 mt-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-2 rounded-full" style={{ background: i === 1 ? 'linear-gradient(135deg, #1A4D1A, #2E7D32)' : '#1E2E1E' }} />
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="h-8 border-b flex items-center px-3" style={{ borderColor: '#E2E8E2' }}>
                    <div className="w-16 h-2 rounded-full" style={{ background: '#E2E8E2' }} />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-24 rounded" style={{ background: '#E2E8E2' }} />
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex-1 h-12 rounded-lg" style={{ background: '#F4F7F4' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "knowledge" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Organization Knowledge Base</h2>
            <div className="space-y-6">
              <div>
                <label className="block mb-1.5 font-medium text-[14px]">Upload Documents</label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F7F4] transition-colors relative" 
                  style={{ borderColor: '#E2E8E2' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" style={{ color: '#1B5E20' }} />
                      <span className="text-[14px]" style={{ color: '#4A5568' }}>Uploading document...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2" style={{ color: '#9CA3AF' }} />
                      <span className="text-[14px]" style={{ color: '#4A5568' }}>Drag & drop or click to upload new documents</span>
                      <span className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>Supported formats: PDF, DOCX, TXT (Max 10MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".pdf,.docx,.txt"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 font-medium text-[14px]">Indexed Documents</label>
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#E2E8E2' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#F4F7F4' }}>
                        {["Document Name", "Size", "Uploaded", "Status", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left">
                            <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docsList.map((doc, i) => (
                        <tr key={`${doc.name}-${i}`} style={{ borderBottom: '1px solid #EEF2EE' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" style={{ color: '#1B5E20' }} />
                              <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{doc.size}</td>
                          <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{doc.uploaded}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={doc.status} size="sm" />
                          </td>
                          <td className="px-4 py-3">
                            <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
