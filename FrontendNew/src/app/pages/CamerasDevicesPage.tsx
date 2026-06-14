import { useState } from "react";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Plus, Camera, Wifi, Cpu, AlertTriangle } from "lucide-react";

const cameras = [
  { id: "CAM-001", name: "Main Hall Entry", zone: "Zone A", site: "Plant Alpha", ip: "192.168.1.101", protocol: "RTSP", installed: "2025-06-12", status: "Active" },
  { id: "CAM-002", name: "Loading Dock South", zone: "Zone B", site: "Plant Alpha", ip: "192.168.1.102", protocol: "RTSP", installed: "2025-06-12", status: "Active" },
  { id: "CAM-003", name: "Chemical Store A", zone: "Zone C", site: "Plant Alpha", ip: "192.168.1.103", protocol: "ONVIF", installed: "2025-07-03", status: "Active" },
  { id: "CAM-004", name: "Assembly Line 1", zone: "Zone D", site: "Plant Alpha", ip: "192.168.1.104", protocol: "RTSP", installed: "2025-07-03", status: "Inactive" },
  { id: "CAM-005", name: "Welding Bay", zone: "Zone E", site: "Plant Beta", ip: "192.168.2.101", protocol: "ONVIF", installed: "2025-08-15", status: "Active" },
  { id: "CAM-006", name: "Office Entrance", zone: "Zone F", site: "Plant Beta", ip: "192.168.2.102", protocol: "RTSP", installed: "2025-08-15", status: "Offline" },
];

const rfidReaders = [
  { id: "RFID-001", gate: "Main Gate A", zone: "Zone A", lastSeen: "2 min ago", status: "Active" },
  { id: "RFID-002", gate: "Loading Bay Gate", zone: "Zone B", lastSeen: "1 min ago", status: "Active" },
  { id: "RFID-003", gate: "Chemical Gate", zone: "Zone C", lastSeen: "5 min ago", status: "Active" },
  { id: "RFID-004", gate: "Emergency Exit", zone: "Zone D", lastSeen: "30 min ago", status: "Offline" },
];

const accessLog = [
  { worker: "WRK-1042", gate: "Main Gate A", entry: "Entry", time: "09:15 AM", result: "Allowed" },
  { worker: "WRK-0891", gate: "Loading Bay Gate", entry: "Entry", time: "09:12 AM", result: "Allowed" },
  { worker: "WRK-0334", gate: "Chemical Gate", entry: "Entry", time: "09:10 AM", result: "Denied" },
  { worker: "WRK-0723", gate: "Main Gate A", entry: "Exit", time: "08:55 AM", result: "Allowed" },
  { worker: "WRK-1201", gate: "Loading Bay Gate", entry: "Entry", time: "08:45 AM", result: "Allowed" },
];

const edgeDevices = [
  { id: "EDG-001", name: "Edge Server Alpha-1", type: "GPU Server", site: "Plant Alpha", zone: "Server Room", firmware: "3.2.1", ai: "v2.5", lastSeen: "1 min ago", status: "Online" },
  { id: "EDG-002", name: "Edge Server Alpha-2", type: "GPU Server", site: "Plant Alpha", zone: "Server Room", firmware: "3.1.0", ai: "v2.5", lastSeen: "1 min ago", status: "Online" },
  { id: "EDG-003", name: "Edge Server Beta-1", type: "GPU Server", site: "Plant Beta", zone: "IT Room", firmware: "3.2.1", ai: "v2.4", lastSeen: "3 min ago", status: "Online" },
  { id: "EDG-004", name: "Edge Module C-1", type: "Jetson Nano", site: "Plant Alpha", zone: "Zone C", firmware: "2.8.0", ai: "v2.3", lastSeen: "15 min ago", status: "Offline" },
];

