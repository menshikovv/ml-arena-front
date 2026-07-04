import { mockEntities, mockCore, mockAuth } from '@/api/mockData';

export const base44 = {
  entities: mockEntities,
  integrations: {
    Core: mockCore,
  },
  auth: mockAuth,
};
