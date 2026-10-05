import { useEffect, useState } from "react";
import { UserCircle, Upload, Clock, CheckCircle2, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyProfile, submitVerificationDocuments, updateMyAvatar } from "../../api/user.api.js";

const InfoItem = ({ label, value }) => (
    <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-900 mt-1 break-words">{value || "Not provided"}</p>
    </div>
);

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [aadharFile, setAadharFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const isEmployee = user?.role === "employee";
    const status = user?.verificationStatus;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await getMyProfile();
                updateUser(data.data);
                setAvatarPreview(data.data.avatar || "");
            } catch (err) {
                setError(err.response?.data?.message || "Profile could not be loaded");
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("avatar", avatarFile);
            const { data } = await updateMyAvatar(formData);
            updateUser(data.data);
            setAvatarPreview(data.data.avatar || "");
            setAvatarFile(null);
        } catch (err) {
            setError(err.response?.data?.message || "Avatar could not be updated");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!aadharFile || !panFile) {
            setError("Both Aadhar card and PAN card files are required");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("aadharCard", aadharFile);
            formData.append("panCard", panFile);
            const { data } = await submitVerificationDocuments(formData);
            updateUser(data.data);
            setAadharFile(null);
            setPanFile(null);
        } catch (err) {
            setError(err.response?.data?.message || "Documents could not be submitted");
        } finally {
            setSaving(false);
        }
    };

    if (loadingProfile) return <div className="text-sm text-slate-500">Loading profile...</div>;

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
                <p className="text-sm text-slate-500 mt-1">View your account and verification information</p>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Profile avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 border-4 border-slate-100"><UserCircle size={46} /></div>
                        )}
                        <label htmlFor="profile-avatar" className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center cursor-pointer shadow-sm" title="Change avatar"><Upload size={14} /></label>
                        <input id="profile-avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{user?.fullName}</h3>
                        <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
                        <span className="inline-flex mt-3 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold capitalize">{user?.role}</span>
                    </div>
                    {avatarFile && <button onClick={handleAvatarUpload} disabled={saving} className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">{saving ? "Uploading..." : "Save Avatar"}</button>}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoItem label="Full Name" value={user?.fullName} />
                    <InfoItem label="Mobile Number" value={user?.mobile} />
                    <InfoItem label="Email" value={user?.email} />
                    <InfoItem label="Username" value={user?.username} />
                    <InfoItem label="Role" value={user?.role} />
                    <InfoItem label="Verification Status" value={user?.verificationStatus?.replace("_", " ")} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Identity Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between"><div><p className="text-xs text-slate-400 uppercase font-semibold">Aadhar Card</p><p className="text-sm text-slate-600 mt-1">{user?.aadharCard ? "Document uploaded" : "Not submitted"}</p></div>{user?.aadharCard && <a href={user.aadharCard} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-brand-600"><FileText size={14} /> View</a>}</div>
                    <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between"><div><p className="text-xs text-slate-400 uppercase font-semibold">PAN Card</p><p className="text-sm text-slate-600 mt-1">{user?.panCard ? "Document uploaded" : "Not submitted"}</p></div>{user?.panCard && <a href={user.panCard} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-brand-600"><FileText size={14} /> View</a>}</div>
                </div>
            </div>

            {isEmployee && status === "pending" && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-3"><Clock size={20} className="text-amber-500 shrink-0 mt-0.5" /><div><p className="font-semibold text-amber-700 text-sm">Verification pending</p><p className="text-sm text-amber-600 mt-1">Your documents have been submitted for admin review.</p></div></div>
            )}

            {isEmployee && status !== "pending" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Staff Verification</h3>
                    <p className="text-xs text-slate-500 mb-4">Upload both documents to submit your staff verification request.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Aadhar Card</label><input type="file" accept="image/*,.pdf" onChange={(e) => setAadharFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-600" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">PAN Card</label><input type="file" accept="image/*,.pdf" onChange={(e) => setPanFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-600" /></div>
                        <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5"><Upload size={15} />{saving ? "Submitting..." : "Submit for Verification"}</button>
                    </form>
                </div>
            )}

            {!isEmployee && <div className="bg-green-50 border border-green-100 rounded-2xl p-6 flex items-start gap-3"><CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" /><p className="text-sm text-green-700">Your account is verified — role: <span className="font-semibold capitalize">{user?.role}</span></p></div>}
        </div>
    );
};

export default Profile;
