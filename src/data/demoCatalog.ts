import { Product, Customer, Supplier } from '../types';

type Line = {
  code: string;
  name: string;
  qty: number;
  cost: number;
  category: string;
  brand: string;
  compatibility: string;
};

function prices(cost: number) {
  return {
    costPrice: cost,
    wholesalePrice: Math.round(cost * 1.15),
    retailPrice: Math.round(cost * 1.35),
  };
}

function stockMeta(qty: number) {
  return {
    stock: qty,
    minStockLevel: Math.max(2, Math.floor(qty / 5)),
  };
}

/** Motorcycle spare lines from 31 JOB supplier invoice */
const LINES: Line[] = [
  { code: 'SLL-013', name: 'BEARING 6202', qty: 50, cost: 450, category: 'Bearing na Seals', brand: 'SLL', compatibility: '' },
  { code: 'SLL-017', name: 'BEARING 6302 - SLL', qty: 50, cost: 600, category: 'Bearing na Seals', brand: 'SLL', compatibility: '' },
  { code: 'VEO-141', name: 'VEONJIDIAN - CARBURETOR ASSY CG125', qty: 5, cost: 6000, category: 'Injini (pikipiki)', brand: 'VEO', compatibility: 'CG125' },
  { code: 'VEO-089', name: 'KUDA - HEAD LAMP NDOGO GN125', qty: 5, cost: 4750, category: 'Umeme na Taa', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'ZZZ-016', name: 'PLUG - KIOO - DSTC', qty: 50, cost: 650, category: 'Umeme na Taa', brand: 'ZZZ', compatibility: '' },
  { code: 'ZZZ-805', name: 'JIDIAN - Push Rod CG150', qty: 50, cost: 450, category: 'Injini (pikipiki)', brand: 'JIDIAN', compatibility: 'CG150' },
  { code: 'SLL-095', name: 'HJ 125 - FRONT FOOTREST COMP', qty: 10, cost: 4500, category: 'Mwili na Accessories', brand: 'HJ', compatibility: 'HJ125' },
  { code: 'SLL-087', name: 'HJ 125 - BACK MIRROR', qty: 10, cost: 3500, category: 'Mwili na Accessories', brand: 'HJ', compatibility: 'HJ125' },
  { code: 'VEO-003', name: 'BIG FOOT REST - black', qty: 10, cost: 4750, category: 'Mwili na Accessories', brand: 'VEO', compatibility: '' },
  { code: 'BR-022', name: 'ADN - CHAIN KIT GN125 15T-116L', qty: 10, cost: 5000, category: 'Transmission / Chain', brand: 'ADN', compatibility: 'GN125' },
  { code: 'VEO-076', name: 'KUDA - PANEL GN125', qty: 5, cost: 5000, category: 'Mwili na Accessories', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'VEO-086', name: 'KUDA - FLANJA HUB ya BOX GN125', qty: 5, cost: 3750, category: 'Transmission / Chain', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'SLL-025-R', name: 'BOOT RUBBER RED GN125', qty: 5, cost: 1000, category: 'Mwili na Accessories', brand: 'SLL', compatibility: 'GN125' },
  { code: 'SLL-025-B', name: 'BOOT RUBBER BLACK GN125', qty: 5, cost: 1000, category: 'Mwili na Accessories', brand: 'SLL', compatibility: 'GN125' },
  { code: 'SLL-025-K', name: 'BOOT RUBBER KUANI GN125', qty: 3, cost: 1000, category: 'Mwili na Accessories', brand: 'SLL', compatibility: 'GN125' },
  { code: 'SLL-026', name: 'BOOT RUBBER RED GN125', qty: 3, cost: 1000, category: 'Mwili na Accessories', brand: 'SLL', compatibility: 'GN125' },
  { code: 'SLL-072', name: 'GEAR LEVER CG125 - SLL', qty: 20, cost: 1250, category: 'Transmission / Chain', brand: 'SLL', compatibility: 'CG125' },
  { code: 'VEO-062', name: 'KUDA/JIDIAN - GEAR BOX', qty: 5, cost: 6500, category: 'Transmission / Chain', brand: 'KUDA', compatibility: '' },
  { code: 'ZZZ-S65', name: 'KUDA - CALIPER GN125', qty: 6, cost: 6000, category: 'Breki', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'VEO-176', name: 'KUDA/JIDIAN - BLOCK ASSY CG125', qty: 4, cost: 12250, category: 'Injini (pikipiki)', brand: 'KUDA', compatibility: 'CG125' },
  { code: 'VEO-177', name: 'KUDA/JIDIAN - BLOCK ASSY CG150', qty: 1, cost: 12750, category: 'Injini (pikipiki)', brand: 'KUDA', compatibility: 'CG150' },
  { code: 'ZZZ-205', name: 'CRANK SHAFT CG 125 VEO', qty: 4, cost: 11580, category: 'Injini (pikipiki)', brand: 'VEO', compatibility: 'CG125' },
  { code: 'VEO-023', name: 'CHUJIO GN125', qty: 30, cost: 500, category: 'Filters / Chujio', brand: 'VEO', compatibility: 'GN125' },
  { code: 'VEO-020', name: 'KUDA/JIDIAN - CHAIN ADJUSTER GN125', qty: 40, cost: 450, category: 'Transmission / Chain', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'VEO-006', name: 'KUDA/SLL - BRAKE ARM COMPLETE GN125', qty: 30, cost: 450, category: 'Breki', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'SLL-147-A', name: 'RING PISTON CG125 STD', qty: 20, cost: 1250, category: 'Injini (pikipiki)', brand: 'SLL', compatibility: 'CG125' },
  { code: 'SLL-147-B', name: 'RING PISTON CG125 STD', qty: 10, cost: 1250, category: 'Injini (pikipiki)', brand: 'SLL', compatibility: 'CG125' },
  { code: 'VEO-037', name: 'HELMET GLASS WHITE', qty: 30, cost: 500, category: 'Mwili na Accessories', brand: 'VEO', compatibility: '' },
  { code: 'UGO-006', name: 'CLUTCH PLATE CG125 - KOK', qty: 30, cost: 1100, category: 'Injini (pikipiki)', brand: 'UGO', compatibility: 'CG125' },
  { code: 'SLL-174', name: 'VALVE SEAL CG125', qty: 100, cost: 125, category: 'Bearing na Seals', brand: 'SLL', compatibility: 'CG125' },
  { code: 'SLL-099', name: 'HJ 125 - BRAKE PEDAL - NA BUSHI YAKE', qty: 10, cost: 2000, category: 'Breki', brand: 'HJ', compatibility: 'HJ125' },
  { code: 'VEO-034', name: 'GOLOLI ZA STARTER CG125', qty: 20, cost: 250, category: 'Injini (pikipiki)', brand: 'VEO', compatibility: 'CG125' },
  { code: 'SLL-120', name: 'MAGNETO COIL CG125 - SLL', qty: 10, cost: 6250, category: 'Umeme na Taa', brand: 'SLL', compatibility: 'CG125' },
  { code: 'VEO-180', name: 'KUDA/JIDIAN - HANDLE SWITCH RH/LH GN125', qty: 10, cost: 4500, category: 'Umeme na Taa', brand: 'KUDA', compatibility: 'GN125' },
  { code: 'VEO-005', name: 'KUDA/JIDIAN - INDICATOR HJ125 ya BOX LAKE', qty: 100, cost: 750, category: 'Umeme na Taa', brand: 'KUDA', compatibility: 'HJ125' },
];

