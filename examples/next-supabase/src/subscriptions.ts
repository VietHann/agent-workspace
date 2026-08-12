export interface Subscription {
  id: string;
  active: boolean;
}

export function activeSubscriptions(items: Subscription[]): Subscription[] {
  return items.filter((item) => item.active);
}
