/**
 * Format helpers for dates, XP, scores, etc.
 */

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(timestamp) {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
}

export function formatXP(xp) {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K XP`;
  return `${xp} XP`;
}

export function formatScore(score) {
  return Math.round(score);
}

export function getDeadlineStatus(deadline) {
  if (!deadline) return 'no-deadline';
  const now = new Date();
  const dl = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const diff = dl - now;
  const hours = diff / (1000 * 60 * 60);

  if (hours < 0) return 'overdue';
  if (hours < 24) return 'urgent';
  if (hours < 72) return 'soon';
  return 'plenty';
}

export function getRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getConfusionColor(level) {
  if (level >= 70) return '#ffb4ab'; // High - Red
  if (level >= 40) return '#efc200'; // Medium - Yellow
  return '#4ae176'; // Low - Green
}

export function getConfusionLabel(level) {
  if (level >= 70) return 'High Confusion';
  if (level >= 40) return 'Medium';
  return 'Low';
}

export function getEngagementColor(score) {
  if (score >= 75) return '#4ae176';
  if (score >= 50) return '#efc200';
  return '#ffb4ab';
}
