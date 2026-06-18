export type RetailB2CBuildId = "20260618-retail-live-api-routes-1";
export type RetailB2CContractVersion = "2026.06.18-retail-live-api-routes-1";

export interface RetailB2CBuildInfo {
  appVersion: string;
  build: RetailB2CBuildId;
  releasedAt: string;
  contractVersion: RetailB2CContractVersion;
}

export interface PagedResponse<T> {
  data: T[];
  items?: T[];
  limit: number;
  offset: number;
  total?: number;
  hasMore: boolean;
  nextOffset?: number;
  source?: string;
}

export interface Product {
  id?: string;
  productCode: string;
  productName: string;
  barcode?: string;
  sku?: string;
  categoryPath?: string;
  isWeaponCategory?: boolean;
}

export interface ProductPrice {
  productCode: string;
  priceType: string;
  currency: "UAH" | "EUR" | "USD" | string;
  amount: number;
}

export interface StockBalance {
  productCode: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  availableQty: number;
  reservedQty?: number;
  snapshotAt?: string;
}

export interface SerialStock {
  productCode: string;
  warehouseCode: string;
  serialNumber: string;
  availableQty: number;
}

export interface Counterparty {
  counterpartyCode: string;
  name: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface Warehouse {
  warehouseCode: string;
  warehouseName: string;
}

export type RoleAction =
  | "customer_create"
  | "drilldown_view"
  | "document_edit"
  | "document_list_view"
  | "document_list_sort"
  | "document_list_collapse"
  | "exchange_view"
  | "system_settings"
  | "price_select"
  | "employee_edit"
  | "employee_manage";

export interface EmployeeSession {
  employeeId: string;
  deviceId: string;
  sessionToken: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface RetailSaleLine {
  productCode: string;
  productName: string;
  warehouseCode: string;
  quantity: number;
  price: number;
  discountPercent?: number;
  serialNumber?: string;
  sourceCurrency?: string;
  sourcePrice?: number;
  exchangeRate?: number;
}

export interface RetailSale {
  saleId: string;
  customerCode?: string;
  employeeId: string;
  paymentMethod: "cash" | "bank" | "mixed";
  lines: RetailSaleLine[];
  status: "draft" | "confirmed" | "queued_for_export" | "exported" | "cancelled";
}

export interface RetailOutboxTask<TPayload = unknown> {
  id: string;
  kind: "retail_sale" | "retail_return" | "b2c_counterparty";
  payload: TPayload;
  status: "pending" | "ready" | "sent" | "failed";
  externalSendPerformed: false;
  createdAt: string;
}
