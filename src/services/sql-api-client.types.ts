import type { Counterparty, PagedResponse, Product, SerialStock, StockBalance, Warehouse } from "../types/retail-b2c";

export interface RetailSqlApiClient {
  searchProducts(params: { search?: string; limit: number; offset: number }): Promise<PagedResponse<Product>>;
  searchCounterparties(params: { search?: string; limit: number; offset: number }): Promise<PagedResponse<Counterparty>>;
  searchWarehouses(params: { search?: string; limit: number; offset: number }): Promise<PagedResponse<Warehouse>>;
  searchStockBalances(params: {
    productCode?: string;
    warehouseCode?: string;
    search?: string;
    sort?: string;
    direction?: "asc" | "desc";
    limit: number;
    offset: number;
  }): Promise<PagedResponse<StockBalance>>;
  searchSerialStock(params: {
    productCode: string;
    warehouseCode?: string;
    limit: number;
    offset: number;
  }): Promise<PagedResponse<SerialStock>>;
}
