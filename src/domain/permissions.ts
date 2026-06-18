import type { RoleAction } from "../types/retail-b2c";

export interface RolePermissions {
  roleId: string;
  visibleBlocks: readonly string[];
  actions: readonly RoleAction[];
}

export function canExecuteAction(role: RolePermissions, action: RoleAction): boolean {
  return role.actions.includes(action);
}

export function canViewBlock(role: RolePermissions, blockId: string): boolean {
  return role.visibleBlocks.includes(blockId);
}

export function missingPermissionText(action: RoleAction): string {
  return `Missing role permission: ${action}`;
}
