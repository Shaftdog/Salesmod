import type { User, Client, Order } from './types';
import { orderStatuses, orderPriorities, orderTypes, propertyTypes } from './types';
import { subDays, addDays, formatISO } from 'date-fns';

export const users: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john.doe@example.com', availability: true, geographicCoverage: 'San Francisco, CA', workload: 5, rating: 4.8 },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@example.com', availability: false, geographicCoverage: 'San Jose, CA', workload: 12, rating: 4.5 },
  { id: 'user-3', name: 'Peter Jones', email: 'peter.jones@example.com', availability: true, geographicCoverage: 'Oakland, CA; San Francisco, CA', workload: 2, rating: 4.9 },
  { id: 'user-4', name: 'Mary Johnson', email: 'mary.johnson@example.com', availability: true, geographicCoverage: 'Palo Alto, CA', workload: 8, rating: 4.2 },
];

export const clients: Client[] = [
  { id: 'client-1', companyName: 'Global Bank Corp', primaryContact: 'Alice Wonderland', email: 'alice@gbc.com', phone: '(123) 456-7890', address: '123 Main St, San Francisco, CA 94105', billingAddress: '123 Main St, San Francisco, CA 94105', paymentTerms: 30, isActive: true, createdAt: formatISO(subDays(new Date(), 45)), updatedAt: formatISO(subDays(new Date(), 5)), activeOrders: 5, totalRevenue: 12500 },
  { id: 'client-2', companyName: 'Secure Lending', primaryContact: 'Bob Builder', email: 'bob@securelending.com', phone: '(987) 654-3210', address: '456 Market St, San Francisco, CA 94105', billingAddress: '456 Market St, San Francisco, CA 94105', paymentTerms: 15, isActive: true, createdAt: formatISO(subDays(new Date(), 120)), updatedAt: formatISO(subDays(new Date(), 20)), activeOrders: 12, totalRevenue: 45000 },
  { id: 'client-3', companyName: 'Fast Mortgage', primaryContact: 'Charlie Chocolate', email: 'charlie@fastmortgage.com', phone: '(555) 555-5555', address: '789 Pine St, Oakland, CA 94607', billingAddress: '789 Pine St, Oakland, CA 94607', paymentTerms: 30, isActive: false, createdAt: formatISO(subDays(new Date(), 200)), updatedAt: formatISO(subDays(new Date(), 60)), activeOrders: 0, totalRevenue: 5200 },
  { id: 'client-4', companyName: 'Bay Area Credit Union', primaryContact: 'Diana Prince', email: 'diana@bacu.org', phone: '(415) 123-4567', address: '1 Financial Plaza, San Francisco, CA 94111', billingAddress: '1 Financial Plaza, San Francisco, CA 94111', paymentTerms: 30, isActive: true, createdAt: formatISO(subDays(new Date(), 30)), updatedAt: formatISO(subDays(new Date(), 10)), activeOrders: 8, totalRevenue: 28000 },
  { id: 'client-5', companyName: 'Golden Gate Lenders', primaryContact: 'Ethan Hunt', email: 'ethan@ggl.com', phone: '(510) 987-6543', address: '2000 Bridge Blvd, Sausalito, CA 94965', billingAddress: '2000 Bridge Blvd, Sausalito, CA 94965', paymentTerms: 60, isActive: true, createdAt: formatISO(subDays(new Date(), 90)), updatedAt: formatISO(subDays(new Date(), 15)), activeOrders: 3, totalRevenue: 15000 },
  { id: 'client-6', companyName: 'Silicon Valley Mortgages', primaryContact: 'Fiona Glenanne', email: 'fiona@svm.com', phone: '(650) 555-1234', address: '3000 Tech Park, Palo Alto, CA 94301', billingAddress: '3000 Tech Park, Palo Alto, CA 94301', paymentTerms: 30, isActive: true, createdAt: formatISO(subDays(new Date(), 180)), updatedAt: formatISO(subDays(new Date(), 25)), activeOrders: 25, totalRevenue: 150000 },
];

const now = new Date();

export const orders: Order[] = Array.from({ length: 35 }, (_, i) => {
  const orderedDate = subDays(now, i * 2 + 1);
  const status = orderStatuses[i % orderStatuses.length];
  const client = clients[i % clients.length];
  const assignee = users[i % users.length];

  return {
    id: `order-${i + 1}`,
    orderNumber: `APR-2024-${String(1001 + i).padStart(4, '0')}`,
    status: status,
    priority: orderPriorities[i % orderPriorities.length],
    orderType: orderTypes[i % orderTypes.length],
    propertyAddress: `${100 + i} Elm Street`,
    propertyCity: 'Springfield',
    propertyState: 'IL',
    propertyZip: '62704',
    propertyType: propertyTypes[i % propertyTypes.length],
    borrowerName: `Borrower ${i + 1}`,
    clientId: client.id,
    client,
    feeAmount: 500 + i * 10,
    totalAmount: 525 + i * 10,
    dueDate: formatISO(addDays(orderedDate, 7)),
    orderedDate: formatISO(orderedDate),
    assignedTo: status !== 'new' ? assignee.id : undefined,
    assignee: status !== 'new' ? assignee : undefined,
    createdBy: users[i % users.length].id,
    createdAt: formatISO(orderedDate),
    updatedAt: formatISO(addDays(orderedDate, 1)),
  };
});
