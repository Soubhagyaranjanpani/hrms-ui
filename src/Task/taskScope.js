import { STORAGE_KEYS, API_ENDPOINTS, getAuthHeaders, extractArray } from '../config/api.config';
import { getNormalizedRole, normalizeRole, getMyId, cleanPersonName, unwrapResponse } from './taskAccess';

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA)) || {};
  } catch {
    return {};
  }
};

export const getTokenClaims = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    if (!token || !token.includes('.')) return {};
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) || {};
  } catch {
    return {};
  }
};

const getManagerId = (emp) =>
  emp?.managerId ??
  emp?.reportingManagerId ??
  emp?.reportingToId ??
  emp?.reportsToId ??
  emp?.assignedManagerId ??
  emp?.supervisorId ??
  (typeof emp?.reportingManager === 'object' ? emp.reportingManager?.id : emp?.reportingManager) ??
  (typeof emp?.manager === 'object' ? emp.manager?.id : null) ??
  null;

const getManagerName = (emp) => {
  const raw =
    emp?.managerName ??
    emp?.reportingManagerName ??
    emp?.reportingToName ??
    (typeof emp?.reportingManager === 'object' ? emp.reportingManager?.name : null) ??
    (typeof emp?.manager === 'object' ? emp.manager?.name : typeof emp?.manager === 'string' ? emp.manager : null);
  return raw ? cleanPersonName(raw).toLowerCase() : '';
};

const getHrId = (emp) =>
  emp?.hrId ??
  emp?.reportingHrId ??
  emp?.assignedHrId ??
  (typeof emp?.hr === 'object' ? emp.hr?.id : null) ??
  null;

const norm = (val) => (val == null ? '' : String(val).trim().toLowerCase());

export const collectMyIds = (currentUser, myRecord) => {
  const claims = getTokenClaims();
  const ids = new Set();
  const candidates = [
    getMyId(currentUser),
    currentUser?.id,
    currentUser?.employeeId,
    currentUser?.userId,
    claims?.employeeId,
    claims?.userId,
    claims?.id,
    myRecord?.id,
    myRecord?.employeeId,
    myRecord?.userId,
  ];
  candidates.forEach(c => {
    if (c != null && String(c).trim() !== '') ids.add(String(c));
  });
  return ids;
};

export const findMyEmployeeRecord = (list, currentUser) => {
  const claims = getTokenClaims();
  const myId = getMyId(currentUser);
  const idCandidates = new Set(
    [
      myId,
      currentUser?.id,
      currentUser?.employeeId,
      currentUser?.userId,
      claims?.employeeId,
      claims?.userId,
      claims?.id,
    ]
      .filter(v => v != null && String(v).trim() !== '')
      .map(String)
  );
  const myEmail = norm(
    currentUser?.email ||
      currentUser?.username ||
      claims?.email ||
      (typeof claims?.sub === 'string' && claims.sub.includes('@') ? claims.sub : '')
  );
  const myUsername = norm(currentUser?.username || claims?.username || claims?.sub);
  const myName = norm(
    cleanPersonName(
      currentUser?.name ||
        `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}` ||
        claims?.name ||
        ''
    )
  );

  return list.find(e => {
    const eIds = [e.id, e.employeeId, e.userId].filter(v => v != null).map(String);
    if (eIds.some(id => idCandidates.has(id))) return true;
    if (myEmail && norm(e.email || e.officialEmail || e.personalEmail) === myEmail) return true;
    if (myUsername && norm(e.username || e.email) === myUsername) return true;
    if (myName && norm(cleanPersonName(e.name)) === myName) return true;
    return false;
  });
};

