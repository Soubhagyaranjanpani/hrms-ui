import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  toLocalDateStr,
  getNextBusinessDateStr,
  isTaskOverdue,
  parseApiError,
} from './taskAccess';
import {
  scopeTasksForCurrentUser,
  canManagerCreateSubtask,
  canUserEditTask,
  hydrateMissingSubtasks,
} from './taskScope';
import {
  computeRoleDashboardMetrics,
  computeRoleNavBadges,
} from './taskMetrics';
import DailyWorkReport from './DailyWorkReport';
import { SubmitWorkModal } from './TaskSubmissions';
import CreateTask from './CreateTask';
import TaskDetail from './TaskDetail';

const mockNavigate = jest.fn();
let mockLocationState = {};

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/TaskDetail', state: mockLocationState }),
    MemoryRouter: ({ children }) => <div>{children}</div>,
  }),
  { virtual: true }
);

const mockUser = (overrides) => ({
  id: 1,
  employeeId: 1,
  name: 'Test User',
  roleName: 'Employee',
  departmentId: 10,
  branchId: 100,
  ...overrides,
});

describe('TaskModule role scoping, counters, and One-Day-One-Work', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('jwtToken', 'fake.jwt.token');
    jest.restoreAllMocks();
  });

  test('computes accurate role-based counters for Admin, Manager, and Employee', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = toLocalDateStr(yesterday);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const futureDate = toLocalDateStr(tomorrow);

    const tasks = [
      {
        id: 1,
        title: 'Main Task 1',
        status: 'IN_PROGRESS',
        assignedById: 99,
        assignedToId: 20, // Manager 20
        dueDate: futureDate,
        subtasks: [
          {
            id: 11,
            title: 'Subtask A',
            status: 'COMPLETED',
            assignedById: 20,
            assignedToId: 30, // Employee 30
            dueDate: futureDate,
          },
          {
            id: 12,
            title: 'Subtask B',
            status: 'PENDING_APPROVAL',
            assignedById: 20,
            assignedToId: 31, // Employee 31
            dueDate: pastDate,
          },
        ],
      },
      {
        id: 2,
        title: 'Main Task 2 (Other Manager)',
        status: 'IN_REVIEW',
        assignedById: 99,
        assignedToId: 21, // Other Manager 21
        dueDate: pastDate,
        subtasks: [],
      },
      {
        id: 3,
        title: 'Main Task 3 (Completed)',
        status: 'COMPLETED',
        assignedById: 99,
        assignedToId: 20,
        dueDate: pastDate,
        subtasks: [],
      },
    ];

    const submissions = [
      { id: 101, taskId: 11, employeeId: 30, status: 'SUBMITTED', finalSubmission: false },
      { id: 102, taskId: 2, employeeId: 21, status: 'SUBMITTED', finalSubmission: true },
    ];

    // Admin sees all 3 main tasks; Task 2 (IN_REVIEW) + its finalSubmission (102) count once
    const adminUser = mockUser({ id: 99, employeeId: 99, roleName: 'Admin' });
    const adminMetrics = computeRoleDashboardMetrics('Admin', tasks, submissions, adminUser);
    expect(adminMetrics.totalTasks).toBe(3);
    expect(adminMetrics.inProgressTasks).toBe(1);
    expect(adminMetrics.completedTasks).toBe(1);
    expect(adminMetrics.overdueTasks).toBe(1); // Task 2 is IN_REVIEW & past due
    expect(adminMetrics.pendingTaskReviews).toBe(1); // Task 2 (IN_REVIEW)
    expect(adminMetrics.pendingSubmissions).toBe(1); // Daily submission 101 only
    expect(adminMetrics.pendingReviews).toBe(2); // 1 task + 1 daily (no double count)

    // Manager 20 sees only their assigned tasks & team subtasks
    const managerUser = mockUser({ id: 20, employeeId: 20, roleName: 'Manager' });
    const teamEmps = [
      { id: 30, employeeId: 30, name: 'Emp 30', roleName: 'Employee', managerId: 20 },
      { id: 31, employeeId: 31, name: 'Emp 31', roleName: 'Employee', managerId: 20 },
    ];
    const mgrScoped = scopeTasksForCurrentUser(tasks, managerUser, teamEmps, [], { poolLoaded: true });
    expect(mgrScoped.map(t => t.id)).toEqual([1, 3]);

    const mgrSubs = submissions.filter(s => [1, 3, 11, 12].includes(s.taskId));
    const mgrMetrics = computeRoleDashboardMetrics('Manager', mgrScoped, mgrSubs, managerUser, teamEmps);
    expect(mgrMetrics.myAssignedTasks).toBe(2); // Tasks 1 and 3
    expect(mgrMetrics.myTeamSubtasks).toBe(2); // Subtasks 11 and 12
    expect(mgrMetrics.completedTasks).toBe(2); // Task 3 + Subtask 11
    expect(mgrMetrics.overdueTasks).toBe(1); // Subtask 12
    expect(mgrMetrics.pendingReviews).toBe(1); // Submission 101

    // Employee 30 sees only Subtask 11 (not Manager's tasks or Employee 31's tasks)
    const empUser = mockUser({ id: 30, employeeId: 30, roleName: 'Employee' });
    const empScoped = scopeTasksForCurrentUser(tasks, empUser);
    expect(empScoped.map(t => t.id)).toEqual([11]);
    const empMetrics = computeRoleDashboardMetrics('Employee', empScoped, [submissions[0]], empUser);
    expect(empMetrics.myTotalTasks).toBe(1);
    expect(empMetrics.myCompletedTasks).toBe(1);
    expect(empMetrics.myPendingTasks).toBe(0);
    expect(empMetrics.myInProgressTasks).toBe(0);
    expect(empMetrics.myOverdueTasks).toBe(0);

    const empBadges = computeRoleNavBadges('Employee', empScoped, [submissions[0]], empUser);
    expect(empBadges.pendingReviews).toBe(0);
    expect(empBadges.myTasks).toBe(1);
  });

  test('enforces subtask permissions: Admin cannot create subtasks, eligible Manager can, Employee cannot', () => {
    const admin = mockUser({ id: 1, employeeId: 1, roleName: 'Admin' });
    const manager = mockUser({ id: 20, employeeId: 20, roleName: 'Manager' });
    const otherManager = mockUser({ id: 21, employeeId: 21, roleName: 'Manager' });
    const emp = mockUser({ id: 30, employeeId: 30, roleName: 'Employee' });

    const mainTask = { id: 5, status: 'IN_PROGRESS', assignedById: 1, assignedToId: 20 };
    const subtask = { id: 51, parentTaskId: 5, status: 'IN_PROGRESS', assignedById: 20, assignedToId: 30 };

    expect(canManagerCreateSubtask(mainTask, admin)).toBe(false);
    expect(canManagerCreateSubtask(mainTask, manager)).toBe(true);
    expect(canManagerCreateSubtask(mainTask, otherManager)).toBe(false);
    expect(canManagerCreateSubtask(subtask, manager)).toBe(false);
    expect(canManagerCreateSubtask(mainTask, emp)).toBe(false);

    expect(canUserEditTask(mainTask, admin)).toBe(true);
    expect(canUserEditTask(mainTask, manager)).toBe(false); // assigned by Admin, not created by Manager
    expect(canUserEditTask(subtask, manager, [{ id: 30 }])).toBe(true);
    expect(canUserEditTask(subtask, emp)).toBe(false);
  });

  test('DailyWorkReport enforces One Day, One Work and displays existing status & manager feedback', async () => {
    const today = toLocalDateStr(new Date());
    const user = mockUser({ id: 30, employeeId: 30, roleName: 'Employee' });
    localStorage.setItem('userData', JSON.stringify(user));

    const existingSub = {
      id: 500,
      taskId: 10,
      employeeId: 30,
      submissionDate: today,
      progressPercent: 65,
      hoursSpent: 4,
      note: 'Completed API integration',
      status: 'APPROVED',
      finalSubmission: false,
      reviewedBy: 'Manager Alice',
      reviewComment: '[RATING:HIGH]\nGreat daily update!',
      submittedAt: `${today}T10:30:00`,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ response: [existingSub] }),
    });

    render(
      <DailyWorkReport
        tasks={[{ id: 10, title: 'Build Module', status: 'IN_PROGRESS', progress: 65 }]}
        selectedDate={today}
        submissions={[existingSub]}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getAllByText("Today's work has already been submitted.").length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Great daily update!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Today's work has already been submitted/i })).toBeDisabled();
  });

  test('SubmitWorkModal blocks second daily submission today while preserving final submission', async () => {
    const today = toLocalDateStr(new Date());
    const user = mockUser({ id: 30, employeeId: 30, roleName: 'Employee' });
    localStorage.setItem('userData', JSON.stringify(user));

    const existingSub = {
      id: 501,
      taskId: 10,
      employeeId: 30,
      submissionDate: today,
      progressPercent: 50,
      status: 'SUBMITTED',
      finalSubmission: false,
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ response: [existingSub] }),
    });

    render(
      <SubmitWorkModal
        task={{ id: 10, title: 'Build Module', progress: 50 }}
        submissions={[existingSub]}
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Today's work has already been submitted.")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /^Submit$/i });
    expect(submitBtn).toBeDisabled();

    // Checking FINAL submission re-enables final submission flow
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submitBtn).not.toBeDisabled();
  });

  test('TaskDetail hides Add Subtask from Admin and shows it to eligible Manager', async () => {
    const taskPayload = {
      id: 77,
      title: 'Q4 Audit',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignedById: 1,
      assignedToId: 20,
      branchId: 100,
      departmentId: 10,
      subtasks: [],
    };

    global.fetch = jest.fn().mockImplementation((url) => {
      if (String(url).includes('/submissions')) {
        return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ response: [] }) });
      }
      if (String(url).includes('/api/tasks/77')) {
        return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ response: taskPayload }) });
      }
      return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify({ response: [] }) });
    });

    // Admin render
    mockLocationState = { taskId: 77 };
    const adminUser = mockUser({ id: 1, employeeId: 1, roleName: 'Admin' });
    localStorage.setItem('userData', JSON.stringify(adminUser));
    const { unmount } = render(
      <MemoryRouter initialEntries={[{ pathname: '/TaskDetail', state: { taskId: 77 } }]}>
        <TaskDetail user={adminUser} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Q4 Audit')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add Subtask/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Edit Task/i })).toBeInTheDocument();
    unmount();

    // Eligible Manager render
    const mgrUser = mockUser({ id: 20, employeeId: 20, roleName: 'Manager' });
    localStorage.setItem('userData', JSON.stringify(mgrUser));
    render(
      <MemoryRouter initialEntries={[{ pathname: '/TaskDetail', state: { taskId: 77 } }]}>
        <TaskDetail user={mgrUser} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Q4 Audit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Subtask/i })).toBeInTheDocument();
  });

  test('CreateTask loads Branch -> Department -> Manager hierarchy from actual APIs', async () => {
    // CreateTask render
    mockLocationState = {};
    const adminUser = mockUser({ id: 1, employeeId: 1, roleName: 'Admin' });

    global.fetch = jest.fn().mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/branches/list')) {
        return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify([{ id: 1, name: 'HQ Branch' }]) });
      }
      if (u.includes('/departments/list')) {
        return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify([{ id: 10, name: 'Engineering', branchId: 1 }]) });
      }
      if (u.includes('/api/tasks/assignees?departmentId=10')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify([
            { id: 20, name: 'Manager Bob', roleName: 'Manager', departmentId: 10, branchId: 1 },
            { id: 30, name: 'Emp Alice', roleName: 'Employee', departmentId: 10, branchId: 1 },
          ]),
        });
      }
      if (u.includes('/api/tasks/assignees')) {
        return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify([]) });
      }
      return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify([]) });
    });

    render(
      <MemoryRouter>
        <CreateTask user={adminUser} />
      </MemoryRouter>
    );

    expect(await screen.findByText('Create New Task')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1' } });
    fireEvent.change(selects[1], { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Manager Bob/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('option', { name: /Emp Alice/i })).not.toBeInTheDocument();
  });

  test('utility helpers handle 401/403, overdue dates, and business date advancement', () => {
    expect(parseApiError({ status: 401 }, {}, 'Err')).toMatch(/401/);
    expect(parseApiError({ status: 403 }, {}, 'Err')).toMatch(/403/);
    expect(isTaskOverdue({ dueDate: '2020-01-01T00:00:00', status: 'IN_PROGRESS' })).toBe(true);
    expect(isTaskOverdue({ dueDate: '2020-01-01T00:00:00', status: 'COMPLETED' })).toBe(false);
    // Friday -> Monday
    expect(getNextBusinessDateStr(new Date('2026-11-27T10:00:00'))).toBe('2026-11-30');
  });

  test('hydrateMissingSubtasks fetches task details when list response omits subtasks', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        response: {
          id: 5,
          subtasks: [{ id: 51, title: 'Sub 1', status: 'IN_PROGRESS', assignedToId: 30 }],
        },
      }),
    });

    const hydrated = await hydrateMissingSubtasks([{ id: 5, title: 'Main 5', subtasks: null }]);
    expect(hydrated[0].subtasks).toHaveLength(1);
    expect(hydrated[0].subtasks[0].id).toBe(51);
  });
});
