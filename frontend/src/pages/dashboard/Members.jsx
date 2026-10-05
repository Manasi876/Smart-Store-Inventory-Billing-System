import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    FileText,
    UserCircle,
    Mail,
    Phone,
    ShieldCheck,
} from "lucide-react";

import {
    deleteMember,
    getMemberById,
    getMembers,
    assignManagerRole,
    removeManagerRole,
} from "../../api/user.api.js";
import SearchBar from "../../components/SearchBar.jsx";

const roleStyles = {
    admin: "bg-red-50 text-red-700",
    manager: "bg-purple-50 text-purple-700",
    staff: "bg-blue-50 text-blue-700",
    cashier: "bg-amber-50 text-amber-700",
    employee: "bg-slate-100 text-slate-700",
};

const Members = () => {
    const [members, setMembers] = useState([]);
    const [changingRole, setChangingRole] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredMembers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return members;
        return members.filter(
            (member) =>
                member.fullName?.toLowerCase().includes(term) ||
                member.username?.toLowerCase().includes(term) ||
                member.email?.toLowerCase().includes(term) ||
                member.mobile?.toLowerCase().includes(term) ||
                member.role?.toLowerCase().includes(term),
        );
    }, [members, searchTerm]);

    // =========================
    // LOAD ALL MEMBERS
    // =========================
    const loadMembers = async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await getMembers();
            setMembers(data.data);
        } catch (err) {
            setError(
                err.response?.data?.message || "Members could not be loaded",
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LOAD MEMBER DETAILS
    // =========================
    const openMember = async (userId) => {
        setError("");

        try {
            const { data } = await getMemberById(userId);
            setSelectedMember(data.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Member details could not be loaded",
            );
        }
    };

    // =========================
    // MAKE STAFF/CASHIER MANAGER
    // =========================
    const handleMakeManager = async (member) => {
        if (!member?.username) {
            setError("Username not found");
            return;
        }

        if (member.role === "manager") {
            setError("This member is already a Manager");
            return;
        }

        if (member.role !== "staff" && member.role !== "cashier") {
            setError("Only Staff or Cashier can be promoted to Manager");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to make ${member.fullName} a Manager?`,
        );

        if (!confirmed) return;

        setPromoting(true);
        setError("");

        try {
            await assignManagerRole(member.username);

            // Refresh member list
            const membersResponse = await getMembers();
            setMembers(membersResponse.data.data);

            // Refresh selected member details
            const memberResponse = await getMemberById(member._id);

            setSelectedMember(memberResponse.data.data);
        } catch (err) {
            console.error("Failed to promote member:", err);

            setError(err.response?.data?.message || "Failed to promote member");
        } finally {
            setPromoting(false);
        }
    };

    const handleRemoveManager = async (member) => {
        if (!member?.username) {
            setError("Username not found");
            return;
        }

        if (member.role !== "manager") {
            setError("This member is not a Manager");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to remove the Manager role from ${member.fullName}? This member will become Staff.`,
        );

        if (!confirmed) return;

        setChangingRole(true);
        setError("");

        try {
            await removeManagerRole(member.username);

            const membersResponse = await getMembers();
            setMembers(membersResponse.data.data);

            const memberResponse = await getMemberById(member._id);

            setSelectedMember(memberResponse.data.data);
        } catch (err) {
            console.error("Failed to remove manager role:", err);

            setError(
                err.response?.data?.message || "Failed to remove manager role",
            );
        } finally {
            setChangingRole(false);
        }
    };

    // =========================
    // DELETE MEMBER
    // =========================
    const handleDelete = async () => {
        if (!selectedMember) return;

        const confirmed = window.confirm(
            `Permanently delete ${selectedMember.fullName}? This action cannot be undone.`,
        );

        if (!confirmed) return;

        setDeleting(true);
        setError("");

        try {
            await deleteMember(selectedMember._id);

            setMembers((prev) =>
                prev.filter((member) => member._id !== selectedMember._id),
            );

            setSelectedMember(null);
        } catch (err) {
            setError(
                err.response?.data?.message || "Member could not be deleted",
            );
        } finally {
            setDeleting(false);
        }
    };

    // =========================
    // INITIAL LOAD
    // =========================
    useEffect(() => {
        loadMembers();
    }, []);

    // =========================
    // MEMBER DETAILS PAGE
    // =========================
    if (selectedMember) {
        return (
            <div className="max-w-4xl">
                {/* Back Button */}
                <button
                    onClick={() => {
                        setSelectedMember(null);
                        setError("");
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 mb-5"
                >
                    <ArrowLeft size={16} />
                    Back to All Members
                </button>

                {/* Error */}
                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    {/* PROFILE HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-100">
                        {/* Avatar */}
                        {selectedMember.avatar ? (
                            <img
                                src={selectedMember.avatar}
                                alt={selectedMember.fullName}
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                                <UserCircle size={48} />
                            </div>
                        )}

                        {/* Name + Role */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {selectedMember.fullName}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                                @{selectedMember.username}
                            </p>

                            <span
                                className={`inline-flex mt-3 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                    roleStyles[selectedMember.role] ||
                                    "bg-slate-100 text-slate-700"
                                }`}
                            >
                                {selectedMember.role}
                            </span>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0">
                            {/* Make Manager */}
                            {(selectedMember.role === "staff" ||
                                selectedMember.role === "cashier") && (
                                <button
                                    onClick={() =>
                                        handleMakeManager(selectedMember)
                                    }
                                    disabled={promoting || changingRole}
                                    className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {promoting
                                        ? "Promoting..."
                                        : "Make Manager"}
                                </button>
                            )}

                            {/* Remove Manager Role */}
                            {selectedMember.role === "manager" && (
                                <button
                                    onClick={() =>
                                        handleRemoveManager(selectedMember)
                                    }
                                    disabled={changingRole || promoting}
                                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {changingRole
                                        ? "Removing..."
                                        : "Remove Manager Role"}
                                </button>
                            )}

                            {/* Delete Member */}
                            {selectedMember.role !== "admin" && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting || changingRole}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                    {deleting ? "Deleting..." : "Delete Member"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* MEMBER INFORMATION */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                        {/* Full Name */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Full Name
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                                {selectedMember.fullName}
                            </p>
                        </div>

                        {/* Email */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Email
                            </p>

                            <p className="font-semibold text-slate-900 mt-1 break-all">
                                {selectedMember.email}
                            </p>
                        </div>

                        {/* Mobile */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Mobile
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                                {selectedMember.mobile || "Not provided"}
                            </p>
                        </div>

                        {/* Role */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Role
                            </p>

                            <p className="font-semibold text-slate-900 mt-1 capitalize">
                                {selectedMember.role}
                            </p>
                        </div>

                        {/* Verification */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Verification
                            </p>

                            <p className="font-semibold text-slate-900 mt-1 capitalize">
                                {selectedMember.verificationStatus?.replace(
                                    "_",
                                    " ",
                                ) || "Not submitted"}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs text-slate-400 uppercase font-semibold">
                                Status
                            </p>

                            <p className="font-semibold text-slate-900 mt-1">
                                {selectedMember.isActive
                                    ? "Active"
                                    : "Inactive"}
                            </p>
                        </div>
                    </div>

                    {/* IDENTITY DOCUMENTS */}
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-800 mb-3">
                            Identity Documents
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Aadhar */}
                            <a
                                href={selectedMember.aadharCard || "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                    if (!selectedMember.aadharCard) {
                                        e.preventDefault();
                                    }
                                }}
                                className="rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-brand-200 transition-colors"
                            >
                                <FileText
                                    size={18}
                                    className="text-brand-600"
                                />

                                {selectedMember.aadharCard
                                    ? "View Aadhar Card"
                                    : "Aadhar Card Not Submitted"}
                            </a>

                            {/* PAN */}
                            <a
                                href={selectedMember.panCard || "#"}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                    if (!selectedMember.panCard) {
                                        e.preventDefault();
                                    }
                                }}
                                className="rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-sm font-semibold text-slate-700 hover:border-brand-200 transition-colors"
                            >
                                <FileText
                                    size={18}
                                    className="text-brand-600"
                                />

                                {selectedMember.panCard
                                    ? "View PAN Card"
                                    : "PAN Card Not Submitted"}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =========================
    // ALL MEMBERS PAGE
    // =========================
    return (
        <div>
            {/* PAGE HEADER */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        All Members
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        View manager, staff, cashier, and employee accounts
                    </p>
                </div>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name, username, email, mobile..."
                />
            </div>

            {/* ERROR */}
            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            {/* LOADING */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
                    Loading members...
                </div>
            ) : filteredMembers.length === 0 ? (
                /* EMPTY */
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
                    {searchTerm ? "No members match your search" : "No members found"}
                </div>
            ) : (
                /* MEMBERS GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMembers.map((member) => (
                        <button
                            key={member._id}
                            onClick={() => openMember(member._id)}
                            className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-200 hover:shadow-sm transition-all"
                        >
                            {/* Member Header */}
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.fullName}
                                        className="w-14 h-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                                        <UserCircle size={28} />
                                    </div>
                                )}

                                {/* Name + Role */}
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 truncate">
                                        {member.fullName}
                                    </p>

                                    <span
                                        className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                                            roleStyles[member.role] ||
                                            "bg-slate-100 text-slate-700"
                                        }`}
                                    >
                                        {member.role}
                                    </span>
                                </div>
                            </div>

                            {/* Member Information */}
                            <div className="mt-4 space-y-2 text-xs text-slate-500">
                                <p className="flex items-center gap-2">
                                    <Mail size={14} />
                                    <span className="truncate">
                                        {member.email}
                                    </span>
                                </p>

                                <p className="flex items-center gap-2">
                                    <Phone size={14} />
                                    {member.mobile || "Not provided"}
                                </p>

                                <p className="flex items-center gap-2 capitalize">
                                    <ShieldCheck size={14} />

                                    {member.verificationStatus?.replace(
                                        "_",
                                        " ",
                                    ) || "Not submitted"}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Members;