
import React, { useState } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt
} from 'react-icons/fa';

import './DailyWork.css';

export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function DailyWorkCalendar({
  submissions = [],
  selectedDate,
  onDateSelect
}) {

  const [currentMonth, setCurrentMonth] =
    useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const today = formatDate(new Date());

  const firstDay = new Date(
    year, month, 1
  ).getDay();

  const totalDays = new Date(
    year, month + 1, 0
  ).getDate();

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(year, month + offset, 1)
    );
  };

  const getStatus = (reports) => {

    if (!reports.length) return 'empty';

    if (reports.some(
      r => r.status === 'SUBMITTED'
    )) return 'pending';

    if (reports.some(
      r => r.status === 'REJECTED'
    )) return 'rejected';

    if (reports.every(
      r => r.status === 'APPROVED'
    )) return 'approved';

    return 'empty';
  };

  return (
    <div className="dw-card">

      <div className="dw-header">
        <div className="dw-title-wrap">
          <div className="dw-title-icon">
            <FaCalendarAlt size={15} />
          </div>
          <div>
            <h3 className="dw-title">Work Calendar</h3>
            <p className="dw-subtitle">Click any date to view or log work</p>
          </div>
        </div>
      </div>

      <div className="dw-month-nav">
        <button
          type="button"
          className="dw-icon-btn"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          <FaChevronLeft size={11} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3>
            {currentMonth.toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <button
            type="button"
            className="dw-today-btn"
            onClick={() => {
              setCurrentMonth(new Date());
              onDateSelect(today);
            }}
          >
            Today
          </button>
        </div>

        <button
          type="button"
          className="dw-icon-btn"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <FaChevronRight size={11} />
        </button>
      </div>

      <div className="dw-calendar-grid">

        {[
          'Sun', 'Mon', 'Tue', 'Wed',
          'Thu', 'Fri', 'Sat'
        ].map(day => (
          <div
            key={day}
            className="dw-weekday"
          >
            {day}
          </div>
        ))}

        {Array.from(
          { length: firstDay },
          (_, i) => (
            <div key={`empty-${i}`} />
          )
        )}

        {Array.from(
          { length: totalDays },
          (_, i) => {

            const day = i + 1;

            const date = formatDate(
              new Date(year, month, day)
            );

            const reports = submissions.filter(
              item => item.submissionDate === date
            );

            const status = getStatus(reports);

            return (
              <button
                type="button"
                key={date}
                className={[
                  'dw-calendar-day',
                  `dw-day-${status}`,
                  selectedDate === date
                    ? 'dw-selected' : '',
                  today === date
                    ? 'dw-today' : ''
                ].join(' ')}
                onClick={() =>
                  onDateSelect(date)
                }
                aria-pressed={
                  selectedDate === date
                }
              >

                <strong>{day}</strong>

                {reports.length > 0 && (
                  <small>
                    {reports.length} report
                    {reports.length > 1 ? 's' : ''}
                  </small>
                )}

                {date === today && (
                  <small>Today</small>
                )}

              </button>
            );
          }
        )}

      </div>

      <div className="dw-legend">

        <span>
          <i className="dw-dot approved" />
          Approved
        </span>

        <span>
          <i className="dw-dot pending" />
          Pending
        </span>

        <span>
          <i className="dw-dot rejected" />
          Rejected
        </span>

        <span>
          <i className="dw-dot empty" />
          No Report
        </span>

      </div>

    </div>
  );
}
