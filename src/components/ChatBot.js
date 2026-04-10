import React, { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────
   YOUR ORIGINAL STYLES - KEPT EXACTLY THE SAME
───────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

/* tokens */
:root {
  --ari-bg      : #0e0d1c;
  --ari-card    : #181629;
  --ari-card2   : #201e38;
  --ari-border  : rgba(255,255,255,0.08);
  --ari-txt     : #eeeaff;
  --ari-muted   : rgba(180,170,255,0.45);
  --ari-p       : #6366f1;
  --ari-disp    : 'Syne', sans-serif;
  --ari-body    : 'DM Sans', sans-serif;
}

/* animations */
@keyframes ariUp    { from{opacity:0;transform:translateY(28px) scale(.9)} to{opacity:1;transform:none} }
@keyframes ariFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes ariSpin  { to{transform:rotate(360deg)} }
@keyframes ariPop   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
@keyframes ariRing  { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.3);opacity:0} }
@keyframes ariGrad  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes ariShine { 0%{left:-70%} 100%{left:130%} }
@keyframes ariDot   { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-6px);opacity:1} }
@keyframes ariIn    { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:none} }
@keyframes ariInR   { from{opacity:0;transform:translateX(12px)}  to{opacity:1;transform:none} }
@keyframes ariTwink { 0%,100%{opacity:.06} 50%{opacity:.7} }
@keyframes ariGlow  { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,.5)} 50%{box-shadow:0 0 32px rgba(236,72,153,.65)} }

/* ── FAB with HIDE/SHOW support ── */
.ari-fab-root {
  position: fixed;
  bottom: 26px;
  right: 26px;
  z-index: 9999;
  font-family: var(--ari-body);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
}

/* WHEN CHAT IS OPEN - HIDE THE FAB BUTTON */
.ari-fab-root.ari-hidden {
  opacity: 0;
  transform: scale(0);
  visibility: hidden;
  pointer-events: none;
}

/* WHEN CHAT IS CLOSED - SHOW THE FAB BUTTON */
.ari-fab-root:not(.ari-hidden) {
  opacity: 1;
  transform: scale(1);
  visibility: visible;
  pointer-events: auto;
}

.ari-ring1, .ari-ring2 {
  position:absolute; inset:-4px; border-radius:50%;
  border:2px solid; pointer-events:none;
  animation: ariRing 2.2s ease-out infinite;
}
.ari-ring1 { border-color:rgba(99,102,241,.65); }
.ari-ring2 { border-color:rgba(236,72,153,.5); animation-delay:.75s; }

