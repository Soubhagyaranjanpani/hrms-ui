import { API_ENDPOINTS, getAuthHeaders, extractArray } from '../config/api.config';
import {
  getNormalizedRole,
  cleanPersonName,
  isTaskOverdue,
  unwrapResponse,
} from './taskAccess';
import {
  getStoredUser,
  getMyOrgScope,
  fetchScopedEmployeesPool,
  isTaskAssignedToIds,
  isTaskCreatedByIds,
  flattenUniqueTasks,
  scopeTasksForCurrentUser,
  hydrateMissingSubtasks,
} from './taskScope';

const collectUniqueSubtasks = (tasks = []) => {
  const map = new Map();
  (Array.isArray(tasks) ? tasks : []).forEach(t => {
    if (!t || t.id == null) return;
    if (t.parentTaskId || t.parentId) {
      map.set(String(t.id), t);
    }
    if (Array.isArray(t.subtasks)) {
      t.subtasks.forEach(st => {
        if (st && st.id != null) {
          map.set(String(st.id), { ...st, parentTaskId: st.parentTaskId ?? st.parentId ?? t.id });
        }
      });
    }
  });
  return [...map.values()];
};

export const computeRoleDashboardMetrics = (
  role,
  authorizedTasks = [],
  submissions = [],
  user = null,
  scopedEmployees = []
) => {
  const currentUser = user || getStoredUser();
  const { myIds, myName } = getMyOrgScope(scopedEmployees, currentUser);
  const safeTasks = Array.isArray(authorizedTasks) ? authorizedTasks : [];
  const safeSubs = Array.isArray(submissions) ? submissions : [];
  const allUnique = flattenUniqueTasks(safeTasks);

  // Count daily submissions separately from final submissions so an IN_REVIEW task + its finalSubmission are never double-counted
  const isTaskInReview = (t) => t.status === 'IN_REVIEW' || t.status === 'CHANGE_REQUESTED';

  const pendingDailySubTaskIds = new Set(
    safeSubs
      .filter(s => s.status === 'SUBMITTED' && !s.finalSubmission && s.taskId != null)
      .map(s => String(s.taskId))
  );

  const isTaskPendingReview = (t) =>
    isTaskInReview(t) || pendingDailySubTaskIds.has(String(t.id));

  if (role === 'Employee') {
    const myFlat = allUnique.filter(t => isTaskAssignedToIds(t, myIds, myName));
    const list = myFlat.length > 0 ? myFlat : safeTasks;
    const total = list.length;
    const pending = list.filter(t => t.status === 'PENDING_APPROVAL').length;
    const inProgress = list.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = list.filter(t => t.status === 'COMPLETED').length;
    const overdue = list.filter(isTaskOverdue).length;
    const inReview = list.filter(t => t.status === 'IN_REVIEW').length;
    const changeReq = list.filter(t => t.status === 'CHANGE_REQUESTED').length;
    const rejected = list.filter(t => t.status === 'REJECTED').length;

    return {
      myTotalTasks: total,
      myPendingTasks: pending,
      myInProgressTasks: inProgress,
      myCompletedTasks: completed,
      myOverdueTasks: overdue,
      inReview,
      changeReq,
      rejected,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      dailySubmissionsCount: safeSubs.length,
    };
  }

  if (role === 'Manager') {
    const myAssigned = safeTasks.filter(
      t => !(t.parentTaskId || t.parentId) && isTaskAssignedToIds(t, myIds, myName)
    );
    const teamSubtasks = collectUniqueSubtasks(safeTasks).filter(
      st => !isTaskAssignedToIds(st, myIds, myName) || isTaskCreatedByIds(st, myIds, myName) || Boolean(st.parentTaskId || st.parentId)
    );

    const teamAndOwnIds = new Map();
    [...safeTasks, ...teamSubtasks].forEach(t => {
      if (t?.id != null) teamAndOwnIds.set(String(t.id), t);
    });
    const combined = [...teamAndOwnIds.values()];

    const completed = combined.filter(t => t.status === 'COMPLETED').length;
    const overdue = combined.filter(isTaskOverdue).length;
    const reviewTaskIds = new Set(combined.filter(isTaskInReview).map(t => String(t.id)));

    const mySubIds = new Set(
      safeSubs
        .filter(s => s.employeeId != null && myIds.has(String(s.employeeId)))
        .map(s => String(s.id))
    );
    const uncountedFinalTaskIds = new Set();
    let reviewableDailySubmissions = 0;

    safeSubs.forEach(s => {
      if (s.status !== 'SUBMITTED' || mySubIds.has(String(s.id))) return;
      if (s.finalSubmission) {
        if (s.taskId != null && !reviewTaskIds.has(String(s.taskId))) {
          uncountedFinalTaskIds.add(String(s.taskId));
        }
      } else {
        reviewableDailySubmissions += 1;
      }
    });

    const pendingTaskReviews = reviewTaskIds.size + uncountedFinalTaskIds.size;
    const pendingReviews = pendingTaskReviews + reviewableDailySubmissions;
    const total = combined.length;

    return {
      myAssignedTasks: myAssigned.length,
      myTeamSubtasks: teamSubtasks.length,
      completedTasks: completed,
      pendingReviews,
      pendingTaskReviews,
      reviewableSubmissions: reviewableDailySubmissions,
      overdueTasks: overdue,
      total,
      pending: combined.filter(t => t.status === 'PENDING_APPROVAL').length,
      active: combined.filter(t => t.status === 'IN_PROGRESS').length,
      inReview: combined.filter(t => t.status === 'IN_REVIEW').length,
      changeReq: combined.filter(t => t.status === 'CHANGE_REQUESTED').length,
      rejected: combined.filter(t => t.status === 'REJECTED').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      isTaskPendingReview,
    };
  }

  // Admin / HR
  const total = safeTasks.length;
  const pending = safeTasks.filter(t => t.status === 'PENDING_APPROVAL').length;
  const active = safeTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReview = safeTasks.filter(t => t.status === 'IN_REVIEW').length;
  const changeReq = safeTasks.filter(t => t.status === 'CHANGE_REQUESTED').length;
  const completed = safeTasks.filter(t => t.status === 'COMPLETED').length;
  const rejected = safeTasks.filter(t => t.status === 'REJECTED').length;
  const overdue = safeTasks.filter(isTaskOverdue).length;

  const reviewTaskIds = new Set(allUnique.filter(isTaskInReview).map(t => String(t.id)));
  const uncountedFinalTaskIds = new Set();
  let pendingDailySubmissions = 0;

  safeSubs.forEach(s => {
    if (s.status !== 'SUBMITTED') return;
    if (s.finalSubmission) {
      if (s.taskId != null && !reviewTaskIds.has(String(s.taskId))) {
        uncountedFinalTaskIds.add(String(s.taskId));
      }
    } else {
      pendingDailySubmissions += 1;
    }
  });

  const pendingTaskReviews = inReview + changeReq + uncountedFinalTaskIds.size;
  const pendingReviews = pendingTaskReviews + pendingDailySubmissions;

  return {
    totalTasks: total,
    pendingTasks: pending,
    inProgressTasks: active,
    completedTasks: completed,
    overdueTasks: overdue,
    pendingReviews,
    pendingTaskReviews,
    pendingSubmissions: pendingDailySubmissions,
    inReview,
    changeReq,
    rejected,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    isTaskPendingReview,
  };
};