export function CamerasDevicesPage() {
  const [activeTab, setActiveTab] = useState("cameras");

  const tabs = [
    { id: "cameras", label: "Cameras", icon: Camera },
    { id: "rfid", label: "RFID & Gates", icon: Wifi },
    { id: "edge", label: "Edge Devices", icon: Cpu },
  ];

  const cameraStats = {
    total: cameras.length,
    active: cameras.filter(c => c.status === "Active").length,
    inactive: cameras.filter(c => c.status === "Inactive").length,
    offline: cameras.filter(c => c.status === "Offline").length,
  };

  return (
    <div className="space-y-6">
      <h1>Cameras & Devices</h1>

      <div className="flex gap-1 border-b" style={{ borderColor: '#E2E8E2' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors relative"
            style={{ color: activeTab === tab.id ? '#1B5E20' : '#4A5568', fontWeight: activeTab === tab.id ? 600 : 400 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)' }} />}
          </button>
        ))}
      </div>

      {activeTab === "cameras" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {[
                { label: "Total", value: cameraStats.total, color: "#1B5E20" },
                { label: "Active", value: cameraStats.active, color: "#2E7D32" },
                { label: "Inactive", value: cameraStats.inactive, color: "#9CA3AF" },
                { label: "Offline", value: cameraStats.offline, color: "#DC2626" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: '#F4F7F4' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-[12px]" style={{ color: '#4A5568' }}>{s.label}: <span style={{ fontWeight: 600 }}>{s.value}</span></span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px]" style={{ background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', fontWeight: 600 }}>
              <Plus className="w-4 h-4" /> Add Camera
            </button>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["Camera ID", "Name", "Zone", "Site", "IP Address", "Protocol", "Installed", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cameras.map(c => (
                  <tr key={c.id} className="group hover:bg-[#F9FBF9] transition-colors" style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{c.id}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{c.name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.zone}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.site}</td>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: '#4A5568' }}>{c.ip}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.protocol}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{c.installed}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} size="sm" /></td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500, cursor: 'pointer' }}>Configure</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "rfid" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-4">RFID Readers</h2>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["Reader ID", "Gate Name", "Zone", "Last Seen", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfidReaders.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{r.id}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{r.gate}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{r.zone}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{r.lastSeen}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <h2 className="mb-4">Worker Access Log</h2>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["Worker ID", "Gate", "Entry Type", "Timestamp", "Access Result"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accessLog.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{a.worker}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{a.gate}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{a.entry}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{a.time}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.result} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { gate: "Main Gate A", entries: 124, exits: 89 },
              { gate: "Loading Bay Gate", entries: 67, exits: 45 },
              { gate: "Chemical Gate", entries: 23, exits: 18 },
              { gate: "Emergency Exit", entries: 0, exits: 3 },
            ].map(g => (
              <div key={g.gate} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
                <div className="text-[13px] mb-3" style={{ color: '#0A0A0A', fontWeight: 500 }}>{g.gate}</div>
                <div className="flex gap-4">
                  <div>
                    <div className="text-[11px] uppercase" style={{ color: '#9CA3AF' }}>Entries</div>
                    <div className="text-[20px]" style={{ color: '#2E7D32', fontFamily: 'DM Sans', fontWeight: 700 }}>{g.entries}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase" style={{ color: '#9CA3AF' }}>Exits</div>
                    <div className="text-[20px]" style={{ color: '#4A5568', fontFamily: 'DM Sans', fontWeight: 700 }}>{g.exits}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "edge" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {[
                { label: "Total", value: edgeDevices.length },
                { label: "Online", value: edgeDevices.filter(d => d.status === "Online").length, color: "#2E7D32" },
                { label: "Offline", value: edgeDevices.filter(d => d.status === "Offline").length, color: "#DC2626" },
                { label: "Firmware Outdated", value: 2, color: "#F59E0B" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: '#F4F7F4' }}>
                  {s.color && <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />}
                  <span className="text-[12px]" style={{ color: '#4A5568' }}>{s.label}: <span style={{ fontWeight: 600 }}>{s.value}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E8EFE8', boxShadow: '0px 2px 12px rgba(27, 94, 32, 0.08)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F4F7F4' }}>
                  {["Device ID", "Name", "Type", "Site", "Zone", "Firmware", "AI Model", "Last Seen", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">
                      <span className="text-[11px] uppercase tracking-[0.5px]" style={{ color: '#9CA3AF', fontWeight: 600 }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {edgeDevices.map(d => (
                  <tr key={d.id} className="hover:bg-[#F9FBF9] transition-colors" style={{ borderBottom: '1px solid #EEF2EE', background: d.firmware !== "3.2.1" ? '#FFFBEB' : 'transparent' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{d.id}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{d.name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.type}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.site}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.zone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px]" style={{ color: '#0A0A0A' }}>{d.firmware}</span>
                        {d.firmware !== "3.2.1" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                            Update Available
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.ai}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{d.lastSeen}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
