import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaChartBar, FaTasks, FaSitemap, FaClock, FaFileAlt,
  FaClipboardCheck, FaExclamationTriangle, FaChartLine, FaStar
} from 'react-icons/fa';
import { getNormalizedRole, TASK_UPDATED_EVENT } from './taskAccess';
import { getStoredUser } from './taskScope';
import { fetchAuthorizedTaskSummary } from './taskMetrics';
import './TaskModule.css';

export default function TaskModuleNav({ user, badgesOverride = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = user || getStoredUser();
  const role = getNormalizedRole(currentUser);
  const isEmployee = role === 'Employee';
  const isManager = role === 'Manager';

  const [badges, setBadges] = useState(badgesOverride);

  useEffect(() => {
    setBadges(badgesOverride);
  }, [badgesOverride]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const res = await fetchAuthorizedTaskSummary(currentUser);
      if (active && res?.ok && res.badges) {
        setBadges(res.badges);
      }
    };
    if (!badgesOverride) {
      refresh();
    }
    const onUpdated = () => refresh();
    window.addEventListener(TASK_UPDATED_EVENT, onUpdated);
    return () => {
      active = false;
      window.removeEventListener(TASK_UPDATED_EVENT, onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, badgesOverride]);

  const path = location.pathname;
  const navState = location.state || {};

  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FaChartBar size={11} />,
      active: path === '/TaskDashboard',
      onClick: () => navigate('/TaskDashboard'),
    },
    {
      id: 'my-tasks',
      label: isEmployee || isManager ? 'My Tasks' : 'All Tasks',
      icon: <FaTasks size={11} />,
      badge: badges?.myTasks,
      active:
        path === '/TaskList' &&
        !navState.status &&
        !navState.onlySubtasks &&
        (isEmployee ? true : isManager ? navState.scope === 'mine' : navState.scope !== 'mine'),
      onClick: () =>
        navigate('/TaskList', {
          state: { scope: isEmployee || isManager ? 'mine' : 'all' },
        }),
    },
  ];

  if (isManager) {
    items.push({
      id: 'team-tasks',
      label: 'Team Tasks',
      icon: <FaTasks size={11} />,
      badge: badges?.teamTasks,
      active: path === '/TaskList' && !navState.status && !navState.onlySubtasks && navState.scope !== 'mine',
      onClick: () => navigate('/TaskList', { state: { scope: 'all' } }),
    });
  }

  if (!isEmployee) {
    items.push({
      id: 'subtasks',
      label: 'Subtasks',
      icon: <FaSitemap size={11} />,
      badge: badges?.subtasks,
      active: path === '/TaskList' && Boolean(navState.onlySubtasks),
      onClick: () =>
        navigate('/TaskList', {
          state: { scope: 'all', onlySubtasks: true },
        }),
    });
  }

  items.push(
    {
      id: 'pending-tasks',
      label: 'Pending Tasks',
      icon: <FaClock size={11} />,
      badge: badges?.pendingTasks,
      tone: 'amber',
      active: path === '/TaskList' && navState.status === 'PENDING_APPROVAL',
      onClick: () =>
        navigate('/TaskList', {
          state: { status: 'PENDING_APPROVAL', scope: isEmployee ? 'mine' : 'all' },
        }),
    },
    {
      id: 'daily-submissions',
      label: 'Daily Submissions',
      icon: <FaFileAlt size={11} />,
      badge: badges?.dailySubmissions,
      active: path === '/DailyWork' && navState.tab !== 'review',
      onClick: () => navigate('/DailyWork', { state: { tab: 'reports' } }),
    }
  );

  if (!isEmployee) {
    items.push({
      id: 'pending-reviews',
      label: 'Pending Reviews',
      icon: <FaClipboardCheck size={11} />,
      badge: badges?.pendingReviews,
      tone: badges?.pendingReviews > 0 ? 'indigo' : undefined,
      active: path === '/DailyWork' && navState.tab === 'review',
      onClick: () => navigate('/DailyWork', { state: { tab: 'review' } }),
    });
  }

  items.push(
    {
      id: 'overdue-tasks',
      label: 'Overdue Tasks',
      icon: <FaExclamationTriangle size={11} />,
      badge: badges?.overdueTasks,
      tone: badges?.overdueTasks > 0 ? 'danger' : undefined,
      active: path === '/TaskList' && navState.status === 'OVERDUE',
      onClick: () =>
        navigate('/TaskList', {
          state: { status: 'OVERDUE', scope: isEmployee ? 'mine' : 'all' },
        }),
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: <FaChartLine size={11} />,
      active: path === '/TaskProgress',
      onClick: () => navigate('/TaskProgress'),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <FaStar size={11} />,
      active: path === '/performance',
      onClick: () => navigate('/performance'),
    }
  );

  return (
    <nav className="tm-subnav" aria-label="Task Management Navigation">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`tm-subnav-item ${item.active ? 'active' : ''}`}
          onClick={item.onClick}
        >
          {item.icon}
          <span>{item.label}</span>
          {typeof item.badge === 'number' && (
            <span
              className={`tm-subnav-badge ${item.tone ? `tm-subnav-badge--${item.tone}` : ''}`}
            >
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
