import { useEffect, useState } from "react";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Plus, Camera, Wifi, Cpu } from "lucide-react";
import {
  getCameras, getRFIDReaders, getEdgeDevices, getAccessLog, getGateStats,
  type WorkerAccessLogRow, type GateStatsRow,
} from "../../services/infrastructure.service";
import type { Camera as CameraRow, RFIDReader, EdgeDevice } from "../../types";

export function CamerasDevicesPage() {
  const [activeTab, setActiveTab] = useState("cameras");
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [rfidReaders, setRfidReaders] = useState<RFIDReader[]>([]);
  const [accessLog, setAccessLog] = useState<WorkerAccessLogRow[]>([]);
  const [gateStats, setGateStats] = useState<GateStatsRow[]>([]);
  const [edgeDevices, setEdgeDevices] = useState<EdgeDevice[]>([]);

  useEffect(() => {
    getCameras().then(setCameras).catch(() => setCameras([]));
    getRFIDReaders().then(setRfidReaders).catch(() => setRfidReaders([]));
    getAccessLog().then(setAccessLog).catch(() => setAccessLog([]));
    getGateStats().then(setGateStats).catch(() => setGateStats([]));
    getEdgeDevices().then(setEdgeDevices).catch(() => setEdgeDevices([]));
  }, []);

  const tabs = [
    { id: "cameras", label: "Cameras", icon: Camera },
    { id: "rfid", label: "RFID & Gates", icon: Wifi },
    { id: "edge", label: "Edge Devices", icon: Cpu },
  ];

  const cameraStats = {
    total: cameras.length,
    active: cameras.filter(c => c.Status === "Active").length,
    inactive: cameras.filter(c => c.Status === "Inactive").length,
    offline: cameras.filter(c => c.Status === "Offline").length,
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
                  <tr key={c.Camera_ID} className="group hover:bg-[#F9FBF9] transition-colors" style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{c.Camera_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{c.Camera_Name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.Zone_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.Site_ID}</td>
                    <td className="px-4 py-3 text-[13px] font-mono" style={{ color: '#4A5568' }}>{c.IP_Address}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{c.Protocol}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{c.Installed_Date}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.Status} size="sm" /></td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500, cursor: 'pointer' }}>Configure</td>
                  </tr>
                ))}
                {cameras.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>No cameras registered yet</td></tr>
                )}
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
                  <tr key={r.RFID_ID} style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{r.RFID_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{r.Gate_Name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{r.Zone_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{r.Last_Seen || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.Status} size="sm" /></td>
                  </tr>
                ))}
                {rfidReaders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>No RFID readers registered yet</td></tr>
                )}
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
                {accessLog.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>No access log entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {gateStats.map(g => (
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
                { label: "Online", value: edgeDevices.filter(d => d.Status === "Online").length, color: "#2E7D32" },
                { label: "Offline", value: edgeDevices.filter(d => d.Status === "Offline").length, color: "#DC2626" },
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
                  <tr key={d.Device_ID} className="hover:bg-[#F9FBF9] transition-colors" style={{ borderBottom: '1px solid #EEF2EE' }}>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#2E7D32', fontWeight: 500 }}>{d.Device_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{d.Device_Name}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.Device_Type}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.Site_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.Zone_ID}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#0A0A0A' }}>{d.Firmware_Version}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#4A5568' }}>{d.AI_Model_Version}</td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#9CA3AF' }}>{d.Last_Seen || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.Status} size="sm" /></td>
                  </tr>
                ))}
                {edgeDevices.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>No edge devices registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
