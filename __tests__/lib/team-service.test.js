import { TeamService, TEAM_ROLES, TEAM_STATUSES } from '@/lib/team-service'
import { ApiError } from '@/lib/api-error'

describe('TeamService', () => {
  let service
  let mockSupabase

  beforeEach(() => {
    const selectResult = []
    mockSupabase = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve(selectResult)),
        })),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([])),
        })),
      })),
      delete: jest.fn(),
      __setSelectResult: (rows) => {
        mockSupabase.select.mockImplementation(() => ({
          from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })),
        }))
      },
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
      const createdTeam = { id: 'team-1', name: teamData.name, description: teamData.description, avatarUrl: null,
        isPersonal: false, createdBy: ownerId, ownerId }
      mockSupabase.__setSelectResult([{ value: 0 }])
      mockSupabase.insert.mockImplementationOnce(() => ({
        values: jest.fn(() => ({ returning: jest.fn(() => Promise.resolve([createdTeam])) })),
      }))

      const result = await service.createTeam(teamData, ownerId)
      expect(result).toMatchObject({ id: createdTeam.id, name: teamData.name })
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2)
    })

    it('should throw error when user already has 2 teams', async () => {
      mockSupabase.__setSelectResult([{ value: 2 }])

      await expect(service.createTeam(teamData, ownerId))
        .rejects
        .toThrow('You have reached the maximum limit of 2 teams')
    })
  })
})
