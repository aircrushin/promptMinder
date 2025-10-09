'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { PERSONAL_TEAM_ID, TEAM_STORAGE_KEY } from '@/lib/team-storage.js'

const TeamContext = createContext(null)

export function TeamProvider({ children }) {
  const { isSignedIn } = useUser()
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const initializedRef = useRef(false)

  const persistPreference = useCallback((teamId) => {
    if (typeof window === 'undefined') {
      return
    }

    if (teamId) {
      window.localStorage.setItem(TEAM_STORAGE_KEY, teamId)
    } else {
      window.localStorage.setItem(TEAM_STORAGE_KEY, PERSONAL_TEAM_ID)
    }
  }, [])

  const applyActiveTeamFallback = useCallback((resolvedTeams, preferredId) => {
    if (preferredId === PERSONAL_TEAM_ID) {
      setActiveTeamId(null)
      persistPreference(null)
      return
    }

    if (!resolvedTeams.length) {
      setActiveTeamId(null)
      persistPreference(null)
      return
    }

    const activeOrPending = resolvedTeams.filter((team) => team.status === 'active')
    const hasPreferred = preferredId && activeOrPending.some((team) => team.team.id === preferredId)

    if (hasPreferred) {
      setActiveTeamId(preferredId)
      persistPreference(preferredId)
      return
    }

    if (activeOrPending.length > 0) {
      const nextId = activeOrPending[0].team.id
      setActiveTeamId(nextId)
      persistPreference(nextId)
      return
    }

    const fallbackId = resolvedTeams[0].team.id
    setActiveTeamId(fallbackId)
    persistPreference(fallbackId)
  }, [persistPreference])

  const fetchTeams = useCallback(async () => {
    if (!isSignedIn) {
      setTeams([])
      setActiveTeamId(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(TEAM_STORAGE_KEY)
      }
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/teams', {
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Failed to load teams')
      }

      const payload = await response.json()
      const resolvedTeams = payload?.teams || []

      setTeams(resolvedTeams)

      let storedId = null
      if (typeof window !== 'undefined') {
        storedId = window.localStorage.getItem(TEAM_STORAGE_KEY)
      }

      applyActiveTeamFallback(resolvedTeams, storedId)
    } catch (err) {
      console.error('[TeamProvider] load error', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [applyActiveTeamFallback, isSignedIn])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      if (typeof window !== 'undefined') {
        const storedId = window.localStorage.getItem(TEAM_STORAGE_KEY)
        if (storedId === PERSONAL_TEAM_ID) {
          setActiveTeamId(null)
        } else if (storedId) {
          setActiveTeamId(storedId)
        }
      }
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const refresh = useCallback(() => fetchTeams(), [fetchTeams])

  const selectTeam = useCallback((teamId) => {
    const normalizedId = teamId ?? null
    setActiveTeamId(normalizedId)
    persistPreference(normalizedId)
  }, [persistPreference])

  const acceptInvite = useCallback(async (teamId) => {
    const response = await fetch(`/api/teams/${teamId}/members/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'active' })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to accept invite')
    }

    await fetchTeams()
  }, [fetchTeams])

  const leaveTeam = useCallback(async (teamId) => {
    const response = await fetch(`/api/teams/${teamId}/members/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to leave team')
    }

    await fetchTeams()
  }, [fetchTeams])

  const deleteTeam = useCallback(async (teamId) => {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Failed to delete team')
    }

    await fetchTeams()
  }, [fetchTeams])

  const value = useMemo(() => {
    const activeMembership = teams.find((item) => item.team.id === activeTeamId) || null
    const activeTeam = activeMembership?.team || null
    const pendingInvites = teams.filter((item) => item.status === 'pending')
    const activeTeams = teams.filter((item) => item.status === 'active')

    return {
      teams,
      activeTeam,
      activeTeamId,
      activeMembership,
      isPersonal: activeTeamId === null,
      loading,
      error,
      refresh,
      selectTeam,
      pendingInvites,
      activeTeams,
      acceptInvite,
      leaveTeam,
      deleteTeam,
      hasActiveTeam: Boolean(activeMembership && activeMembership.status === 'active')
    }
  }, [teams, activeTeamId, loading, error, refresh, selectTeam, acceptInvite, leaveTeam, deleteTeam])

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider')
  }
  return context
}