export const getMyOrgScope = (list, user, referenceEmployees = []) => {
  const claims = getTokenClaims();
  const currentUser = user || getStoredUser();
  const searchPool = [
    ...(Array.isArray(list) ? list : []),
    ...(Array.isArray(referenceEmployees) ? referenceEmployees : []),
  ];
  const myRecord = findMyEmployeeRecord(searchPool, currentUser);
  const myIds = collectMyIds(currentUser, myRecord);
  const myName = norm(
    cleanPersonName(
      currentUser?.name ||
        `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}` ||
        claims?.name ||
        myRecord?.name
    )
  );

  const myBranchId =
    currentUser?.branchId ??
    currentUser?.branch?.id ??
    claims?.branchId ??
    myRecord?.branchId ??
    myRecord?.branch?.id ??
    null;

  const myBranchName =
    currentUser?.branchName ??
    (typeof currentUser?.branch === 'string' ? currentUser.branch : currentUser?.branch?.name) ??
    claims?.branchName ??
    myRecord?.branchName ??
    (typeof myRecord?.branch === 'string' ? myRecord.branch : myRecord?.branch?.name) ??
    null;

  const myDeptId =
    currentUser?.departmentId ??
    currentUser?.department?.id ??
    claims?.departmentId ??
    myRecord?.departmentId ??
    myRecord?.department?.id ??
    null;

  const myDeptName =
    currentUser?.departmentName ??
    (typeof currentUser?.department === 'string' ? currentUser.department : currentUser?.department?.name) ??
    claims?.departmentName ??
    myRecord?.departmentName ??
    (typeof myRecord?.department === 'string' ? myRecord.department : myRecord?.department?.name) ??
    null;

  return { currentUser, myRecord, myIds, myName, myBranchId, myBranchName, myDeptId, myDeptName };
};

/**
 * Scope an employee list for the current user's role:
 * - Admin: sees all employees.
 * - Manager: sees only Employee-role direct reports (or own department/branch employees if manager links are absent).
 * - Hr: sees only Employee-role direct reports / own department or branch employees.
 * - Employee: sees only their own record.
 */
