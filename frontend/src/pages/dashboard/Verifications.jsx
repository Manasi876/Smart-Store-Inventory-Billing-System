import { useEffect, useState } from "react";
import { UserCircle, FileText, Check, X, UserMinus } from "lucide-react";
import { getPendingVerifications, reviewVerification } from "../../api/user.api.js";

const Verifications = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actingOn, setActingOn] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await getPendingVerifications();
            setRequests(data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Verification requests could not be loaded");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleDecision = async (userId, decision, label) => {
        if (decision === "reject" && !window.confirm("Reject and permanently delete this employee? This cannot be undone.")) return;
        setActingOn(userId);
        try {
            await reviewVerification(userId, decision);
            setRequests((prev) => prev.filter((item) => item._id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || `${label} failed`);
        } finally {
            setActingOn(null);
        }
    };

    return (
        <div>
            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900">Staff Verification Requests</h2><p className="text-sm text-slate-500 mt-1">Review employees who submitted identity documents for staff verification</p></div>
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            {loading ? <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">Loading...</div> : requests.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">No pending verification requests</div> : (
                <div className="space-y-4">
                    {requests.map((reqUser) => (
                        <div key={reqUser._id} className="bg-white border border-slate-200 rounded-2xl p-6">
                            <div className="flex items-start justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    {reqUser.avatar ? <img src={reqUser.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-slate-400"><UserCircle size={28} /></div>}
                                    <div><p className="font-bold text-slate-900">{reqUser.fullName}</p><p className="text-sm text-slate-500">{reqUser.email} · {reqUser.mobile}</p><p className="text-xs text-slate-400 mt-0.5">@{reqUser.username}</p></div>
                                </div>
                                <div className="flex gap-2">
                                    <a href={reqUser.aadharCard} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-100 bg-brand-50 px-3 py-2 rounded-lg"><FileText size={14} />Aadhar</a>
                                    <a href={reqUser.panCard} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 border border-brand-100 bg-brand-50 px-3 py-2 rounded-lg"><FileText size={14} />PAN</a>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-100 flex-wrap">
                                <button disabled={actingOn === reqUser._id} onClick={() => handleDecision(reqUser._id, "approve", "Approve")} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg"><Check size={14} />Accept as Staff</button>
                                <button disabled={actingOn === reqUser._id} onClick={() => handleDecision(reqUser._id, "keep", "Keep as Employee")} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg"><UserMinus size={14} />Keep as Employee</button>
                                <button disabled={actingOn === reqUser._id} onClick={() => handleDecision(reqUser._id, "reject", "Reject")} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-xs font-semibold px-4 py-2 rounded-lg ml-auto"><X size={14} />Reject & Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Verifications;
