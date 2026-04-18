export const updatePartStatus = async (payload: {
  parts_order_number: string;
  vendor_part_number: string;
  status: 'ordered' | 'received' | 'installed';
}) => {
  const response = await fetch('http://localhost:5000/api/parts/update_status', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update part status');
  }

  return response.json();
};
