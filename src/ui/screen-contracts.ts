export type RetailScreenId =
  | "pos"
  | "directories"
  | "customers"
  | "inventory"
  | "employees"
  | "data_exchange"
  | "settings";

export interface RetailScreenContract {
  id: RetailScreenId;
  title: string;
  requiresAuth: true;
  holdsFullReferenceData: false;
}
