import { useParams, useNavigate } from "react-router";
import { SeverityBadge, StatusBadge } from "../components/shared/StatusBadge";
import {
  ChevronRight, ArrowLeft, Check, Clock, AlertTriangle,
  Send, Paperclip, FileText, Upload, UserPlus
} from "lucide-react";
import { useState } from "react";

const timeline = [
  { action: "Violation Detected", user: "System", time: "Feb 18, 2026 09:23 AM", icon: AlertTriangle, color: "#DC2626" },
  { action: "Assigned to Sarah Chen", user: "Auto-Assignment", time: "Feb 18, 2026 09:23 AM", icon: UserPlus, color: "#0284C7" },
  { action: "Acknowledged", user: "Sarah Chen", time: "Feb 18, 2026 09:35 AM", icon: Check, color: "#F59E0B" },
  { action: "Investigation Started", user: "Sarah Chen", time: "Feb 18, 2026 10:00 AM", icon: Clock, color: "#6D28D9" },
];

const comments = [
  { initials: "SC", name: "Sarah Chen", time: "10:15 AM", text: "Worker WRK-1042 was identified entering Zone C without a hard hat. I've notified the site supervisor." },
  { initials: "MJ", name: "Mike Johnson", time: "10:32 AM", text: "Confirmed via CCTV footage. Worker was issued a warning and provided replacement PPE." },
];

const attachments = [
  { name: "CCTV_Capture_ZoneC_0923.png", date: "Feb 18, 2026", size: "2.4 MB" },
  { name: "Incident_Report_VIO-0842.pdf", date: "Feb 18, 2026", size: "156 KB" },
];

