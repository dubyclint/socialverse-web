// services/interestsService.ts
export const interestsService = {
  async fetchAll() {
    return await $fetch('/api/interests/list')
  },

  async fetchUserInterests() {
    return await $fetch('/api/interests/user')
  },

  async add(interestId: string) {
    return await $fetch('/api/interests/add', {
      method: 'POST',
      body: { interestId }
    })
  },

  async remove(interestId: string) {
    return await $fetch('/api/interests/remove', {
      method: 'POST',
      body: { interestId }
    })
  }
}
