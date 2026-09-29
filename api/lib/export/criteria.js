const periodicities = ['day', 'month_week_sat', 'month_week_sun', 'month_week_mon',
  'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'];

function invalid() {
  const error = new Error('Invalid export criteria');
  error.status = 400;
  throw error;
}

export function normalizeFilters(value = {}) {
  if (!value || Array.isArray(value) || typeof value !== 'object') invalid();
  if (Object.keys(value).some(key => !['_start', '_end', 'entity'].includes(key))) invalid();
  const result = {};
  for (const key of ['_start', '_end']) {
    if (value[key] !== undefined) {
      const date = value[key];
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) invalid();
      result[key] = date;
    }
  }
  if (!!result._start !== !!result._end || result._start > result._end) invalid();
  if (value.entity !== undefined) {
    if (!Array.isArray(value.entity) || value.entity.some(id => typeof id !== 'string')) invalid();
    result.entity = [...new Set(value.entity)].sort();
  }
  return result;
}

export function projectCriteria(params, query) {
  if (!periodicities.includes(params.periodicity) || !['en', 'es', 'fr'].includes(params.lang)) invalid();
  if (params.minimized && !['true', 'false'].includes(params.minimized)) invalid();
  let filters;
  try { filters = query.filters ? JSON.parse(query.filters) : {}; }
  catch (error) { invalid(); }
  return {
    type: params.minimized === 'true' ? 'global' : 'detailed',
    periodicity: params.periodicity,
    language: params.lang,
    filters: normalizeFilters(filters)
  };
}

// A report filter narrows the indicator's own date/site restrictions.
export function intersectFilters(left = {}, right = {}) {
  const result = Object.assign({}, left, right);
  if (left._start && right._start) result._start = left._start > right._start ? left._start : right._start;
  if (left._end && right._end) result._end = left._end < right._end ? left._end : right._end;
  if (left.entity && right.entity) result.entity = left.entity.filter(id => right.entity.includes(id));
  return result;
}