.ari-fab-btn {
  position:relative; width:60px; height:60px; border-radius:50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #06b6d4);
  background-size: 300% 300%;
  animation: ariGrad 4s ease infinite, ariGlow 3s ease-in-out infinite;
  border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition: transform .22s cubic-bezier(.34,1.56,.64,1);
  overflow:hidden;
}
.ari-fab-btn::before {
  content:''; position:absolute; top:-10px; left:-70%;
  width:45%; height:220%; background:rgba(255,255,255,.15);
  transform:skewX(-20deg);
  animation: ariShine 3s ease-in-out infinite;
}
.ari-fab-btn:hover  { transform:scale(1.12) rotate(-5deg); }
.ari-fab-btn:active { transform:scale(.91); }
.ari-fab-icon { font-size:26px; position:relative; z-index:1; animation:ariFloat 3s ease-in-out infinite; }
.ari-fab-badge {
  position:absolute; top:-2px; right:-2px;
  width:20px; height:20px; border-radius:50%;
  background:linear-gradient(135deg,#ec4899,#f97316);
  border:2.5px solid var(--ari-bg);
  font-size:10px; font-weight:800; color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-family:var(--ari-disp);
  animation: ariPop 1.5s ease-in-out infinite;
}

/* ── CHAT WINDOW ── */
.ari-window {
  position: fixed;
  bottom: 98px;
  right: 26px;
  width: 380px;
  height: 580px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: var(--ari-bg);
  border: 1px solid rgba(99,102,241,.25);
  box-shadow: 0 32px 80px rgba(0,0,0,.75), 0 8px 24px rgba(99,102,241,.3);
  overflow: hidden;
  z-index: 9998;
  animation: ariUp .38s cubic-bezier(.34,1.56,.64,1) forwards;
  transform-origin: bottom right;
  font-family: var(--ari-body);
}

/* mobile */
@media (max-width: 480px) {
  .ari-window {
    width: calc(100vw - 16px);
    right: 8px;
    bottom: 92px;
    height: 72vh;
    max-height: calc(100vh - 100px);
    border-radius: 20px;
  }
  .ari-fab-root { bottom:16px; right:16px; }
}

/* ── HEADER ── */
.ari-head {
  flex-shrink: 0;
  min-height: 74px;
  padding: 14px 16px;
  background: linear-gradient(135deg,#1a1838 0%,#2e1d6e 50%,#12103a 100%);
  background-size: 200% 200%;
  animation: ariGrad 8s ease infinite;
  position: relative;
  overflow: hidden;
}
.ari-stars { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.ari-star  { position:absolute; border-radius:50%; background:#fff; }

.ari-head-row {
  display: flex;
  align-items: center;
  gap: 11px;
  position: relative;
  z-index: 1;
}

.ari-av-wrap { position:relative; flex-shrink:0; }
.ari-av {
  width: 46px; height: 46px; border-radius: 50%;
  background: linear-gradient(135deg,#6366f1,#ec4899,#06b6d4);
  background-size: 200% 200%;
  animation: ariGrad 4s ease infinite;
  display:flex; align-items:center; justify-content:center;
  font-size: 21px;
  border: 2px solid rgba(255,255,255,.18);
  box-shadow: 0 4px 18px rgba(99,102,241,.55);
}
.ari-av-orbit {
  position:absolute; inset:-5px; border-radius:50%;
  border: 1.5px dashed rgba(99,102,241,.55);
  animation: ariSpin 7s linear infinite;
}
.ari-av-orbit::after {
  content:''; position:absolute;
  top:-3px; left:50%; transform:translateX(-50%);
  width:6px; height:6px; border-radius:50%;
  background:linear-gradient(135deg,#ec4899,#f97316);
}
.ari-online {
  position:absolute; bottom:1px; right:1px;
  width:11px; height:11px; border-radius:50%;
  background:#10b981; border:2px solid #0e0d1c;
  box-shadow:0 0 7px #10b981;
  animation: ariPop 2s ease-in-out infinite;
}

.ari-head-info { flex:1; min-width:0; }
.ari-head-name {
  font-family: var(--ari-disp); font-size:19px; font-weight:800;
  margin:0; line-height:1.1;
  background: linear-gradient(90deg,#fff,#a5b4fc,#67e8f9);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.ari-head-sub {
  font-size:11px; color:rgba(180,170,255,.65);
  margin:2px 0 0; display:flex; align-items:center; gap:5px;
}
.ari-live-dot {
  width:6px; height:6px; border-radius:50%;
  background:#10b981; box-shadow:0 0 5px #10b981;
  display:inline-block; animation:ariPop 1.8s ease-in-out infinite;
}
.ari-close-btn {
  flex-shrink:0; width:32px; height:32px; border-radius:50%;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
  cursor:pointer; color:rgba(255,255,255,.6); font-size:15px;
  display:flex; align-items:center; justify-content:center;
  transition: all .18s;
}
.ari-close-btn:hover { background:rgba(239,68,68,.3); color:#fff; }

/* ── CHIPS ── */
.ari-chips {
  flex-shrink: 0;
  min-height: 44px;
  display: flex;
  gap: 7px;
  padding: 9px 13px;
  background: var(--ari-card);
  border-bottom: 1px solid var(--ari-border);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.ari-chips::-webkit-scrollbar { display:none; }

.ari-chip {
  flex-shrink: 0;
  padding: 6px 13px;
  border-radius: 50px;
  font-size: 11.5px; font-weight: 600;
  border: none; cursor: pointer;
  color: #fff; white-space: nowrap;
  font-family: var(--ari-body);
  position: relative; overflow: hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), filter .18s;
}
.ari-chip::after {
  content:''; position:absolute; top:-10px; left:-70%;
  width:45%; height:220%; background:rgba(255,255,255,.22);
  transform:skewX(-20deg); transition:left .4s;
}
.ari-chip:hover::after { left:130%; }
.ari-chip:hover  { transform:translateY(-2px) scale(1.07); filter:brightness(1.15); }
.ari-chip:active { transform:scale(.93); }

.ari-chip-a { background:linear-gradient(135deg,#ec4899,#f97316); box-shadow:0 3px 12px rgba(236,72,153,.45); }
.ari-chip-b { background:linear-gradient(135deg,#06b6d4,#6366f1); box-shadow:0 3px 12px rgba(6,182,212,.4); }
.ari-chip-c { background:linear-gradient(135deg,#10b981,#06b6d4); box-shadow:0 3px 12px rgba(16,185,129,.4); }
.ari-chip-d { background:linear-gradient(135deg,#6366f1,#8b5cf6); box-shadow:0 3px 12px rgba(99,102,241,.45); }
.ari-chip-e { background:linear-gradient(135deg,#f59e0b,#ef4444); box-shadow:0 3px 12px rgba(245,158,11,.4); }

/* ── MESSAGES ── */
.ari-msgs {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 13px 12px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  scroll-behavior: smooth;
}
.ari-msgs::-webkit-scrollbar { width:3px; }
.ari-msgs::-webkit-scrollbar-thumb { background:rgba(99,102,241,.3); border-radius:3px; }

.ari-empty {
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:8px; text-align:center; padding:20px; color:var(--ari-muted);
}
.ari-empty-ico { font-size:42px; animation:ariFloat 3s ease-in-out infinite; }
.ari-empty-lbl { font-size:13px; line-height:1.6; }

.ari-msg { max-width:85%; display:flex; flex-direction:column; gap:3px; }
.ari-msg.bot  { align-self:flex-start; }
.ari-msg.user { align-self:flex-end; align-items:flex-end; }

.ari-msg-row { display:flex; align-items:flex-end; gap:7px; }
.ari-msg.user .ari-msg-row { flex-direction:row-reverse; }

.ari-mini-av {
  width:27px; height:27px; border-radius:50%;
  background:linear-gradient(135deg,#6366f1,#ec4899);
  display:flex; align-items:center; justify-content:center;
  font-size:13px; flex-shrink:0;
  box-shadow:0 2px 8px rgba(99,102,241,.4);
}

.ari-bubble {
  padding:10px 14px; border-radius:18px;
  font-size:13px; line-height:1.7; word-break:break-word;
}
.ari-msg.bot .ari-bubble {
  background:var(--ari-card2); color:var(--ari-txt);
  border:1px solid rgba(255,255,255,.07);
  border-bottom-left-radius:4px;
  animation: ariIn .25s cubic-bezier(.34,1.56,.64,1) both;
}
.ari-msg.user .ari-bubble {
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff; border-bottom-right-radius:4px;
  box-shadow:0 4px 16px rgba(99,102,241,.4);
  animation: ariInR .25s cubic-bezier(.34,1.56,.64,1) both;
}
.ari-msg-time { font-size:9.5px; color:var(--ari-muted); padding:0 4px; }

/* action buttons */
.ari-acts { display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }
.ari-act {
  padding:5px 12px; border-radius:50px;
  font-size:11px; font-weight:600;
  border:none; cursor:pointer; color:#fff; white-space:nowrap;
  font-family:var(--ari-body);
  position:relative; overflow:hidden;
  transition: transform .2s cubic-bezier(.34,1.56,.64,1), filter .18s;
}
.ari-act::after {
  content:''; position:absolute; top:-10px; left:-70%;
  width:45%; height:220%; background:rgba(255,255,255,.2);
  transform:skewX(-20deg); transition:left .35s;
}
.ari-act:hover::after { left:130%; }
.ari-act:hover  { transform:translateY(-2px) scale(1.07); filter:brightness(1.1); }
.ari-act:active { transform:scale(.92); }
.ari-act:nth-child(4n+1) { background:linear-gradient(135deg,#ec4899,#f97316); box-shadow:0 3px 10px rgba(236,72,153,.4); }
.ari-act:nth-child(4n+2) { background:linear-gradient(135deg,#06b6d4,#6366f1); box-shadow:0 3px 10px rgba(6,182,212,.35); }
.ari-act:nth-child(4n+3) { background:linear-gradient(135deg,#10b981,#06b6d4); box-shadow:0 3px 10px rgba(16,185,129,.35); }
.ari-act:nth-child(4n+0) { background:linear-gradient(135deg,#f59e0b,#ef4444); box-shadow:0 3px 10px rgba(245,158,11,.35); }

/* typing */
.ari-typing-row { display:flex; align-items:flex-end; gap:7px; }
.ari-typing {
  display:flex; align-items:center; gap:5px;
  padding:11px 15px;
  background:var(--ari-card2); border:1px solid rgba(255,255,255,.07);
  border-radius:18px; border-bottom-left-radius:4px;
  animation: ariIn .25s ease both;
}
.ari-tdot {
  width:7px; height:7px; border-radius:50%; display:inline-block;
}
.ari-tdot:nth-child(1) { background:#ec4899; animation:ariDot 1.2s 0s    infinite; }
.ari-tdot:nth-child(2) { background:#6366f1; animation:ariDot 1.2s .22s  infinite; }
.ari-tdot:nth-child(3) { background:#06b6d4; animation:ariDot 1.2s .44s  infinite; }

/* ── FOOTER ── */
.ari-foot {
  flex-shrink: 0;
  min-height: 80px;
  padding: 10px 12px 9px;
  border-top: 1px solid var(--ari-border);
  background: var(--ari-card);
}
.ari-input-row { display:flex; align-items:flex-end; gap:8px; }
.ari-input-box {
  flex:1; display:flex; align-items:center; gap:7px;
  border-radius:50px;
  border:1.5px solid rgba(99,102,241,.2);
  padding:8px 15px;
  background:var(--ari-bg);
  transition: border-color .2s, box-shadow .2s;
}
.ari-input-box:focus-within {
  border-color:rgba(99,102,241,.6);
  box-shadow:0 0 0 3px rgba(99,102,241,.1);
}
.ari-ta {
  flex:1; border:none; outline:none;
  font-size:13px; background:transparent;
  color:var(--ari-txt); resize:none;
  max-height:76px; overflow-y:auto;
  font-family:var(--ari-body); line-height:1.5;
}
.ari-ta::placeholder { color:var(--ari-muted); }

/* Voice button styling */
.ari-mic-btn {
  width:32px; height:32px; border-radius:50%;
  background:rgba(99,102,241,.2);
  border:none; cursor:pointer; color:white;
  display:flex; align-items:center; justify-content:center;
  transition: all .2s;
}
.ari-mic-btn:hover { background:rgba(99,102,241,.4); transform:scale(1.05); }
.ari-mic-btn.listening {
  background:#ec4899;
  animation: ariPop 1s ease-in-out infinite;
}

.ari-send {
  flex-shrink:0; width:42px; height:42px; border-radius:50%;
  background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);
  background-size:200% 200%; animation:ariGrad 4s ease infinite;
  border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(99,102,241,.5);
  transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
  position:relative; overflow:hidden;
}
.ari-send::before {
  content:''; position:absolute; top:-10px; left:-70%;
  width:45%; height:220%; background:rgba(255,255,255,.18);
  transform:skewX(-20deg); animation:ariShine 2.5s ease-in-out 1s infinite;
}
.ari-send:hover  { transform:scale(1.12) rotate(-5deg); box-shadow:0 6px 24px rgba(99,102,241,.65); }
.ari-send:active { transform:scale(.9); }
.ari-powered {
  text-align:center; font-size:10px; color:rgba(255,255,255,.17);
  margin-top:5px; letter-spacing:.04em; font-family:var(--ari-disp);
}
.ari-powered em {
  font-style:normal;
  background:linear-gradient(90deg,#818cf8,#f472b6);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  font-weight:700;
}
`;

function injectCSS() {
  if (document.getElementById('ari-v3')) return;
  const s = document.createElement('style');
  s.id = 'ari-v3';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── star particles ─── */
const Stars = () => {
  const pts = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 0.7,
    anim: `ariTwink ${(Math.random() * 2.5 + 1.5).toFixed(1)}s ${(Math.random() * 4).toFixed(1)}s ease-in-out infinite`,
  }));
  return (
    <div className="ari-stars">
      {pts.map((p) => (
        <div key={p.id} className="ari-star"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, animation: p.anim }} />
      ))}
    </div>
  );
};

/* ─── SMART AI RESPONSES ─── */
const SMART_RESP = {
  greeting: (name) => `✨ Hey ${name || 'there'}! I'm <b>Ari</b> — your intelligent HR assistant. I can help with leaves, payroll, attendance, tasks, and holidays. What do you need? 🚀`,
  leave: `🗓️ <b>Leave Summary</b><br/>• Annual Leave: 12 days left<br/>• Sick Leave: 5 days left<br/>• Casual Leave: 2 days left<br/>• Next approved: <b>Apr 18–19</b><br/><br/>Want to apply for leave? Just ask me!`,
  payroll: `💰 <b>Payroll Summary (March 2025)</b><br/>• Gross Salary: ₹68,500<br/>• Net Take-home: <b>₹58,320</b><br/>• TDS: ₹4,200<br/>• PF: ₹3,980<br/><br/>Say "download payslip" to get your slip!`,
  attendance: `📊 <b>Attendance This Month</b><br/>• Present: 18/22 days<br/>• Late entries: 1 (Apr 3)<br/>• Avg login: 9:14 AM<br/>• Compliance: <b>91%</b> ✅`,
  task: `🎯 <b>Your Open Tasks</b><br/>1. Q2 Performance Reviews (Due Apr 12)<br/>2. Onboarding Document Review (Due Apr 10)<br/>3. Team KPIs Setup (Due Apr 11)`,
  holiday: `🎉 <b>Upcoming Holidays</b><br/>• Apr 14 - Ambedkar Jayanti<br/>• May 1 - Labour Day<br/>• Jun 17 - Eid ul-Adha<br/><br/>Plan your leaves wisely! 🌴`,
  applyLeave: `✏️ <b>Apply for Leave</b><br/>I can help you apply! Please tell me:<br/>1. Leave type (Annual/Sick/Casual)<br/>2. Start & End dates<br/>3. Reason<br/><br/>Example: "Apply 2 days annual leave from Apr 20"`,
  downloadPayslip: `📄 <b>Payslip Request</b><br/>Your March 2025 payslip has been sent to your registered email! Check your inbox 📧`,
  markAttendance: `✅ <b>Attendance Marking</b><br/>Today's check-in: 9:15 AM ✅<br/>Need to regularize a missed day? Say "regularize attendance"!`,
  default: (query) => `🤔 I understand you're asking about something. I specialize in <b>leaves, payroll, attendance, tasks, and holidays</b>. Could you try one of the suggestions below?`
};

const smartClassify = (text) => {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|start|help|ari)\b/.test(t)) return 'greeting';
  if (/\b(leave|vacation|pto|time off|absent)\b/.test(t)) return 'leave';
  if (/\b(pay|salary|payroll|ctc|tax|tds|payslip)\b/.test(t)) return 'payroll';
  if (/\b(attend|present|absent|late|login|clock)\b/.test(t)) return 'attendance';
  if (/\b(task|todo|work|kpi|deadline|assign)\b/.test(t)) return 'task';
  if (/\b(holiday|festival|public)\b/.test(t)) return 'holiday';
  if (/\b(apply leave|request leave|take leave)\b/.test(t)) return 'applyLeave';
  if (/\b(download payslip|get payslip)\b/.test(t)) return 'downloadPayslip';
  if (/\b(mark attendance|check in|punch in)\b/.test(t)) return 'markAttendance';
  return 'default';
};

const getSmartActions = (intent) => {
  const actionsMap = {
    greeting: ['🗓️ Leave Balance', '💰 Payroll Info', '📊 Attendance', '🎯 Tasks'],
    leave: ['✏️ Apply Leave', '📜 Leave History', '🎉 Holidays'],
    payroll: ['📄 Download Payslip', '💼 CTC Breakdown', '📊 Tax Details'],
    attendance: ['✅ Mark Attendance', '🔄 Regularize', '📅 Calendar'],
    task: ['📋 All Tasks', '➕ New Task', '⭐ Priorities'],
    holiday: ['📅 Full Calendar', '✏️ Apply Leave'],
    default: ['📅 Leave Balance', '💰 Payroll Info', '📊 Attendance']
  };
  return actionsMap[intent] || actionsMap.default;
};

const generateSmartResponse = (query, userName) => {
  const intent = smartClassify(query);
  let text = SMART_RESP[intent];
  if (typeof text === 'function') text = text(userName);
  return { text, actions: getSmartActions(intent) };
};

const ts = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let uid = 0;

/* ─── sub-components ─── */
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.4.94l.97 4.84c.1.5.5.87 1 .95l7.87 1.26a.25.25 0 0 1 0 .5L3.97 13.31a1 1 0 0 0-1 .95L2 19.46a1 1 0 0 0 1.4.94z"/>
  </svg>
);

const MicIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zm-5 8H4a8 8 0 0 0 16 0h-2a6 6 0 0 1-12 0zm5 8v2H9v2h6v-2h-2v-2h-1z"/>
  </svg>
);

const Typing = () => (
  <div className="ari-msg bot">
    <div className="ari-typing-row">
      <div className="ari-mini-av">✨</div>
      <div className="ari-typing">
        <span className="ari-tdot" /><span className="ari-tdot" /><span className="ari-tdot" />
      </div>
    </div>
  </div>
);

const BotMsg = ({ m, onAct }) => (
  <div className={`ari-msg ${m.role}`}>
    <div className="ari-msg-row">
      {m.role === 'bot' && <div className="ari-mini-av">✨</div>}
      <div className="ari-bubble" dangerouslySetInnerHTML={{ __html: m.text }} />
    </div>
    <div className="ari-msg-time">{m.time}</div>
    {m.role === 'bot' && m.acts?.length > 0 && (
      <div className="ari-acts">
        {m.acts.map((a) => (
          <button key={a} className="ari-act" onClick={() => onAct(a)}>{a}</button>
        ))}
      </div>
    )}
  </div>
);

const CHIPS = [
  { label: '🗓️ Leave',      q: 'Check my leave balance',  cls: 'ari-chip-a' },
  { label: '💸 Payroll',    q: 'Show my payroll info',     cls: 'ari-chip-b' },
  { label: '📊 Attendance', q: 'My attendance this month', cls: 'ari-chip-c' },
  { label: '🎯 Tasks',      q: 'Show my task list',        cls: 'ari-chip-d' },
  { label: '🎉 Holidays',   q: 'Upcoming public holidays', cls: 'ari-chip-e' },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT - WITH PROPER BUTTON HIDE/SHOW
───────────────────────────────────────── */
const AriBot = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [badge, setBadge] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { 
    injectCSS(); 
    initSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [msgs, busy]);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        setTimeout(() => sendMessage(transcript), 100);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  };

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert('🎤 Speech recognition not supported. Try Chrome or Edge!');
    }
  };

  const push = (role, text, acts = []) =>
    setMsgs((p) => [...p, { id: ++uid, role, text, acts, time: ts() }]);

  // OPEN CHAT - hides the FAB button automatically via CSS class
  const handleOpen = () => {
    setOpen(true);
    setBadge(false);
    if (msgs.length === 0) {
      setBusy(true);
      setTimeout(() => { 
        setBusy(false); 
        const r = generateSmartResponse('hello', user?.name);
        push('bot', r.text, r.actions); 
      }, 850);
    }
  };

  // CLOSE CHAT - shows the FAB button again
  const handleClose = () => {
    setOpen(false);
    setBadge(true);
  };

  const sendMessage = (raw) => {
    const txt = raw.trim();
    if (!txt || busy) return;
    push('user', txt);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setBusy(true);
    const r = generateSmartResponse(txt, user?.name);
    setTimeout(() => { 
      setBusy(false); 
      push('bot', r.text, r.actions); 
    }, 800 + Math.random() * 600);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(input); 
    }
  };

  const onType = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 76) + 'px';
  };

  return (
    <>
      {/* FAB BUTTON - HIDES when open=true, SHOWS when open=false */}
      <div className={`ari-fab-root ${open ? 'ari-hidden' : ''}`}>
        <div className="ari-ring1" />
        <div className="ari-ring2" />
        <button className="ari-fab-btn" onClick={handleOpen} aria-label="Open Ari chatbot">
          {badge && <span className="ari-fab-badge">1</span>}
          <span className="ari-fab-icon">🤖</span>
        </button>
      </div>

      {/* CHAT WINDOW - only shows when open=true */}
      {open && (
        <div className="ari-window" role="dialog" aria-label="Ari HR Assistant">
          {/* HEADER */}
          <div className="ari-head">
            <Stars />
            <div className="ari-head-row">
              <div className="ari-av-wrap">
                <div className="ari-av">🤖</div>
                <div className="ari-av-orbit" />
                <div className="ari-online" />
              </div>
              <div className="ari-head-info">
                <p className="ari-head-name">Ari</p>
                <p className="ari-head-sub">
                  <span className="ari-live-dot" />
                  {user?.name ? `Hi ${user.name.split(' ')[0]} ` : 'Online'} · AI Ready
                </p>
              </div>
              <button className="ari-close-btn" onClick={handleClose} aria-label="Close">✕</button>
            </div>
          </div>

          {/* CHIPS */}
          <div className="ari-chips">
            {CHIPS.map((c) => (
              <button key={c.label} className={`ari-chip ${c.cls}`} onClick={() => sendMessage(c.q)}>
                {c.label}
              </button>
            ))}
          </div>

          {/* MESSAGES */}
          <div className="ari-msgs">
            {msgs.length === 0 && !busy && (
              <div className="ari-empty">
                <div className="ari-empty-ico">✨</div>
                <div className="ari-empty-lbl">Tap a chip or type/speak!<br />I'm here to help 😄</div>
              </div>
            )}
            {msgs.map((m) => <BotMsg key={m.id} m={m} onAct={sendMessage} />)}
            {busy && <Typing />}
            <div ref={endRef} />
          </div>

          {/* FOOTER - WITH VOICE BUTTON */}
          <div className="ari-foot">
            <div className="ari-input-row">
              <div className="ari-input-box">
                <textarea
                  ref={taRef} 
                  className="ari-ta" 
                  rows={1}
                  placeholder="Ask Ari anything... 💬"
                  value={input} 
                  onChange={onType} 
                  onKeyDown={onKey}
                />
                <button 
                  className={`ari-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={startVoiceInput}
                  title="Voice input 🎤"
                >
                  <MicIcon />
                </button>
              </div>
              <button className="ari-send" onClick={() => sendMessage(input)} aria-label="Send">
                <SendIcon />
              </button>
            </div>
            <p className="ari-powered">Powered by <em>Ari AI</em> · Voice enabled ✨</p>
          </div>
        </div>
      )}
    </>
  );
};

export default AriBot;