export const scopeEmployeesForRole = (employees, user, departments = [], options = {}) => {
  const { referenceEmployees = [], failClosed = true } = options;
  const rawList = Array.isArray(employees) ? employees : [];

  const refById = new Map();
  (Array.isArray(referenceEmployees) ? referenceEmployees : []).forEach(ref => {
    if (ref?.id != null) refById.set(String(ref.id), ref);
  });

  const list = rawList.map(emp => {
    const ref = emp?.id != null ? refById.get(String(emp.id)) : null;
    if (!ref) return emp;
    return {
      ...emp,
      roleName: emp.roleName || emp.role || ref.roleName || ref.role,
      departmentId: emp.departmentId ?? emp.department?.id ?? ref.departmentId ?? ref.department?.id,
      departmentName: emp.departmentName ?? emp.department?.name ?? ref.departmentName ?? ref.department?.name,
      branchId: emp.branchId ?? emp.branch?.id ?? ref.branchId ?? ref.branch?.id,
      branchName: emp.branchName ?? emp.branch?.name ?? ref.branchName ?? ref.branch?.name,
      managerId: emp.managerId ?? ref.managerId ?? ref.reportingManagerId ?? ref.reportingToId,
      reportingManagerId: emp.reportingManagerId ?? ref.reportingManagerId,
      reportingManagerName: emp.reportingManagerName ?? ref.reportingManagerName ?? ref.managerName,
      hrId: emp.hrId ?? ref.hrId ?? ref.reportingHrId,
    };
  });

  const {
    currentUser,
    myIds,
    myName,
    myBranchId,
    myBranchName,
    myDeptId,
    myDeptName,
  } = getMyOrgScope(list, user, referenceEmployees);
  const userRole = getNormalizedRole(currentUser);

  if (userRole === 'Admin') {
    return list;
  }

  if (userRole === 'Employee') {
    return list.filter(emp => {
      const eIds = [emp.id, emp.employeeId, emp.userId].filter(v => v != null).map(String);
      if (eIds.some(id => myIds.has(id))) return true;
      return Boolean(myName && norm(cleanPersonName(emp.name)) === myName);
    });
  }

  // Exclude self and non-Employee roles (Admin / Manager / Hr)
  const scoped = list.filter(emp => {
    const eIds = [emp.id, emp.employeeId, emp.userId].filter(v => v != null).map(String);
    if (eIds.some(id => myIds.has(id))) return false;
    if (myName && norm(cleanPersonName(emp.name)) === myName) return false;
    const empRole = emp.roleName || emp.role;
    if (empRole && normalizeRole(empRole) !== 'Employee') return false;
    return true;
  });

  const matchesDept = (emp) => {
    const empDeptId = emp.departmentId ?? emp.department?.id ?? null;
    const empDeptName =
      emp.departmentName ??
      (typeof emp.department === 'string' ? emp.department : emp.department?.name) ??
      null;
    if (myDeptId != null && empDeptId != null) return String(empDeptId) === String(myDeptId);
    if (myDeptName && empDeptName && norm(empDeptName) === norm(myDeptName)) {
      const empHasBranch = emp.branchId != null || emp.branch?.id != null || Boolean(emp.branchName);
      if ((myBranchId != null || myBranchName) && empHasBranch) {
        return matchesBranch(emp);
      }
      return true;
    }
    return false;
  };

  const matchesBranch = (emp) => {
    const empBranchId = emp.branchId ?? emp.branch?.id ?? null;
    const empBranchName =
      emp.branchName ??
      (typeof emp.branch === 'string' ? emp.branch : emp.branch?.name) ??
      null;
    if (myBranchId != null) {
      if (empBranchId != null) return String(empBranchId) === String(myBranchId);
      if (departments.length > 0) {
        const empDeptId = emp.departmentId ?? emp.department?.id;
        const branchDeptIds = new Set(
          departments.filter(d => String(d.branchId) === String(myBranchId)).map(d => String(d.id))
        );
        if (empDeptId != null) return branchDeptIds.has(String(empDeptId));
      }
    }
    if (myBranchName && empBranchName) {
      return norm(empBranchName) === norm(myBranchName);
    }
    return false;
  };

  const isDirectManagerMatch = (emp) => {
    const mId = getManagerId(emp);
    if (mId != null && myIds.size > 0 && myIds.has(String(mId))) return true;
    const mName = getManagerName(emp);
    if (mName && myName && mName === myName) return true;
    return false;
  };

  const hasExplicitOtherManager = (emp) => {
    const mId = getManagerId(emp);
    if (mId != null && myIds.size > 0 && !myIds.has(String(mId))) return true;
    const mName = getManagerName(emp);
    if (mName && myName && mName !== myName) return true;
    return false;
  };

  if (userRole === 'Manager') {
    const directMatches = scoped.filter(isDirectManagerMatch);
    const deptOrBranchMatches =
      myDeptId != null || myDeptName
        ? scoped.filter(emp => !hasExplicitOtherManager(emp) && matchesDept(emp))
        : myBranchId != null || myBranchName
          ? scoped.filter(emp => !hasExplicitOtherManager(emp) && matchesBranch(emp))
          : [];

    if (directMatches.length > 0 || deptOrBranchMatches.length > 0) {
      const merged = new Map();
      [...directMatches, ...deptOrBranchMatches].forEach((emp, idx) => {
        const key = emp?.id != null ? String(emp.id) : `idx-${idx}`;
        merged.set(key, emp);
      });
      return [...merged.values()];
    }
    if (myDeptId != null || myDeptName || myBranchId != null || myBranchName) {
      return [];
    }
    return failClosed ? [] : scoped;
  }

  if (userRole === 'Hr') {
    const hrMatches = scoped.filter(emp => {
      const hId = getHrId(emp);
      return hId != null && myIds.size > 0 && myIds.has(String(hId));
    });
    if (hrMatches.length > 0) return hrMatches;

    const mgrMatches = scoped.filter(isDirectManagerMatch);
    if (mgrMatches.length > 0) return mgrMatches;

    if (myDeptId != null || myDeptName) {
      return scoped.filter(matchesDept);
    }
    if (myBranchId != null || myBranchName) {
      return scoped.filter(matchesBranch);
    }
    return failClosed ? [] : scoped;
  }

  return failClosed ? [] : scoped;
};

/**
 * Fetch all employee pages + assignee/dropdown metadata and return role-scoped employees.
 * Prevents multi-page truncation or missing manager/branch/department metadata.
 */
