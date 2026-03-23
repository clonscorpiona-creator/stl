'use client';

/*
 * 🕐 STL Platform - Clock Calendar Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-24
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

import { useState, useEffect } from 'react';

export default function ClockCalendar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const day = currentTime.getDate();
  const month = currentTime.toLocaleDateString('ru-RU', { month: 'short' });
  const weekday = currentTime.toLocaleDateString('ru-RU', { weekday: 'short' });

  return (
    <div className="clock-calendar">
      <div className="clock-time">
        {hours}:{minutes}
      </div>
      <div className="calendar-date">
        <div className="calendar-day">{day}</div>
        <div className="calendar-month">{month}</div>
      </div>
      <div className="calendar-weekday">{weekday}</div>
    </div>
  );
}
