import type { IndividualCustomer, BusinessCustomer } from './interfaces';

//search customer function-1
export const searchCustomer=async (
    ssn?: string,
    tax_id?:string
):Promise< IndividualCustomer | BusinessCustomer | null> => {
  const params = new URLSearchParams();
  if (ssn) params.append('ssn', ssn);
  if (tax_id) params.append('tax_id', tax_id);    

  return fetch(`http://localhost:5000/api/customers/search?${params}`)
    .then((response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => data as IndividualCustomer | BusinessCustomer)
    .catch((error) => {
      console.error('Error searching customer:', error);
      throw error;
    });
};

//add individual customer to the database
export const addIndividual=async (
    data: Omit<IndividualCustomer, 'customer_id' | 'customer_type'>
):Promise<{message:string; customer_id: number} > => {
    return fetch('http://localhost:5000/api/customers/add/individual' , {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) throw new Error ('Network response was not ok');
        return response.json();
    })
    .catch((error) => {
        console.error('Error adding individual: ', error);
        throw error;
    })
};

export const addBusiness = async (
  data: Omit<BusinessCustomer, 'customer_id' | 'customer_type'>
): Promise<{ message: string; customer_id: number }> => {
  return fetch('http://localhost:5000/api/customers/add/business', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .catch((error) => {
      console.error('Error adding business:', error);
      throw error;
    });
};