export const computeRoleNavBadges = (
  role,
  authorizedTasks = [],
  submissions = [],
  user = null,
  scopedEmployees = []
) => {
  const currentUser = user || getStoredUser();
  const { myIds, myName } = getMyOrgScope(scopedEmployees, currentUser);
  const safeTasks = Array.isArray(authorizedTasks) ? authorizedTasks : [];
  const allUnique = flattenUniqueTasks(safeTasks);
  const subtasks = collectUniqueSubtasks(safeTasks);
  const safeSubs = Array.isArray(submissions) ? submissions : [];

  const myAssignedAll = allUnique.filter(t => isTaskAssignedToIds(t, myIds, myName));

  if (role === 'Employee') {
    const list = myAssignedAll.length > 0 ? myAssignedAll : safeTasks;
    return {
      myTasks: list.length,
      subtasks: list.filter(t => Boolean(t.parentTaskId || t.parentId)).length,
      pendingTasks: list.filter(t => t.status === 'PENDING_APPROVAL').length,
      dailySubmissions: safeSubs.length,
      pendingReviews: 0,
      overdueTasks: list.filter(isTaskOverdue).length,
    };
  }

  if (role === 'Manager') {
    const teamAndOwn = allUnique;
    const reviewTaskIds = new Set(
      teamAndOwn
        .filter(t => t.status === 'IN_REVIEW' || t.status === 'CHANGE_REQUESTED')
        .map(t => String(t.id))
    );
    const uncountedFinalTaskIds = new Set();
    let reviewableDailySubs = 0;

    safeSubs.forEach(s => {
      if (s.status !== 'SUBMITTED') return;
      if (s.employeeId != null && myIds.has(String(s.employeeId))) return;
      if (s.finalSubmission) {
        if (s.taskId != null && !reviewTaskIds.has(String(s.taskId))) {
          uncountedFinalTaskIds.add(String(s.taskId));
        }
      } else {
        reviewableDailySubs += 1;
      }
    });

    return {
      myTasks: safeTasks.filter(t => isTaskAssignedToIds(t, myIds, myName)).length,
      teamTasks: safeTasks.length,
      subtasks: subtasks.length,
      pendingTasks: teamAndOwn.filter(t => t.status === 'PENDING_APPROVAL').length,
      dailySubmissions: safeSubs.length,
      pendingReviews: reviewTaskIds.size + uncountedFinalTaskIds.size + reviewableDailySubs,
      overdueTasks: teamAndOwn.filter(isTaskOverdue).length,
    };
  }

  // Admin / HR
  const reviewTaskIds = new Set(
    allUnique
      .filter(t => t.status === 'IN_REVIEW' || t.status === 'CHANGE_REQUESTED')
      .map(t => String(t.id))
  );
  const uncountedFinalTaskIds = new Set();
  let pendingDailySubs = 0;

  safeSubs.forEach(s => {
    if (s.status !== 'SUBMITTED') return;
    if (s.finalSubmission) {
      if (s.taskId != null && !reviewTaskIds.has(String(s.taskId))) {
        uncountedFinalTaskIds.add(String(s.taskId));
      }
    } else {
      pendingDailySubs += 1;
    }
  });

  return {
    myTasks: safeTasks.length,
    subtasks: subtasks.length,
    pendingTasks: safeTasks.filter(t => t.status === 'PENDING_APPROVAL').length,
    dailySubmissions: safeSubs.length,
    pendingReviews: reviewTaskIds.size + uncountedFinalTaskIds.size + pendingDailySubs,
    overdueTasks: safeTasks.filter(isTaskOverdue).length,
  };
};

