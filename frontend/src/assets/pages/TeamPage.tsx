
import { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  Search,
  Mail,
  Pencil,
  Trash2,
  X,
  ShieldCheck,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./TeamPage.css";

type TeamRole = "Admin" | "Member" | "Viewer";
type TeamStatus = "Active" | "Pending" | "Inactive";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  department: string;
  status: TeamStatus;
  joinedAt: string;
};

const STORAGE_KEY = "intellmeet_team_members";

const emptyForm: {
  name: string;
  email: string;
  role: TeamRole;
  department: string;
  status: TeamStatus;
} = {
  name: "",
  email: "",
  role: "Member",
  department: "",
  status: "Active",
};

function loadMembers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (member): member is TeamMember =>
        member !== null &&
        typeof member === "object" &&
        typeof member.id === "string" &&
        typeof member.name === "string" &&
        typeof member.email === "string" &&
        typeof member.department === "string"
    );
  } catch (error) {
    console.error("Failed to load team members:", error);
    return [];
  }
}

function saveMembers(members: TeamMember[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));

    window.dispatchEvent(new Event("intellmeet_team_updated"));

    return true;
  } catch (error) {
    console.error("Failed to save team members:", error);
    return false;
  }
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(loadMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    function refreshMembers() {
      setMembers(loadMembers());
    }

    window.addEventListener("storage", refreshMembers);
    window.addEventListener("intellmeet_team_updated", refreshMembers);

    return () => {
      window.removeEventListener("storage", refreshMembers);
      window.removeEventListener("intellmeet_team_updated", refreshMembers);
    };
  }, []);

  const activeCount = members.filter(
    (member) => member.status === "Active"
  ).length;

  const pendingCount = members.filter(
    (member) => member.status === "Pending"
  ).length;

  const adminCount = members.filter(
    (member) => member.role === "Admin"
  ).length;

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch = [
        member.name,
        member.email,
        member.role,
        member.department,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesRole =
        roleFilter === "All" || member.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(member: TeamMember) {
    setEditingId(member.id);

    setForm({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      status: member.status,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const department = form.department.trim();

    setError("");
    setSuccess("");

    if (!name || !email || !department) {
      setError("Please complete all required fields.");
      return;
    }

    const duplicateEmail = members.some(
      (member) =>
        member.email.toLowerCase() === email &&
        member.id !== editingId
    );

    if (duplicateEmail) {
      setError("This email is already in your team.");
      return;
    }

    let updatedMembers: TeamMember[];

    if (editingId) {
      updatedMembers = members.map((member) =>
        member.id === editingId
          ? {
              ...member,
              name,
              email,
              department,
              role: form.role,
              status: form.status,
            }
          : member
      );
    } else {
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name,
        email,
        department,
        role: form.role,
        status: form.status,
        joinedAt: new Date().toISOString(),
      };

      updatedMembers = [newMember, ...members];
    }

    const saved = saveMembers(updatedMembers);

    if (!saved) {
      setError(
        "Could not save member. Check your browser storage settings."
      );
      return;
    }

    setMembers(updatedMembers);
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setSearch("");
    setRoleFilter("All");
    setStatusFilter("All");
    setSuccess(
      editingId
        ? "Team member updated successfully."
        : "Team member added successfully."
    );
  }

  function deleteMember(member: TeamMember) {
    const confirmed = window.confirm(
      `Remove ${member.name} from this team?`
    );

    if (!confirmed) return;

    const updatedMembers = members.filter(
      (item) => item.id !== member.id
    );

    const saved = saveMembers(updatedMembers);

    if (!saved) {
      setError("Could not remove the member. Please try again.");
      return;
    }

    setMembers(updatedMembers);
    setError("");
    setSuccess(`${member.name} was removed from the team.`);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  return (
    <section className="team-page">
      <SectionHeading
        eyebrow="PEOPLE & COLLABORATION"
        title="Team Members"
        subtitle="Build your team, manage responsibilities, and keep member details organized."
        action={
          <button
            type="button"
            className="team-primary-btn"
            onClick={openAddForm}
          >
            <UserPlus size={17} />
            Add team member
          </button>
        }
      />

      {success && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: 10,
            background: "#ecfdf5",
            color: "#047857",
            fontSize: 14,
          }}
        >
          {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="team-stats">
        <article className="team-stat-card">
          <span>Total members</span>
          <strong>{members.length}</strong>
          <small>Members saved in this browser</small>
        </article>

        <article className="team-stat-card">
          <span>Active members</span>
          <strong>{activeCount}</strong>
          <small>Currently marked active</small>
        </article>

        <article className="team-stat-card">
          <span>Pending members</span>
          <strong>{pendingCount}</strong>
          <small>Awaiting confirmation</small>
        </article>

        <article className="team-stat-card">
          <span>Administrators</span>
          <strong>{adminCount}</strong>
          <small>Assigned admin role</small>
        </article>
      </div>

      <div className="team-toolbar">
        <label className="team-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, department..."
            aria-label="Search team members"
          />
        </label>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Filter by role"
        >
          <option value="All">All roles</option>
          <option value="Admin">Admin</option>
          <option value="Member">Member</option>
          <option value="Viewer">Viewer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="team-list-panel">
        <div className="team-list-heading">
          <div>
            <h2>Your team</h2>
            <p>Manage the people working with you.</p>
          </div>

          <span>{filteredMembers.length} members</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="team-empty">
           

            <h3>
              {members.length === 0
                ? "Build your team"
                : "No matching members"}
            </h3>

            <p>
              {members.length === 0
                ? "Add your first team member to get started."
                : "Try a different search or filter."}
            </p>

            {members.length === 0 && (
              <button
                type="button"
                className="team-primary-btn"
                onClick={openAddForm}
              >
                <UserPlus size={17} />
                Add first member
              </button>
            )}
          </div>
        ) : (
          <div className="team-table-wrap">
            <table className="team-table">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>DEPARTMENT</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="team-member-cell">
                        <div className="team-avatar">
                          {initials(member.name) || (
                            <UserRound size={19} />
                          )}
                        </div>

                        <div className="team-member-info">
                          <strong>{member.name}</strong>
                          <span>
                            <Mail size={13} />
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="team-department">
                        <BriefcaseBusiness size={14} />
                        {member.department}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`team-role ${member.role.toLowerCase()}`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`team-status ${member.status.toLowerCase()}`}
                      >
                        <span />
                        {member.status}
                      </span>
                    </td>

                    <td>
                      <div className="team-actions">
                        <button
                          type="button"
                          className="team-icon-btn"
                          onClick={() => openEditForm(member)}
                          aria-label={`Edit ${member.name}`}
                          title="Edit member"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="team-icon-btn danger"
                          onClick={() => deleteMember(member)}
                          aria-label={`Delete ${member.name}`}
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="team-storage-note">
        <ShieldCheck size={15} />
        Team details are saved in this browser. Cross-device team
        synchronization and email invitations require a backend.
      </p>

      {showForm && (
        <div
          className="team-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <form className="team-form" onSubmit={handleSubmit}>
            <div className="team-form-heading">
              <div>
                <span>TEAM MANAGEMENT</span>
                <h2>
                  {editingId ? "Edit member" : "Add team member"}
                </h2>
                <p>Enter the details of your team member.</p>
              </div>

              <button
                type="button"
                className="team-close-btn"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="team-name">Full name *</label>
            <input
              id="team-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Enter full name"
              maxLength={80}
              autoFocus
              required
            />

            <label htmlFor="team-email">Email address *</label>
            <input
              id="team-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="name@company.com"
              maxLength={120}
              required
            />

            <label htmlFor="team-department">Department *</label>
            <input
              id="team-department"
              value={form.department}
              onChange={(event) =>
                setForm({ ...form, department: event.target.value })
              }
              placeholder="Engineering, Design, Marketing..."
              maxLength={80}
              required
            />

            <div className="team-form-row">
              <div>
                <label htmlFor="team-role">Role</label>
                <select
                  id="team-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      role: event.target.value as TeamRole,
                    })
                  }
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label htmlFor="team-status">Status</label>
                <select
                  id="team-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as TeamStatus,
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="team-form-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="team-primary-btn team-submit-btn"
            >
              {editingId ? (
                <Pencil size={17} />
              ) : (
                <UserPlus size={17} />
              )}

              {editingId ? "Save member changes" : "Add member"}
            </button>

            <p className="team-demo-note">
              This saves the member details in your current browser.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
