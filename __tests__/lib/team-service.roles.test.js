import { TeamService, TEAM_ROLES } from '@/lib/team-service.js'

describe('TeamService owner role assignment', () => {
  it('拒绝通过邀请直接授予 owner', async () => {
    const service = new TeamService({})

    await expect(service.inviteMember('team-1', 'admin-1', {
      userId: 'user-1',
      email: 'user@example.com',
      role: TEAM_ROLES.OWNER,
    })).rejects.toMatchObject({
      status: 400,
      message: 'Owner role can only be assigned through ownership transfer',
    })
  })

  it('拒绝通过成员更新直接授予 owner', async () => {
    const service = new TeamService({})

    await expect(service.updateMember('team-1', 'user-1', 'admin-1', {
      role: TEAM_ROLES.OWNER,
    })).rejects.toMatchObject({
      status: 400,
      message: 'Owner role can only be assigned through ownership transfer',
    })
  })
})
