import { TeamService } from '@/lib/team-service'

describe('TeamService', () => {
  let service
  let mockSupabase

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
    }
    service = new TeamService(mockSupabase)
  })

  describe('createTeam', () => {
    const ownerId = 'user-123'
    const teamData = {
      name: 'New Team',
      description: 'A new team',
      avatarUrl: null,
      isPersonal: false
    }

    it('should create a team successfully when under limit', async () => {
      const createdTeam = { id: 'team-1', ...teamData, owner_id: ownerId }

      // Mock for checking team count
      const countBuilder = {
        eq: jest.fn().mockResolvedValue({ count: 0, error: null })
      }

      // Mock for inserting team
      // Chain: .insert(...).select().single()
      const insertBuilder = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdTeam, error: null })
      }

      // Main builder returned by from('teams')
      // Handles .select(..., { count }) -> countBuilder
      // Handles .insert(...) -> insertBuilder
      const mainBuilder = {
        select: jest.fn().mockImplementation((...args) => {
          const options = args[1]
          if (options && options.count === 'exact') {
            return countBuilder
          }
          return insertBuilder
        }),
        insert: jest.fn().mockReturnValue(insertBuilder)
      }

      // Mock for team_members
      const membersBuilder = {
        insert: jest.fn().mockResolvedValue({ error: null })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'teams') return mainBuilder
        if (table === 'team_members') return membersBuilder
        return { select: jest.fn().mockReturnThis() }
      })

      const result = await service.createTeam(teamData, ownerId)
      expect(result).toEqual(createdTeam)
      
      // Verify count check was called
      expect(mainBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(countBuilder.eq).toHaveBeenCalledWith('owner_id', ownerId)
      
      // Verify insert was called
      expect(mainBuilder.insert).toHaveBeenCalled()
    })

    it('should throw error when user already has 2 teams', async () => {
      // Mock for checking team count
      const countBuilder = {
        eq: jest.fn().mockResolvedValue({ count: 2, error: null })
      }

      const mainBuilder = {
        select: jest.fn().mockReturnValue(countBuilder)
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'teams') return mainBuilder
        return { select: jest.fn().mockReturnThis() }
      })

      await expect(service.createTeam(teamData, ownerId))
        .rejects
        .toThrow('You have reached the maximum limit of 2 teams')
    })
  })
})
