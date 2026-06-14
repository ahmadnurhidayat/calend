'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Team {
    id: string;
    name: string;
    slug: string;
    role: string;
    created_at: string;
}

interface TeamMember {
    id: string;
    role: string;
    user_id: string;
    users: {
        id: string;
        email: string;
        name: string | null;
        username: string | null;
    };
}

export default function TeamsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamSlug, setNewTeamSlug] = useState('');
    const [editTeamName, setEditTeamName] = useState('');
    const [editTeamSlug, setEditTeamSlug] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchTeams = useCallback(async () => {
        try {
            const res = await fetch('/api/teams');
            const data = await res.json() as { teams?: Team[] };
            if (data.teams) {
                setTeams(data.teams);
            }
        } catch {
            console.error('Failed to fetch teams');
        }
    }, []);

    const fetchMembers = useCallback(async (teamId: string) => {
        try {
            const res = await fetch(`/api/teams/members?team_id=${teamId}`);
            const data = await res.json() as { members?: TeamMember[]; currentUserRole?: string };
            if (data.members) {
                setMembers(data.members);
                setCurrentUserRole(data.currentUserRole || '');
            }
        } catch {
            console.error('Failed to fetch members');
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (session) {
            fetchTeams();
        }
    }, [session, status, router, fetchTeams]);

    useEffect(() => {
        if (selectedTeam) {
            fetchMembers(selectedTeam.id);
        }
    }, [selectedTeam, fetchMembers]);

    const createTeam = async () => {
        if (!newTeamName || !newTeamSlug) {
            setError('Name and slug are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTeamName, slug: newTeamSlug }),
            });

            const data = await res.json() as { team?: Team; error?: string };

            if (!res.ok) {
                setError(data.error || 'Failed to create team');
                return;
            }

            if (data.team) {
                setTeams([...teams, data.team]);
            }
            setShowCreateModal(false);
            setNewTeamName('');
            setNewTeamSlug('');
        } catch {
            setError('Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    const updateTeam = async () => {
        if (!selectedTeam || !editTeamName || !editTeamSlug) {
            setError('Name and slug are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/teams', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedTeam.id, name: editTeamName, slug: editTeamSlug }),
            });

            const data = await res.json() as { team?: Team; error?: string };

            if (!res.ok) {
                setError(data.error || 'Failed to update team');
                return;
            }

            if (data.team) {
                setTeams(teams.map(t => t.id === selectedTeam.id ? { ...t, name: editTeamName, slug: editTeamSlug } : t));
                setSelectedTeam({ ...selectedTeam, name: editTeamName, slug: editTeamSlug });
            }
            setShowEditModal(false);
        } catch {
            setError('Failed to update team');
        } finally {
            setLoading(false);
        }
    };

    const deleteTeam = async () => {
        if (!selectedTeam) return;
        if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/teams', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedTeam.id }),
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                setError(data.error || 'Failed to delete team');
                return;
            }

            setTeams(teams.filter(t => t.id !== selectedTeam.id));
            setSelectedTeam(null);
        } catch {
            setError('Failed to delete team');
        } finally {
            setLoading(false);
        }
    };

    const addMember = async () => {
        if (!newMemberEmail || !selectedTeam) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/teams/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_id: selectedTeam.id, email: newMemberEmail }),
            });

            const data = await res.json() as { member?: TeamMember; error?: string };

            if (!res.ok) {
                setError(data.error || 'Failed to add member');
                return;
            }

            if (data.member) {
                setMembers([...members, data.member]);
            }
            setShowAddMemberModal(false);
            setNewMemberEmail('');
        } catch {
            setError('Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!selectedTeam) return;

        try {
            const res = await fetch(`/api/teams/members?id=${memberId}&team_id=${selectedTeam.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json() as { error?: string };
                setError(data.error || 'Failed to remove member');
                return;
            }

            setMembers(members.filter(m => m.id !== memberId));
        } catch {
            setError('Failed to remove member');
        }
    };

    if (status === 'loading') {
        return <div className="flex-1 flex items-center justify-center text-muted">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Teams</h1>
                        <p className="text-muted mt-1">Manage your teams and members</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        Create Team
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team List */}
                    <div className="lg:col-span-1">
                        <div className="glass-card">
                            <div className="p-4 border-b border-border">
                                <h2 className="font-semibold text-foreground">Your Teams</h2>
                            </div>
                            <div className="divide-y divide-border">
                                {teams.length === 0 ? (
                                    <div className="p-4 text-muted text-center">
                                        No teams yet. Create one to get started.
                                    </div>
                                ) : (
                                    teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => setSelectedTeam(team)}
                                            className={`w-full p-4 text-left transition-colors ${
                                                selectedTeam?.id === team.id
                                                    ? 'bg-primary/10'
                                                    : 'hover:bg-secondary'
                                            }`}
                                        >
                                            <div className="font-medium text-foreground">{team.name}</div>
                                            <div className="text-sm text-muted">/{team.slug}</div>
                                            <div className="text-xs text-muted mt-1">
                                                Role: {team.role}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Team Details */}
                    <div className="lg:col-span-2">
                        {selectedTeam ? (
                            <div className="glass-card">
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-foreground">{selectedTeam.name}</h2>
                                        <div className="text-sm text-muted">/{selectedTeam.slug}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {currentUserRole === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    setEditTeamName(selectedTeam.name);
                                                    setEditTeamSlug(selectedTeam.slug);
                                                    setShowEditModal(true);
                                                }}
                                                className="btn-secondary text-sm py-1.5 px-3"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="btn-primary text-sm py-1.5 px-3"
                                        >
                                            Add Member
                                        </button>
                                        <a
                                            href={`/book/team/${selectedTeam.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm"
                                        >
                                            Booking Page
                                        </a>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-medium text-foreground mb-4">Members ({members.length})</h3>
                                    <div className="divide-y divide-border">
                                        {members.map((member) => (
                                            <div key={member.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        {member.users?.name || member.users?.email}
                                                    </div>
                                                    <div className="text-sm text-muted">{member.users?.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        member.role === 'admin'
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-secondary text-muted'
                                                    }`}>
                                                        {member.role}
                                                    </span>
                                                    {currentUserRole === 'admin' && member.role !== 'admin' && (
                                                        <button
                                                            onClick={() => removeMember(member.id)}
                                                            className="text-red-500 hover:text-red-400 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-8 text-center text-muted">
                                Select a team to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-foreground mb-4">Create Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => {
                                        setNewTeamName(e.target.value);
                                        setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                                    }}
                                    className="input-field w-full"
                                    placeholder="My Team"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={newTeamSlug}
                                    onChange={(e) => setNewTeamSlug(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="my-team"
                                />
                                <p className="text-xs text-muted mt-1">
                                    Booking URL: /book/team/{newTeamSlug || 'team-slug'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button onClick={createTeam} disabled={loading} className="btn-primary disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Team Modal */}
            {showEditModal && selectedTeam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-foreground mb-4">Edit Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                    className="input-field w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={editTeamSlug}
                                    onChange={(e) => setEditTeamSlug(e.target.value)}
                                    className="input-field w-full"
                                />
                                <p className="text-xs text-muted mt-1">
                                    Booking URL: /book/team/{editTeamSlug}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between mt-6">
                            <button onClick={deleteTeam} disabled={loading} className="text-red-500 hover:text-red-400 text-sm disabled:opacity-50">
                                Delete Team
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button onClick={updateTeam} disabled={loading} className="btn-primary disabled:opacity-50">
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMemberModal(false)}>
                    <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-foreground mb-4">Add Member</h2>
                        <div>
                            <label className="block text-sm text-muted mb-1">Email</label>
                            <input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="input-field w-full"
                                placeholder="member@example.com"
                            />
                            <p className="text-xs text-muted mt-1">
                                The user must already have an account
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddMemberModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button onClick={addMember} disabled={loading} className="btn-primary disabled:opacity-50">
                                {loading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
