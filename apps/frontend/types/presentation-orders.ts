export interface OrderWithGroup {
  id: number;
  groupId: number;
  orderNumber: number;
  presentationId: number;
  scheduledDatetime: string;
  createdAt: string;
  updatedAt: string;
  group?: {
    id: number;
    name: string;
    members: {
      id: number;
      firstname: string;
      lastname: string;
      email: string;
    }[];
  };
}
