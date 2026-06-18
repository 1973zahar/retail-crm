export function canExecuteAction(role = {}, action) {
  if (!action || role.disabled === true || role.status === "disabled") {
    return false;
  }

  const actions = normalizeList(role.actions ?? role.permissions ?? role.allowedActions);
  return role.isAdmin === true || actions.includes("*") || actions.includes(String(action));
}

export function canViewBlock(role = {}, blockId) {
  if (!blockId || role.disabled === true || role.status === "disabled") {
    return false;
  }

  const blocks = normalizeList(role.visibleBlocks ?? role.blocks ?? role.allowedBlocks);
  return role.isAdmin === true || blocks.includes("*") || blocks.includes(String(blockId));
}

export function missingPermissionText(action) {
  return `Missing role permission: ${String(action || "unknown")}`;
}

export function requireAction(role = {}, action) {
  if (canExecuteAction(role, action)) {
    return { ok: true, action: String(action) };
  }

  return {
    ok: false,
    action: String(action || ""),
    message: missingPermissionText(action)
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (value instanceof Set) {
    return Array.from(value).map((item) => String(item));
  }

  return [];
}
