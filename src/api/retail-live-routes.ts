export interface RetailLiveRouteContract {
  method: "GET" | "POST" | "PUT";
  path: string;
  model: string;
  defaultLimit?: number;
  maxLimit?: number;
  filters?: readonly string[];
  requiresServerPermission?: boolean;
  writesExternalSystem: false;
}

export const RETAIL_LIVE_READ_ROUTES: readonly RetailLiveRouteContract[] = [
  {
    method: "GET",
    path: "/api/live/products",
    model: "Product",
    defaultLimit: 20,
    maxLimit: 100,
    filters: ["search", "limit", "offset"],
    writesExternalSystem: false
  },
  {
    method: "GET",
    path: "/api/live/counterparties",
    model: "Counterparty",
    defaultLimit: 20,
    maxLimit: 100,
    filters: ["search", "limit", "offset"],
    writesExternalSystem: false
  },
  {
    method: "GET",
    path: "/api/live/stock-balances",
    model: "StockBalance",
    defaultLimit: 20,
    maxLimit: 5000,
    filters: ["productCode", "warehouseCode", "search", "sort", "direction", "limit", "offset"],
    writesExternalSystem: false
  },
  {
    method: "GET",
    path: "/api/live/serial-stock",
    model: "SerialStock",
    defaultLimit: 20,
    maxLimit: 100,
    filters: ["productCode", "warehouseCode", "limit", "offset"],
    writesExternalSystem: false
  }
];
