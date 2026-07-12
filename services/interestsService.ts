// services/interestsService.ts
const $fetchLocal = (globalThis as any).$fetch ?? (async () => { throw new Error('$fetch not available') })

export const interestsService = {
  async fetchAll() {
    return await $fetchLocal('/api/interests/list')
  },

  async fetchUserInterests() {
    return await $fetchLocal('/api/interests/user')
  },

  async add(interestId: string) {
    return await $fetchLocal('/api/interests/add', {
      method: 'POST',
      body: { interestId }
    })
  },

  async remove(interestId: string) {
    return await $fetchLocal('/api/interests/remove', {
      method: 'POST',
      body: { interestId }
    })
  }
}
