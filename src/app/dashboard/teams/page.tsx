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
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamSlug, setNewTeamSlug] = useState('');
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
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
                        <p className="text-gray-600 mt-1">Manage your teams and members</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#1A5D5C] text-white px-4 py-2 rounded-lg hover:bg-[#154948] transition-colors"
                    >
                        Create Team
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Your Teams</h2>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {teams.length === 0 ? (
                                    <div className="p-4 text-gray-500 text-center">
                                        No teams yet. Create one to get started.
                                    </div>
                                ) : (
                                    teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => setSelectedTeam(team)}
                                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                                selectedTeam?.id === team.id ? 'bg-gray-50' : ''
                                            }`}
                                        >
                                            <div className="font-medium text-gray-900">{team.name}</div>
                                            <div className="text-sm text-gray-500">/{team.slug}</div>
                                            <div className="text-xs text-gray-400 mt-1">
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
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{selectedTeam.name}</h2>
                                        <div className="text-sm text-gray-500">/{selectedTeam.slug}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="bg-[#1A5D5C] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#154948] transition-colors"
                                        >
                                            Add Member
                                        </button>
                                        <a
                                            href={`/book/team/${selectedTeam.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#1A5D5C] hover:underline text-sm"
                                        >
                                            View Booking Page
                                        </a>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-medium text-gray-900 mb-4">Members ({members.length})</h3>
                                    <div className="divide-y divide-gray-200">
                                        {members.map((member) => (
                                            <div key={member.id} className="py-3 flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {member.users?.name || member.users?.email}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{member.users?.email}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        member.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {member.role}
                                                    </span>
                                                    {currentUserRole === 'admin' && member.role !== 'admin' && (
                                                        <button
                                                            onClick={() => removeMember(member.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm"
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
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                                Select a team to view details
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Create Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => {
                                        setNewTeamName(e.target.value);
                                        setNewTeamSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A5D5C]"
                                    placeholder="My Team"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    value={newTeamSlug}
                                    onChange={(e) => setNewTeamSlug(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A5D5C]"
                                    placeholder="my-team"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Booking URL: /book/team/{newTeamSlug || 'team-slug'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createTeam}
                                disabled={loading}
                                className="px-4 py-2 bg-[#1A5D5C] text-white rounded-lg hover:bg-[#154948] disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Add Member</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A5D5C]"
                                placeholder="member@example.com"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The user must already have an account
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddMemberModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addMember}
                                disabled={loading}
                                className="px-4 py-2 bg-[#1A5D5C] text-white rounded-lg hover:bg-[#154948] disabled:opacity-50"
                            >
                                {loading ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
