import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { getCapoStaff, findUserByEmail, setTeamMemberRole, removeTeamAccess, type TeamMember } from '../../../services/capoTeam'
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ASSIGNABLE_ROLES } from '../../../utils/permissions'
import { ConfirmButton } from '../../../components/ui/ConfirmButton'
import type { UserRole } from '../../../contexts/AuthContext'

const ROLE_COLORS: Record<UserRole, string> = {
  founder: 'bg-[#F3EDE6] text-[#9CA3AF]',
  moderator: 'bg-amber-50 text-amber-700',
  editor: 'bg-blue-50 text-blue-700',
  admin: 'bg-[#C86A43]/10 text-[#C86A43]',
  owner: 'bg-[#2D2A26] text-white',
}

function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
}

function TeamRow({ member, currentUserId, onChanged }: { member: TeamMember; currentUserId: string; onChanged: () => void }) {
  const [pendingRole, setPendingRole] = useState<UserRole>(member.role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSelf = member.id === currentUserId

  async function applyRole() {
    setSaving(true)
    setError(null)
    const result = await setTeamMemberRole(member.id, pendingRole, member.suspended)
    setSaving(false)
    if (result.success) onChanged()
    else setError(result.error ?? 'Could not update role.')
  }

  async function toggleSuspend() {
    setSaving(true)
    setError(null)
    const result = await setTeamMemberRole(member.id, member.role, !member.suspended)
    setSaving(false)
    if (result.success) onChanged()
    else setError(result.error ?? 'Could not update suspension.')
  }

  async function handleRemove() {
    setSaving(true)
    setError(null)
    const result = await removeTeamAccess(member.id)
    setSaving(false)
    if (result.success) onChanged()
    else setError(result.error ?? 'Could not remove access.')
  }

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F3EDE6] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2D2A26] truncate">{member.email}{isSelf && <span className="text-xs text-[#9CA3AF]"> (you)</span>}</p>
        <div className="flex items-center gap-2 mt-1">
          <RoleBadge role={member.role} />
          {member.suspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">Suspended</span>}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <select
        value={pendingRole}
        onChange={e => setPendingRole(e.target.value as UserRole)}
        disabled={saving || isSelf}
        className="px-2.5 py-1.5 rounded-lg border border-[#E8E4DD] text-xs bg-white disabled:opacity-50"
      >
        {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      {pendingRole !== member.role && (
        <button onClick={() => void applyRole()} disabled={saving} className="text-xs font-semibold text-[#C86A43] hover:underline shrink-0">
          Save
        </button>
      )}
      {!isSelf && (
        <>
          <button onClick={() => void toggleSuspend()} disabled={saving} className="text-xs text-[#9CA3AF] hover:text-[#2D2A26] shrink-0">
            {member.suspended ? 'Reactivate' : 'Suspend'}
          </button>
          <ConfirmButton
            label="Remove"
            confirmLabel="Confirm"
            onConfirm={() => void handleRemove()}
            className="text-xs text-[#9CA3AF] hover:text-red-500 shrink-0"
          />
        </>
      )}
    </div>
  )
}

export function CapoTeamPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<TeamMember | null | undefined>(undefined)
  const [searching, setSearching] = useState(false)
  const [grantRole, setGrantRole] = useState<UserRole>('moderator')
  const [grantError, setGrantError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setStaff(await getCapoStaff())
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  async function handleSearch() {
    if (!searchEmail.trim()) return
    setSearching(true)
    setSearchResult(undefined)
    const result = await findUserByEmail(searchEmail)
    setSearching(false)
    setSearchResult(result)
  }

  async function handleGrant() {
    if (!searchResult) return
    setGrantError(null)
    const result = await setTeamMemberRole(searchResult.id, grantRole, false)
    if (result.success) {
      setSearchEmail('')
      setSearchResult(undefined)
      void refresh()
    } else {
      setGrantError(result.error ?? 'Could not grant access.')
    }
  }

  return (
    <div className="p-8 max-w-3xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest mb-1">CAPO</p>
        <h1 className="text-2xl font-bold text-[#2D2A26]">Team</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Assign roles to people who already have a Village account. Real email invites aren't wired up yet — the person needs to have signed up first.</p>
      </div>

      {/* Grant access to an existing account */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Add someone to the team</p>
        <div className="bg-white rounded-xl border border-[#E8E4DD] p-5">
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={searchEmail}
              onChange={e => { setSearchEmail(e.target.value); setSearchResult(undefined) }}
              onKeyDown={e => e.key === 'Enter' && void handleSearch()}
              placeholder="their-email@example.com"
              className="flex-1 px-3 py-2.5 rounded-lg border border-[#E8E4DD] text-sm focus:outline-none focus:ring-2 focus:ring-[#C86A43]/30 focus:border-[#C86A43]"
            />
            <button onClick={() => void handleSearch()} disabled={searching || !searchEmail.trim()}
              className="px-4 py-2.5 bg-[#F3EDE6] text-[#2D2A26] text-sm font-semibold rounded-lg hover:bg-[#E8E4DD] disabled:opacity-50 transition-colors">
              {searching ? 'Searching…' : 'Find'}
            </button>
          </div>

          {searchResult === null && (
            <p className="text-xs text-[#9CA3AF] mt-3">No account found with that email. They need to sign up at Village first — this can't create an account for them.</p>
          )}

          {searchResult && (
            <div className="mt-4 flex items-center gap-3 bg-[#F8F5F0] rounded-lg px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2D2A26] truncate">{searchResult.email}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Currently: {ROLE_LABELS[searchResult.role]}</p>
              </div>
              <select value={grantRole} onChange={e => setGrantRole(e.target.value as UserRole)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E8E4DD] text-xs bg-white">
                {ASSIGNABLE_ROLES.filter(r => r !== 'founder').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <button onClick={() => void handleGrant()} className="px-3 py-1.5 bg-[#C86A43] text-white text-xs font-semibold rounded-lg hover:bg-[#b05a35] transition-colors shrink-0">
                Grant access
              </button>
            </div>
          )}
          {grantError && <p className="text-xs text-red-600 mt-2">{grantError}</p>}
        </div>
      </section>

      {/* Current staff */}
      <section className="mb-8">
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">Current staff ({staff.length})</p>
        {loading ? (
          <p className="text-sm text-[#9CA3AF]">Loading…</p>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E8E4DD] px-5 py-8 text-center">
            <p className="text-sm text-[#9CA3AF]">No staff yet beyond your own account.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E8E4DD]">
            {staff.map(member => (
              <TeamRow key={member.id} member={member} currentUserId={user?.id ?? ''} onChanged={refresh} />
            ))}
          </div>
        )}
      </section>

      {/* Role reference */}
      <section>
        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-4">What each role can do</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ASSIGNABLE_ROLES.map(role => (
            <div key={role} className="bg-white rounded-xl border border-[#E8E4DD] px-4 py-3.5">
              <RoleBadge role={role} />
              <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
