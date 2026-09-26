export const queryKeys = {
  users: {
    all: ["users"] as const,
    list: (filters: { search: string; bloodGroup: string; donorStatus: string; country: string; page: number }) =>
      [...queryKeys.users.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
    countries: () => [...queryKeys.users.all, "countries"] as const,
  },
  communities: {
    all: ["communities"] as const,
    list: () => [...queryKeys.communities.all, "list"] as const,
    detail: (id: string) => [...queryKeys.communities.all, "detail", id] as const,
  },
  bloodBanks: {
    all: ["blood-banks"] as const,
    list: () => [...queryKeys.bloodBanks.all, "list"] as const,
  },
  admins: {
    all: ["admins"] as const,
    list: () => [...queryKeys.admins.all, "list"] as const,
  },
  bloodRequests: {
    all: ["blood-requests"] as const,
    list: () => [...queryKeys.bloodRequests.all, "list"] as const,
  },
  feedback: {
    all: ["feedback"] as const,
    list: () => [...queryKeys.feedback.all, "list"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
  },
} as const;
