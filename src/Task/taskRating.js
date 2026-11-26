
export const RATING_SCORES = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

export const RATING_COLORS = {
  LOW: '#ef4444',
  MEDIUM: '#f59e0b',
  HIGH: '#22c55e'
};

export const buildReviewComment = (
  rating,
  feedback = ''
) => {
  if (!Object.hasOwn(RATING_SCORES, rating)) {
    throw new Error('Select a valid rating');
  }

  return `[RATING:${rating}]\n${feedback.trim()}`;
};

export const parseReview = (comment = '') => {
  const text = String(comment || '');

  const pattern =
    /^\[RATING:(LOW|MEDIUM|HIGH)\]\s*/;

  const match = text.match(pattern);

  const rating = match ? match[1] : null;

  return {
    rating,
    score: rating ? RATING_SCORES[rating] : null,
    feedback: text.replace(pattern, '').trim()
  };
};

export const calculatePerformance = (
  submissions = []
) => {
  const approved = submissions.filter(
    s => s.status === 'APPROVED'
  );

  const rated = approved
    .map(s => ({
      ...s,
      ...parseReview(s.reviewComment)
    }))
    .filter(s => s.score !== null);

  const total = rated.reduce(
    (sum, s) => sum + s.score,
    0
  );

  const average = rated.length
    ? total / rated.length
    : null;

  return {
    total: submissions.length,
    approved: approved.length,
    rated: rated.length,

    low: rated.filter(
      s => s.rating === 'LOW'
    ).length,

    medium: rated.filter(
      s => s.rating === 'MEDIUM'
    ).length,

    high: rated.filter(
      s => s.rating === 'HIGH'
    ).length,

    average: average === null
      ? null
      : Number(average.toFixed(2)),

    percentage: average === null
      ? null
      : Number((average / 3 * 100).toFixed(2))
  };
};

export const getDailyRatingData = (
  submissions = []
) => {
  const dates = new Map();

  submissions.forEach(s => {
    if (s.status !== 'APPROVED') return;

    const review = parseReview(s.reviewComment);

    if (
      review.score === null ||
      !s.submissionDate
    ) return;

    const date = s.submissionDate;

    if (!dates.has(date)) {
      dates.set(date, {
        date,
        total: 0,
        count: 0
      });
    }

    const day = dates.get(date);

    day.total += review.score;
    day.count++;
  });

  return [...dates.values()]
    .map(day => ({
      date: day.date,
      reports: day.count,
      average: Number(
        (day.total / day.count).toFixed(2)
      )
    }))
    .sort((a, b) =>
      a.date.localeCompare(b.date)
    );
};