export const fetchAuthorizedTaskSummary = async (user = null) => {
  const currentUser = user || getStoredUser();
  const role = getNormalizedRole(currentUser);
  const isEmployee = role === 'Employee';
  const headers = getAuthHeaders();

  const tasksUrl = isEmployee ? API_ENDPOINTS.GET_MY_TASKS : API_ENDPOINTS.GET_ALL_TASKS;

  const [taskRes, empPool] = await Promise.all([
    fetch(tasksUrl, { headers }).catch(() => null),
    !isEmployee
      ? fetchScopedEmployeesPool(currentUser, { includeAssigneesMeta: true }).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!taskRes || !taskRes.ok) {
    return { ok: false, status: taskRes?.status || 0, badges: null };
  }

  const taskJson = await taskRes.json().catch(() => null);
  const rawTasks = extractArray(taskJson);
  const preScoped = scopeTasksForCurrentUser(
    rawTasks,
    currentUser,
    empPool?.scopedEmployees || [],
    empPool?.departments || [],
    { poolLoaded: Boolean(empPool?.loaded) }
  );
  const hydratedTasks = !isEmployee
    ? await hydrateMissingSubtasks(preScoped, headers)
    : preScoped;
  const scopedTasks = scopeTasksForCurrentUser(
    hydratedTasks,
    currentUser,
    empPool?.scopedEmployees || [],
    empPool?.departments || [],
    { poolLoaded: Boolean(empPool?.loaded) }
  );

  const uniqueForSubs = flattenUniqueTasks(scopedTasks);
  const subResults = await Promise.allSettled(
    uniqueForSubs.slice(0, 60).map(t =>
      fetch(API_ENDPOINTS.GET_TASK_SUBMISSIONS(t.id), { headers })
        .then(r => (r.ok ? r.json().catch(() => null) : null))
        .then(d => {
          const body = unwrapResponse(d);
          if (Array.isArray(body)) return body;
          return extractArray(d);
        })
    )
  );

  const { myIds } = getMyOrgScope(empPool?.scopedEmployees || [], currentUser);
  const subMap = new Map();
  subResults.forEach(res => {
    if (res.status !== 'fulfilled') return;
    res.value.forEach(item => {
      if (!item || item.id == null) return;
      if (isEmployee && item.employeeId != null && myIds.size > 0 && !myIds.has(String(item.employeeId))) {
        return;
      }
      subMap.set(String(item.id), {
        ...item,
        employeeName: cleanPersonName(item.employeeName),
      });
    });
  });

  const submissions = [...subMap.values()];
  const badges = computeRoleNavBadges(
    role,
    scopedTasks,
    submissions,
    currentUser,
    empPool?.scopedEmployees || []
  );

  return { ok: true, status: 200, badges, tasks: scopedTasks, submissions };
};
