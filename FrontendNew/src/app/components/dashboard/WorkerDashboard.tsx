import { useState } from "react";
import { KpiCard } from "../shared/KpiCard";
import { SeverityBadge, StatusBadge } from "../shared/StatusBadge";
import { MapPin, ArrowRight, BookOpen, AlertCircle, HardHat, FileText, Bot } from "lucide-react";
import { useNavigate } from "react-router";

// Mock Data
const activeCerts = [
    { name: "Scaffolding Level 2", expiry: "Dec 2026", status: "Active" },
    { name: "First Aid & CPR", expiry: "Mar 15, 2026", status: "Due Soon" },
    { name: "Confined Space Entry", expiry: "Jan 2027", status: "Active" },
];

const assignedTasks = [
    { id: "T-501", desc: "Assist with Zone A guardrail repair", type: "Maintenance", due: "14:00 Today" },
];

const myReports = [
    { id: "REP-91", desc: "Loose cable near main walkway", status: "In Progress", date: "Yesterday" },
    { id: "REP-88", desc: "Spill in generator room", status: "Closed", date: "Feb 2" },
];

export function WorkerDashboard() {
    const navigate = useNavigate();
    const [loading] = useState(false);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Action Header for Worker - Prominent Reporting */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl border border-red-800 shadow-xl flex items-center justify-between">
                <div>
                    <h2 className="text-white text-[20px] font-bold mb-1">See Something, Say Something</h2>
                    <p className="text-red-100 text-[13px]">Your reports keep the site safe for everyone.</p>
                </div>
                <button className="bg-white text-red-700 font-bold px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-transform hover:scale-105 active:scale-95 shadow-lg">
                    <AlertCircle className="w-5 h-5" />
                    Report Hazard / Near Miss
                </button>
            </div>

            {/* Daily Safety Brief / Nudge */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
                <div className="bg-blue-100 p-3 rounded-full text-blue-700 flex-shrink-0">
                    <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="text-blue-900 font-bold text-[15px] mb-1">Daily Safety Brief: Zone C</h3>
                    <p className="text-blue-800 text-[13px] leading-relaxed mb-3">
                        You are scheduled to work in Zone C today. Be aware: High winds are expected this afternoon. Ensure all tools are tethered and do not work above 10ft without a dual-lanyard harness.
                    </p>
                    <button className="bg-blue-600 text-white text-[12px] font-bold px-4 py-1.5 rounded-md hover:bg-blue-700 transition">
                        Acknowledge & Sign
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Digital Passport / Certs */}
                <div className="bg-white rounded-xl border p-6 flex flex-col" style={{ borderColor: '#E5EDFF', boxShadow: '0px 2px 12px rgba(11, 61, 145, 0.10)' }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="flex items-center gap-2 text-gray-900 font-bold text-[16px]">
                            <HardHat className="w-5 h-5 text-[#1D4ED8]" /> My Safety Passport
                        </h2>
                        <button className="text-[12px] font-semibold text-[#1D4ED8] hover:underline">
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {activeCerts.map((cert) => (
                            <div key={cert.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                                <div>
                                    <div className="text-[13px] font-bold text-gray-800">{cert.name}</div>
                                    <div className="text-[11px] text-gray-500 mt-0.5">Expires: {cert.expiry}</div>
                                </div>
                                <StatusBadge status={cert.status} size="sm" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 p-3 rounded-lg bg-orange-50 border border-orange-200 flex gap-3 text-orange-800 text-[12px]">
                        <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>You have 1 mandatory training module due next week: "Advanced Fire Prevention".</span>
                    </div>
                </div>

                <div className="space-y-6 flex flex-col">
                    {/* Today's Tasks & Permits */}
                    <div className="bg-white rounded-xl border p-6 flex-1" style={{ borderColor: '#E5EDFF', boxShadow: '0px 2px 12px rgba(11, 61, 145, 0.10)' }}>
                        <h2 className="text-gray-900 font-bold text-[16px] mb-4">Today's Assignments</h2>
                        {assignedTasks.map(task => (
                            <div key={task.id} className="p-3 border-l-4 border-[#1D4ED8] bg-[#F3F7FF] rounded-r-lg mb-3">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[13px] font-bold text-[#0B3D91]">{task.id}</span>
                                    <span className="text-[11px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">{task.due}</span>
                                </div>
                                <div className="text-[13px] text-gray-800">{task.desc}</div>
                                <div className="mt-2 text-[11px] text-gray-500 uppercase tracking-wide font-semibold">{task.type}</div>
                            </div>
                        ))}
                    </div>

                    {/* My Report Status */}
                    <div className="bg-white rounded-xl border p-6 flex-1" style={{ borderColor: '#E5EDFF', boxShadow: '0px 2px 12px rgba(11, 61, 145, 0.10)' }}>
                        <h2 className="text-gray-900 font-bold text-[16px] mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> My Reports
                        </h2>
                        <div className="space-y-3">
                            {myReports.map(report => (
                                <div key={report.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 border-gray-100">
                                    <div className="min-w-0 pr-4">
                                        <p className="text-[13px] text-gray-800 truncate font-medium">{report.desc}</p>
                                        <p className="text-[11px] text-gray-500">{report.date}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <StatusBadge status={report.status} size="sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
