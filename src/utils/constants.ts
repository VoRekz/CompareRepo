export const STATUS_ORDER: ('ordered' | 'received' | 'installed')[] = [
  'ordered',
  'received',
  'installed',
];

export type PartStatus = (typeof STATUS_ORDER)[number];

export const getAllowedStatuses = (currentStatus: (typeof STATUS_ORDER)[number]) => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  return STATUS_ORDER.slice(currentIndex);
};
