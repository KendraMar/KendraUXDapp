/**
 * Data Transforms - Convert raw API responses into widget-friendly data shapes
 * 
 * Each transform function takes raw API data and returns a normalized shape
 * that the corresponding widget type expects.
 */

/**
 * Safely coerce a value to a renderable string.
 * Handles cases where API fields like `author` are objects ({name, avatar}) instead of strings.
 */
function toStr(val) {
  if (val == null) return undefined;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return val.name || val.displayName || val.title || val.label || val.username || val.email || JSON.stringify(val);
  }
  return String(val);
}

const transforms = {
  // Tasks transforms
  taskSummary: (raw) => {
    const issues = raw?.issues || raw?.data || [];
    const total = Array.isArray(issues) ? issues.length : 0;
    const byStatus = {};
    if (Array.isArray(issues)) {
      issues.forEach(issue => {
        const status = issue.status || issue.state || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
    }
    const open = (byStatus['open'] || 0) + (byStatus['todo'] || 0) + (byStatus['To Do'] || 0) + (byStatus['backlog'] || 0);
    const inProgress = (byStatus['in_progress'] || 0) + (byStatus['In Progress'] || 0) + (byStatus['doing'] || 0);
    const done = (byStatus['done'] || 0) + (byStatus['closed'] || 0) + (byStatus['Done'] || 0);

    return {
      value: total,
      label: 'total tasks',
      linkUrl: '/tasks',
      secondaryStats: [
        { label: 'Open', value: open },
        { label: 'In Progress', value: inProgress },
        { label: 'Done', value: done }
      ]
    };
  },

  taskList: (raw) => {
    const issues = raw?.issues || raw?.data || [];
    if (!Array.isArray(issues)) return { items: [] };
    return {
      items: issues.slice(0, 10).map(issue => ({
        id: toStr(issue.id || issue.key),
        title: toStr(issue.title || issue.summary || issue.key),
        subtitle: toStr(issue.project || issue.source),
        status: toStr(issue.status || issue.state),
        statusColor: getStatusColor(toStr(issue.status || issue.state)),
        timestamp: issue.updated || issue.created,
        url: '/tasks'
      }))
    };
  },

  // Feed transforms
  feedItems: (raw) => {
    const items = raw?.items || raw?.data || [];
    if (!Array.isArray(items)) return { items: [] };
    return {
      items: items.slice(0, 15).map(item => ({
        id: toStr(item.id),
        text: toStr(item.title || item.summary || item.text || item.message),
        source: toStr(item.source || item.type),
        sourceColor: getSourceColor(toStr(item.source || item.type)),
        timestamp: item.timestamp || item.date || item.created,
        url: getFeedItemUrl(item)
      }))
    };
  },

  // GitLab transforms
  mrCount: (raw) => {
    const mrs = raw?.mergeRequests || raw?.data || [];
    const count = Array.isArray(mrs) ? mrs.length : 0;
    const assigned = Array.isArray(mrs) ? mrs.filter(mr => mr.assignee).length : 0;
    return {
      value: count,
      label: 'open merge requests',
      linkUrl: '/gitlab',
      secondaryStats: [
        { label: 'Assigned to you', value: assigned }
      ]
    };
  },

  mrList: (raw) => {
    const mrs = raw?.mergeRequests || raw?.data || [];
    if (!Array.isArray(mrs)) return { items: [] };
    return {
      items: mrs.slice(0, 10).map(mr => ({
        id: toStr(mr.id || mr.iid),
        title: toStr(mr.title),
        subtitle: toStr(mr.project?.name || mr.projectName || mr.source_branch),
        status: toStr(mr.state || 'open'),
        statusColor: mr.state === 'merged' ? 'green' : mr.state === 'closed' ? 'red' : 'blue',
        timestamp: mr.updated_at || mr.created_at,
        url: mr.web_url || mr.webUrl || '/gitlab',
        externalUrl: !!(mr.web_url || mr.webUrl)
      }))
    };
  },

  // Slack transforms
  slackUnread: (raw) => {
    const channels = raw?.channels || [];
    const dms = raw?.dms || [];
    let totalUnread = 0;
    let totalMentions = 0;

    [...channels, ...dms].forEach(ch => {
      totalUnread += ch.unreadCount || ch.unread_count_display || 0;
      totalMentions += ch.mentionCount || ch.mention_count || 0;
    });

    return {
      value: totalUnread,
      label: 'unread messages',
      linkUrl: '/slack',
      secondaryStats: [
        { label: 'Mentions', value: totalMentions },
        { label: 'Channels', value: channels.length }
      ]
    };
  },

  // Figma transforms
  figmaFiles: (raw) => {
    const files = raw?.files || raw?.data || [];
    if (!Array.isArray(files)) return { items: [] };
    return {
      items: files.slice(0, 10).map(file => ({
        id: toStr(file.key || file.id),
        title: toStr(file.name || file.title),
        subtitle: toStr(file.project?.name || file.projectName),
        timestamp: file.last_modified || file.lastModified,
        url: '/figma'
      }))
    };
  },

  // Kubernetes transforms
  k8sDashboard: (raw) => {
    const data = raw?.dashboard || raw?.data || raw;
    const bars = [];

    if (data.pods) {
      bars.push({
        label: 'Pods Running',
        value: data.pods?.running || data.pods?.total || 0,
        color: 'var(--pf-t--global--color--status--success--default)'
      });
    }
    if (data.deployments) {
      bars.push({
        label: 'Deployments',
        value: data.deployments?.available || data.deployments?.total || 0,
        color: 'var(--pf-t--global--color--brand--default)'
      });
    }
    if (data.services) {
      bars.push({
        label: 'Services',
        value: data.services?.total || 0,
        color: 'var(--pf-t--global--color--status--info--default)'
      });
    }
    if (data.nodes) {
      bars.push({
        label: 'Nodes Ready',
        value: data.nodes?.ready || data.nodes?.total || 0,
        color: 'var(--pf-t--global--color--status--warning--default)'
      });
    }

    if (bars.length === 0) {
      // Fallback: try to render whatever keys are available
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val === 'number') {
          bars.push({ label: key, value: val });
        } else if (typeof val === 'object' && val?.total !== undefined) {
          bars.push({ label: key, value: val.total });
        }
      });
    }

    return { bars };
  },

  // Home Assistant transforms
  haSummary: (raw) => {
    const data = raw?.summary || raw?.data || raw;
    const bars = [];

    if (data.lights !== undefined) {
      bars.push({
        label: 'Lights On',
        value: typeof data.lights === 'object' ? data.lights.on || 0 : data.lights,
        color: 'var(--pf-t--global--color--status--warning--default)'
      });
    }
    if (data.switches !== undefined) {
      bars.push({
        label: 'Switches On',
        value: typeof data.switches === 'object' ? data.switches.on || 0 : data.switches,
        color: 'var(--pf-t--global--color--status--info--default)'
      });
    }
    if (data.sensors !== undefined) {
      bars.push({
        label: 'Sensors',
        value: typeof data.sensors === 'object' ? data.sensors.total || 0 : data.sensors,
        color: 'var(--pf-t--global--color--status--success--default)'
      });
    }
    if (data.climate !== undefined || data.thermostats !== undefined) {
      const val = data.climate || data.thermostats;
      bars.push({
        label: 'Climate',
        value: typeof val === 'object' ? val.total || 0 : val,
        color: 'var(--pf-t--global--color--status--danger--default)'
      });
    }

    if (bars.length === 0) {
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val === 'number') {
          bars.push({ label: key, value: val });
        }
      });
    }

    return { bars };
  },

  // RSS transforms
  rssUnread: (raw) => {
    const feeds = raw?.feeds || raw?.data || [];
    let totalUnread = 0;
    if (Array.isArray(feeds)) {
      feeds.forEach(feed => {
        totalUnread += feed.unseenCount || feed.unreadCount || 0;
      });
    }
    return {
      value: totalUnread,
      label: 'unread articles',
      linkUrl: '/rss',
      secondaryStats: [
        { label: 'Feeds', value: Array.isArray(feeds) ? feeds.length : 0 }
      ]
    };
  },

  rssItems: (raw) => {
    const items = raw?.items || raw?.data || [];
    if (!Array.isArray(items)) return { items: [] };
    return {
      items: items.slice(0, 10).map(item => ({
        id: toStr(item.id || item.guid),
        title: toStr(item.title),
        subtitle: toStr(item.feedTitle || item.feed || item.source),
        timestamp: item.pubDate || item.published || item.date,
        url: item.link || item.url || '/rss',
        externalUrl: !!(item.link || item.url)
      }))
    };
  },

  // Documents transforms
  documentList: (raw) => {
    const docs = raw?.documents || raw?.data || [];
    if (!Array.isArray(docs)) return { items: [] };
    return {
      items: docs.slice(0, 10).map(doc => ({
        id: toStr(doc.id),
        title: toStr(doc.title || doc.name),
        subtitle: toStr(doc.author || doc.updatedBy),
        timestamp: doc.updatedAt || doc.updated || doc.createdAt,
        url: doc.id ? `/documents/${doc.id}` : '/documents'
      }))
    };
  },

  // Discussions transforms
  discussionList: (raw) => {
    const discussions = raw?.discussions || raw?.data || [];
    if (!Array.isArray(discussions)) return { items: [] };
    return {
      items: discussions.slice(0, 10).map(disc => ({
        id: toStr(disc.id),
        title: toStr(disc.title || disc.subject),
        subtitle: toStr(disc.author || disc.category),
        status: disc.replyCount !== undefined ? `${disc.replyCount} replies` : undefined,
        statusColor: 'blue',
        timestamp: disc.lastReplyAt || disc.updatedAt || disc.createdAt,
        url: disc.id ? `/discussions/${disc.id}` : '/discussions'
      }))
    };
  }
};