export const fetchScopedEmployeesPool = async (user, options = {}) => {
  const { includeAssigneesMeta = true, failClosed = true } = options;
  const headers = getAuthHeaders();

  const [empRes, assigneesRes, deptRes, dropdownRes] = await Promise.all([
    fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=0&size=200`, { headers }).catch(() => null),
    includeAssigneesMeta
      ? fetch(API_ENDPOINTS.GET_TASK_ASSIGNEES, { headers }).catch(() => null)
      : Promise.resolve(null),
    includeAssigneesMeta
      ? fetch(API_ENDPOINTS.GET_ACTIVE_DEPARTMENTS, { headers }).catch(() => null)
      : Promise.resolve(null),
    API_ENDPOINTS.EMPLOYEE_DROPDOWN
      ? fetch(API_ENDPOINTS.EMPLOYEE_DROPDOWN, { headers }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const [empJson, assigneesJson, deptJson, dropdownJson] = await Promise.all([
    empRes && empRes.ok ? empRes.json().catch(() => null) : Promise.resolve(null),
    assigneesRes && assigneesRes.ok ? assigneesRes.json().catch(() => null) : Promise.resolve(null),
    deptRes && deptRes.ok ? deptRes.json().catch(() => null) : Promise.resolve(null),
    dropdownRes && dropdownRes.ok ? dropdownRes.json().catch(() => null) : Promise.resolve(null),
  ]);

  const byId = new Map();
  const mergeEmployee = (emp) => {
    const rawId = emp?.id ?? emp?.employeeId ?? emp?.userId;
    if (!emp || rawId == null) return;
    const key = String(rawId);
    const prev = byId.get(key) || {};
    const empDeptName =
      emp.departmentName ??
      (typeof emp.department === 'object' ? emp.department?.name : typeof emp.department === 'string' && isNaN(Number(emp.department)) ? emp.department : null);
    const empBranchName =
      emp.branchName ??
      (typeof emp.branch === 'object' ? emp.branch?.name : typeof emp.branch === 'string' && isNaN(Number(emp.branch)) ? emp.branch : null);
    byId.set(key, {
      ...prev,
      ...emp,
      id: emp.id ?? prev.id ?? rawId,
      name: cleanPersonName(emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || prev.name),
      roleName: emp.roleName || emp.role || prev.roleName || prev.role,
      departmentId: emp.departmentId ?? emp.department?.id ?? prev.departmentId,
      departmentName: empDeptName ?? prev.departmentName,
      branchId: emp.branchId ?? emp.branch?.id ?? prev.branchId,
      branchName: empBranchName ?? prev.branchName,
      managerId: emp.managerId ?? prev.managerId,
      reportingManagerId: emp.reportingManagerId ?? prev.reportingManagerId,
      reportingManagerName: emp.reportingManagerName ?? prev.reportingManagerName,
      managerName: emp.managerName ?? prev.managerName,
      hrId: emp.hrId ?? prev.hrId,
    });
  };

  if (empJson) {
    const page0Items = extractArray(empJson);
    page0Items.forEach(mergeEmployee);

    const body = unwrapResponse(empJson);
    const rawTotalPages = body?.totalPages ?? empJson?.totalPages;
    const rawTotalElements = body?.totalElements ?? empJson?.totalElements;
    const pageSize = body?.size ?? empJson?.size ?? 200;
    const totalPages = rawTotalPages || (rawTotalElements ? Math.ceil(rawTotalElements / pageSize) : 1);

    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 1; p < totalPages; p += 1) {
        pagePromises.push(
          fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=${p}&size=${pageSize}`, { headers })
            .then(r => (r.ok ? r.json().catch(() => null) : null))
            .catch(() => null)
        );
      }
      const otherPages = await Promise.all(pagePromises);
      otherPages.forEach(pg => {
        if (pg) extractArray(pg).forEach(mergeEmployee);
      });
    } else if (page0Items.length >= pageSize) {
      for (let p = 1; p < 15; p += 1) {
        const nextJson = await fetch(`${API_ENDPOINTS.GET_EMPLOYEES}?page=${p}&size=${pageSize}`, { headers })
          .then(r => (r.ok ? r.json().catch(() => null) : null))
          .catch(() => null);
        if (!nextJson) break;
        const items = extractArray(nextJson);
        if (items.length === 0) break;
        items.forEach(mergeEmployee);
        if (items.length < pageSize) break;
      }
    }
  }

  if (assigneesJson) {
    extractArray(assigneesJson).forEach(group => {
      if (Array.isArray(group.employees)) {
        group.employees.forEach(emp =>
          mergeEmployee({
            ...emp,
            departmentId: emp.departmentId ?? group.departmentId,
            departmentName: emp.departmentName ?? group.departmentName,
            branchId: emp.branchId ?? group.branchId,
            branchName: emp.branchName ?? group.branchName,
          })
        );
      } else {
        mergeEmployee(group);
      }
    });
  }

  if (dropdownJson) {
    extractArray(dropdownJson).forEach(mergeEmployee);
  }

  const rawEmployees = [...byId.values()];
  const departments = deptJson ? extractArray(deptJson) : [];
  const scopedEmployees = scopeEmployeesForRole(rawEmployees, user, departments, { failClosed });

  return {
    loaded: Boolean(empJson || assigneesJson || dropdownJson),
    rawEmployees,
    scopedEmployees,
    departments,
  };
};
