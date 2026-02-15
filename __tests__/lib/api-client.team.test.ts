import { ApiClient, ApiError } from '@/lib/api-client'
import { PERSONAL_TEAM_ID, TEAM_STORAGE_KEY } from '@/lib/team-storage'

describe('ApiClient team scoping', () => {
  let client: any

  beforeEach(() => {
    client = new ApiClient('')
    window.localStorage.clear()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    ) as jest.Mock
  })

  it('attaches team id header from local storage when available', async () => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, 'team-123')

    await client.request('/api/test')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Team-Id': 'team-123',
        }),
      })
    )
  })

  it('prefers explicit teamId option over stored value', async () => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, 'team-stored')

    await client.request('/api/test', { teamId: 'team-explicit' })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Team-Id': 'team-explicit',
        }),
      })
    )
  })

  it('does not override existing X-Team-Id header', async () => {
    await client.request('/api/test', {
      headers: { 'X-Team-Id': 'manual-team' },
      teamId: 'ignored-team',
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Team-Id': 'manual-team',
        }),
      })
    )
  })

  it('throws ApiError on network failure', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('network down'))) as jest.Mock

    await expect(client.request('/api/test')).rejects.toBeInstanceOf(ApiError)
  })

  it('does not attach header when stored value represents personal space', async () => {
    window.localStorage.setItem(TEAM_STORAGE_KEY, PERSONAL_TEAM_ID)

    await client.request('/api/test')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.not.objectContaining({
          'X-Team-Id': expect.any(String),
        }),
      })
    )
  })
})