/**
 * Transform raw API data using a named transform
 */
export function transformData(transformName, rawData, widgetDef) {
  if (!transformName || !transforms[transformName]) {
    // No transform, return raw data as-is
    return rawData;
  }

  try {
    return transforms[transformName](rawData);
  } catch (err) {
    console.error(`[DataTransform] Error in ${transformName}:`, err);
    return rawData;
  }
}

/**
 * Build an in-app URL for a feed item based on its source/type
 */
function getFeedItemUrl(item) {
  const source = toStr(item.source || item.type || '');
  if (!source) return '/feed';
  const s = source.toLowerCase();
  if (s.includes('slack')) return '/slack';
  if (s.includes('gitlab') || s.includes('merge')) return '/gitlab';
  if (s.includes('jira')) return '/tasks';
  if (s.includes('figma')) return '/figma';
  if (s.includes('confluence')) return '/wiki';
  if (s.includes('calendar') || s.includes('google')) return '/calendar';
  if (s.includes('document')) return item.entityId ? `/documents/${item.entityId}` : '/documents';
  if (s.includes('discussion')) return item.entityId ? `/discussions/${item.entityId}` : '/discussions';
  return '/feed';
}

// Helper: map status strings to PatternFly label colors
function getStatusColor(status) {
  if (!status) return 'grey';
  const str = toStr(status);
  if (!str) return 'grey';
  const s = str.toLowerCase();
  if (['done', 'closed', 'resolved', 'merged', 'complete'].includes(s)) return 'green';
  if (['in_progress', 'in progress', 'doing', 'active', 'review'].includes(s)) return 'blue';
  if (['open', 'todo', 'to do', 'backlog', 'new'].includes(s)) return 'grey';
  if (['blocked', 'failed', 'error'].includes(s)) return 'red';
  if (['warning', 'pending'].includes(s)) return 'orange';
  return 'grey';
}

// Helper: map source strings to colors
function getSourceColor(source) {
  if (!source) return 'grey';
  const str = toStr(source);
  if (!str) return 'grey';
  const s = str.toLowerCase();
  if (s.includes('slack')) return 'purple';
  if (s.includes('gitlab') || s.includes('git')) return 'orange';
  if (s.includes('jira')) return 'blue';
  if (s.includes('figma')) return 'green';
  if (s.includes('confluence')) return 'cyan';
  return 'grey';
}

export default transforms;
