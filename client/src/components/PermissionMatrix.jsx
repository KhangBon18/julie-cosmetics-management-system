import { Fragment } from 'react';
import { FiCheck } from 'react-icons/fi';
import { ACTION_LABELS, getPermissionModules } from '../config/moduleRegistry';

const MATRIX_ACTIONS = ['read', 'create', 'update', 'delete', 'export'];

export default function PermissionMatrix({ allPermissions, selectedIds, onChange, lockSystemModules = false }) {
  const modules = getPermissionModules();

  const permLookup = {};
  for (const permission of allPermissions) {
    const key = `${permission.module}.${permission.action}`;
    permLookup[key] = permission.permission_id;
  }

  const selectedSet = new Set((selectedIds || []).map(id => Number(id)));

  const emitChange = (nextSet) => {
    onChange([...nextSet]);
  };

  const isChecked = (moduleKey, action) => {
    const permissionId = permLookup[`${moduleKey}.${action}`];
    return permissionId ? selectedSet.has(Number(permissionId)) : false;
  };

  const toggle = (moduleKey, action) => {
    const mod = modules.find(item => item.key === moduleKey);
    if (lockSystemModules && mod?.systemOnly) return;

    const permissionId = permLookup[`${moduleKey}.${action}`];
    if (!permissionId) return;

    const nextSet = new Set(selectedSet);
    const numericPermissionId = Number(permissionId);

    if (nextSet.has(numericPermissionId)) {
      nextSet.delete(numericPermissionId);

      if (action === 'read') {
        for (const relatedAction of ['create', 'update', 'delete', 'export']) {
          const relatedPermissionId = permLookup[`${moduleKey}.${relatedAction}`];
          if (relatedPermissionId) nextSet.delete(Number(relatedPermissionId));
        }
      }
    } else {
      nextSet.add(numericPermissionId);

      if (action !== 'read') {
        const readPermissionId = permLookup[`${moduleKey}.read`];
        if (readPermissionId) nextSet.add(Number(readPermissionId));
      }
    }

    emitChange(nextSet);
  };

  const toggleColumn = (action) => {
    const nextSet = new Set(selectedSet);
    const allChecked = modules.every(mod => {
      if (lockSystemModules && mod.systemOnly) return true;
      if (!mod.actions.includes(action)) return true;
      const permissionId = permLookup[`${mod.key}.${action}`];
      return permissionId ? nextSet.has(Number(permissionId)) : true;
    });

    for (const mod of modules) {
      if (lockSystemModules && mod.systemOnly) continue;
      if (!mod.actions.includes(action)) continue;
      const permissionId = permLookup[`${mod.key}.${action}`];
      if (!permissionId) continue;

      const numericPermissionId = Number(permissionId);
      if (allChecked) {
        nextSet.delete(numericPermissionId);
        if (action === 'read') {
          for (const relatedAction of ['create', 'update', 'delete', 'export']) {
            const relatedPermissionId = permLookup[`${mod.key}.${relatedAction}`];
            if (relatedPermissionId) nextSet.delete(Number(relatedPermissionId));
          }
        }
      } else {
        nextSet.add(numericPermissionId);
        if (action !== 'read') {
          const readPermissionId = permLookup[`${mod.key}.read`];
          if (readPermissionId) nextSet.add(Number(readPermissionId));
        }
      }
    }

    emitChange(nextSet);
  };

  const toggleRow = (moduleKey) => {
    const nextSet = new Set(selectedSet);
    const mod = modules.find(item => item.key === moduleKey);
    if (!mod) return;
    if (lockSystemModules && mod.systemOnly) return;

    const allChecked = mod.actions.every(action => {
      const permissionId = permLookup[`${moduleKey}.${action}`];
      return permissionId ? nextSet.has(Number(permissionId)) : true;
    });

    for (const action of mod.actions) {
      const permissionId = permLookup[`${moduleKey}.${action}`];
      if (!permissionId) continue;
      if (allChecked) nextSet.delete(Number(permissionId));
      else nextSet.add(Number(permissionId));
    }

    emitChange(nextSet);
  };

  const sectionMap = new Map();
  for (const mod of modules) {
    if (!sectionMap.has(mod.section)) sectionMap.set(mod.section, []);
    sectionMap.get(mod.section).push(mod);
  }

  const isColumnAllChecked = (action) => (
    modules.every(mod => {
      if (lockSystemModules && mod.systemOnly) return true;
      if (!mod.actions.includes(action)) return true;
      const permissionId = permLookup[`${mod.key}.${action}`];
      return permissionId ? selectedSet.has(Number(permissionId)) : true;
    })
  );

  const isRowAllChecked = (moduleKey) => {
    const mod = modules.find(item => item.key === moduleKey);
    if (!mod) return false;
    return mod.actions.every(action => {
      const permissionId = permLookup[`${moduleKey}.${action}`];
      return permissionId ? selectedSet.has(Number(permissionId)) : true;
    });
  };

  return (
    <div className="perm-matrix-wrapper">
      <table className="perm-matrix">
        <thead>
          <tr>
            <th className="perm-matrix-module-header">Chức năng</th>
            {MATRIX_ACTIONS.map(action => (
              <th key={action} className="perm-matrix-action-header">
                <label className="perm-matrix-col-toggle">
                  <input
                    type="checkbox"
                    checked={isColumnAllChecked(action)}
                    onChange={() => toggleColumn(action)}
                  />
                  <span>{ACTION_LABELS[action] || action}</span>
                </label>
              </th>
            ))}
            <th className="perm-matrix-action-header">
              <span>Tất cả</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {[...sectionMap.entries()].map(([section, mods]) => (
            <Fragment key={section}>
              <tr className="perm-matrix-section-row">
                <td colSpan={MATRIX_ACTIONS.length + 2} className="perm-matrix-section-label">
                  {section}
                </td>
              </tr>
              {mods.map(mod => (
                <tr
                  key={mod.key}
                  className="perm-matrix-row"
                  style={lockSystemModules && mod.systemOnly ? { opacity: 0.55 } : undefined}
                >
                  <td className="perm-matrix-module-name">
                    <mod.icon className="perm-matrix-module-icon" />
                    {mod.name}
                    {mod.systemOnly ? <span style={{ marginLeft: 8, fontSize: 11, color: '#b45309' }}>(Chỉ admin)</span> : null}
                  </td>
                  {MATRIX_ACTIONS.map(action => (
                    <td key={action} className="perm-matrix-cell">
                      {mod.actions.includes(action) ? (
                        <label className="perm-checkbox-label">
                          <input
                            type="checkbox"
                            className="perm-checkbox"
                            checked={isChecked(mod.key, action)}
                            disabled={lockSystemModules && mod.systemOnly}
                            onChange={() => toggle(mod.key, action)}
                          />
                          <span className="perm-checkbox-custom">
                            <FiCheck className="perm-checkbox-icon" />
                          </span>
                        </label>
                      ) : (
                        <span className="perm-matrix-na">-</span>
                      )}
                    </td>
                  ))}
                  <td className="perm-matrix-cell">
                    <label className="perm-checkbox-label">
                      <input
                        type="checkbox"
                        className="perm-checkbox"
                        checked={isRowAllChecked(mod.key)}
                        disabled={lockSystemModules && mod.systemOnly}
                        onChange={() => toggleRow(mod.key)}
                      />
                      <span className="perm-checkbox-custom perm-checkbox-all">
                        <FiCheck className="perm-checkbox-icon" />
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