/** Shared demo catalog for offline mockData + `npm run db:seed-demo` */
export const DEMO_PRODUCTS: Omit<Product, 'id'>[] = LINES.map((line, i) => {
  const { costPrice, wholesalePrice, retailPrice } = prices(line.cost);
  const { stock, minStockLevel } = stockMeta(line.qty);
  return {
    name: line.name,
    sku: line.code,
    barcode: `31JOB${String(i + 1).padStart(8, '0')}`,
    category: line.category,
    costPrice,
    retailPrice,
    wholesalePrice,
    stock,
    minStockLevel,
    unit: 'Pcs',
    packSize: 1,
    binLocation: '',
    partNumber: line.code,
    brand: line.brand,
    compatibility: line.compatibility,
    condition: 'Mpya' as const,
    warrantyDays: 0,
  };
});

export const DEMO_CUSTOMERS: Omit<Customer, 'id'>[] = [
  { name: 'Kariakoo Bodaboda Spares', phone: '+255 713 111 222', email: 'orders@kariakooboda.tz', type: 'Wholesale', address: 'Uhuru St, Kariakoo, DSM', outstandingBalance: 450000 },
  { name: 'Mwenge Pikipiki Garage', phone: '+255 754 333 444', email: 'mwenge.piki@gmail.com', type: 'Wholesale', address: 'Mwenge, Kinondoni', outstandingBalance: 120000 },
  { name: 'Juma Bakari', phone: '+255 712 555 666', email: 'juma.bakari@email.com', type: 'Retail', address: 'Mbagala, Temeke', outstandingBalance: 0 },
  { name: 'Asha Mohamed', phone: '+255 755 777 888', email: 'asha.m@email.com', type: 'Retail', address: 'Sinza, Ubungo', outstandingBalance: 35000 },
  { name: 'Fleet Care TZ', phone: '+255 222 111 333', email: 'fleet@fleetcare.tz', type: 'Wholesale', address: 'Nyerere Rd, DSM', outstandingBalance: 890000 },
  { name: 'Hassan Ally', phone: '+255 767 999 000', email: 'N/A', type: 'Retail', address: 'Tabata, Ilala', outstandingBalance: 0 },
  { name: 'Upanga Bike Hub', phone: '+255 713 222 333', email: 'hub@upangabike.tz', type: 'Wholesale', address: 'Upanga, DSM', outstandingBalance: 0 },
  { name: 'Neema Joseph', phone: '+255 754 444 555', email: 'neema.j@email.com', type: 'Retail', address: 'Kimara', outstandingBalance: 18000 },
];

export const DEMO_SUPPLIERS: Omit<Supplier, 'id'>[] = [
  { name: '31 JOB', contactPerson: 'Sales Desk', phone: '+255 700 000 031', email: 'orders@31job.tz', address: 'Dar es Salaam' },
  { name: 'China OEM Direct', contactPerson: 'Li Wei', phone: '+86 138 0000 1111', email: 'export@chinaoem.cn', address: 'Guangzhou Auto Parts Market' },
  { name: 'Local Rebuilders Co-op', contactPerson: 'Peter Mushi', phone: '+255 715 888 999', email: 'rebuild@localcoop.tz', address: 'Vingunguti, DSM' },
];