export function ViolationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");

  const statusSteps = ["Detected", "Assigned", "Acknowledged", "In Progress", "Closed"];
  const currentStep = 3; // In Progress

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/violations")} className="flex items-center gap-1 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
        <span className="text-[13px]" style={{ color: '#9CA3AF' }}>Violations</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
        <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{id || "VIO-0842"}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column - 65% */}
        <div className="space-y-6 xl:col-span-2">
          {/* Violation Info Card */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="flex items-center gap-3 mb-6">
              <h1 style={{ fontSize: 'clamp(1.35rem, 2.2vw, 1.75rem)' }}>VIO-0842</h1>
              <SeverityBadge severity="Critical" />
              <StatusBadge status="In Progress" />
            </div>

            {/* Status Tracker */}
            <div className="mb-6 overflow-x-auto">
              <div className="mb-2 flex min-w-[680px] items-center justify-between">
                {statusSteps.map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] mb-1"
                        style={{
                          background: i <= currentStep ? 'linear-gradient(135deg, #1B5E20, #2E7D32)' : '#F3F4F6',
                          color: i <= currentStep ? '#fff' : '#9CA3AF',
                          fontWeight: 600,
                        }}
                      >
                        {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-[12px]" style={{ color: i <= currentStep ? '#1B5E20' : '#9CA3AF', fontWeight: 500 }}>{step}</span>
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 mt-[-16px]" style={{ background: i < currentStep ? '#2E7D32' : '#E2E8E2' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px mb-6" style={{ background: '#EEF2EE' }} />

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Type", value: "No Helmet" },
                { label: "Zone", value: "Zone C - Chemical Store" },
                { label: "Site", value: "Plant Alpha" },
                { label: "Camera ID", value: "CAM-ZC-003" },
                { label: "Shift", value: "Day Shift" },
                { label: "Timestamp", value: "Feb 18, 2026 09:23 AM" },
                { label: "Worker ID", value: "WRK-1042" },
                { label: "Confidence Score", value: "96.4%" },
              ].map(d => (
                <div key={d.label}>
                  <label className="block mb-1">{d.label}</label>
                  <span className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{d.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className="block mb-2">PPE Missing</label>
              <div className="flex gap-2">
                {["Hard Hat"].map(item => (
                  <span key={item} className="px-3 py-1 rounded-full text-[12px] uppercase" style={{ background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Event History</h2>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: '#E2E8E2' }} />
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4 mb-6 last:mb-0 relative">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0" style={{ background: event.color + '15' }}>
                    <event.icon className="w-4 h-4" style={{ color: event.color }} />
                  </div>
                  <div>
                    <div className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{event.action}</div>
                    <div className="text-[13px]" style={{ color: '#9CA3AF' }}>
                      {event.user} · {event.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-6">Comments & Notes</h2>
            <div className="space-y-4 mb-6">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1B5E20, #43A047)', fontWeight: 600 }}>
                    {c.initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>{c.name}</span>
                      <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{c.time}</span>
                    </div>
                    <p className="text-[14px]" style={{ color: '#4A5568' }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 h-10 px-4 rounded-lg border text-[14px] focus:outline-none transition-all"
                style={{ borderColor: '#E2E8E2' }}
                onFocus={(e) => { e.target.style.borderColor = '#2E7D32'; e.target.style.boxShadow = '0px 0px 0px 3px rgba(46,125,50,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2E8E2'; e.target.style.boxShadow = 'none'; }}
              />
              <button className="h-10 px-4 rounded-lg text-white text-[14px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 500 }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2>Evidence & Attachments</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8E2', color: '#4A5568', fontWeight: 500 }}>
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
            </div>
            <div className="space-y-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: '#EEF2EE' }}>
                  <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#2E7D32' }} />
                  <div className="flex-1">
                    <div className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{a.name}</div>
                    <div className="text-[12px]" style={{ color: '#9CA3AF' }}>{a.date} · {a.size}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - 35% */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h3 className="mb-4">Status Actions</h3>
            <div className="mb-4">
              <StatusBadge status="In Progress" />
            </div>
            <div className="space-y-2">
              <button className="w-full py-2 rounded-lg border text-[14px] transition-colors hover:bg-[#F4F7F4]" style={{ borderColor: '#E2E8E2', color: '#0A0A0A', fontWeight: 500 }}>
                Acknowledge
              </button>
              <button className="w-full py-2 rounded-lg border text-[14px] transition-colors hover:bg-[#F4F7F4]" style={{ borderColor: '#E2E8E2', color: '#0A0A0A', fontWeight: 500 }}>
                Mark In Progress
              </button>
              <button className="w-full py-2 rounded-lg text-white text-[14px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 500 }}>
                Close Violation
              </button>
              <button className="w-full py-2 rounded-lg border text-[14px] transition-colors hover:bg-gray-50" style={{ borderColor: '#E2E8E2', color: '#9CA3AF', fontWeight: 500 }}>
                False Positive
              </button>
              <button className="w-full py-2 rounded-lg text-[14px] text-[#DC2626] border transition-colors hover:bg-red-50" style={{ borderColor: '#FEE2E2', fontWeight: 500 }}>
                Reopen
              </button>
            </div>
          </div>

          {/* Assignment Card */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h3 className="mb-4">Assignment</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #43A047)', fontWeight: 600 }}>
                SC
              </div>
              <div>
                <div className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>Sarah Chen</div>
                <div className="text-[13px]" style={{ color: '#9CA3AF' }}>Safety Manager</div>
              </div>
            </div>
            <button className="w-full py-2 rounded-lg border text-[14px] transition-colors hover:bg-[#F4F7F4]" style={{ borderColor: '#E2E8E2', color: '#2E7D32', fontWeight: 500 }}>
              Reassign
            </button>
            <div className="mt-4">
              <label className="block mb-1.5">Due Date</label>
              <input
                type="date"
                defaultValue="2026-02-19"
                className="w-full h-10 px-3 rounded-lg border text-[14px]"
                style={{ borderColor: '#E2E8E2', color: '#0A0A0A' }}
              />
            </div>
          </div>

          {/* Resolution Form */}
          <div className="bg-white rounded-xl border p-6 relative overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)' }} />
            <h3 className="mb-4">Resolution</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5">Corrective Action Taken</label>
                <textarea
                  placeholder="Describe the corrective action..."
                  className="w-full h-24 px-3 py-2 rounded-lg border text-[14px] resize-none focus:outline-none"
                  style={{ borderColor: '#E2E8E2', color: '#0A0A0A' }}
                />
              </div>
              <div>
                <label className="block mb-1.5">Root Cause</label>
                <select className="w-full h-10 px-3 rounded-lg border text-[14px] bg-white" style={{ borderColor: '#E2E8E2', color: '#0A0A0A' }}>
                  <option>Select root cause...</option>
                  <option>Lack of Training</option>
                  <option>PPE Not Available</option>
                  <option>Worker Negligence</option>
                  <option>Equipment Malfunction</option>
                  <option>Inadequate Signage</option>
                </select>
              </div>
              <button className="w-full py-2.5 rounded-lg text-white text-[14px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
                Close Violation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
