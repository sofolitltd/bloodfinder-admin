export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  target: string;
  country: string | null;
  link?: string;
  createdAt: string | null;
}

export interface AdminNotificationItem {
  id: string;
  uid: string | null;
  userName: string | null;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string | null;
}
