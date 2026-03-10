const express = require('express');
const { loadHomeAssistantConfig } = require('../../../server/lib/config');

const router = express.Router();

// Apollo UI activity state - tracks when the UI is being interacted with
let apolloActivityState = {
  active: false,
  lastActivity: null,
  currentPage: null,
  sessionStart: null,
  idleTimeoutMs: 60000 // Consider inactive after 60 seconds of no activity
};

// Helper function to make Home Assistant API requests
async function makeHomeAssistantRequest(config, endpoint, method = 'GET', body = null) {
  const url = `${config.url}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Home Assistant API error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

// API endpoint for testing Home Assistant connection
router.get('/test', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured. Please set up your Home Assistant URL and access token in Settings.'
    });
  }

  try {
    // Test by getting the API status
    const data = await makeHomeAssistantRequest(config, '/');
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to Home Assistant',
      info: {
        message: data.message,
        version: data.version || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error testing Home Assistant connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint for getting Home Assistant configuration/info
router.get('/config', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      config: null
    });
  }

  try {
    const data = await makeHomeAssistantRequest(config, '/config');
    
    res.json({ 
      success: true, 
      config: {
        locationName: data.location_name,
        latitude: data.latitude,
        longitude: data.longitude,
        elevation: data.elevation,
        unitSystem: data.unit_system,
        timeZone: data.time_zone,
        version: data.version,
        components: data.components?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching Home Assistant config:', error);
    res.json({ 
      success: false, 
      error: error.message,
      config: null
    });
  }
});

// API endpoint for getting all entity states
router.get('/states', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      states: []
    });
  }

  try {
    const states = await makeHomeAssistantRequest(config, '/states');
    
    // Optionally filter by domain
    const domain = req.query.domain;
    let filteredStates = states;
    
    if (domain) {
      filteredStates = states.filter(state => state.entity_id.startsWith(`${domain}.`));
    }
    
    // Sort by entity_id
    filteredStates.sort((a, b) => a.entity_id.localeCompare(b.entity_id));
    
    res.json({ 
      success: true, 
      states: filteredStates.map(state => ({
        entityId: state.entity_id,
        state: state.state,
        friendlyName: state.attributes?.friendly_name || state.entity_id,
        lastChanged: state.last_changed,
        lastUpdated: state.last_updated,
        attributes: state.attributes,
        domain: state.entity_id.split('.')[0]
      }))
    });
  } catch (error) {
    console.error('Error fetching Home Assistant states:', error);
    res.json({ 
      success: false, 
      error: error.message,
      states: []
    });
  }
});

// API endpoint for getting a specific entity state
router.get('/states/:entityId', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      state: null
    });
  }

  try {
    const entityId = req.params.entityId;
    const state = await makeHomeAssistantRequest(config, `/states/${entityId}`);
    
    res.json({ 
      success: true, 
      state: {
        entityId: state.entity_id,
        state: state.state,
        friendlyName: state.attributes?.friendly_name || state.entity_id,
        lastChanged: state.last_changed,
        lastUpdated: state.last_updated,
        attributes: state.attributes,
        domain: state.entity_id.split('.')[0]
      }
    });
  } catch (error) {
    console.error('Error fetching Home Assistant entity state:', error);
    res.json({ 
      success: false, 
      error: error.message,
      state: null
    });
  }
});

// API endpoint for getting entity history
router.get('/history/:entityId', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      history: []
    });
  }

  try {
    const entityId = req.params.entityId;
    const hours = parseInt(req.query.hours) || 24;
    
    // Calculate timestamp for start of history period
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
    const timestamp = startTime.toISOString();
    
    const history = await makeHomeAssistantRequest(
      config, 
      `/history/period/${timestamp}?filter_entity_id=${entityId}&minimal_response`
    );
    
    // History returns array of arrays, one per entity
    const entityHistory = history[0] || [];
    
    res.json({ 
      success: true, 
      history: entityHistory.map(entry => ({
        state: entry.state,
        lastChanged: entry.last_changed,
        lastUpdated: entry.last_updated
      }))
    });
  } catch (error) {
    console.error('Error fetching Home Assistant history:', error);
    res.json({ 
      success: false, 
      error: error.message,
      history: []
    });
  }
});

// API endpoint for getting available services
router.get('/services', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      services: []
    });
  }

  try {
    const services = await makeHomeAssistantRequest(config, '/services');
    
    res.json({ 
      success: true, 
      services: services.map(svc => ({
        domain: svc.domain,
        services: Object.keys(svc.services || {})
      }))
    });
  } catch (error) {
    console.error('Error fetching Home Assistant services:', error);
    res.json({ 
      success: false, 
      error: error.message,
      services: []
    });
  }
});

// API endpoint for getting available areas
router.get('/areas', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      areas: []
    });
  }

  try {
    // Areas require WebSocket API, but we can try the template API
    // For now, we'll get device registry via REST API if available
    const states = await makeHomeAssistantRequest(config, '/states');
    
    // Extract unique areas from entity attributes (if available)
    const areasSet = new Set();
    states.forEach(state => {
      if (state.attributes?.area_id) {
        areasSet.add(state.attributes.area_id);
      }
    });
    
    res.json({ 
      success: true, 
      areas: Array.from(areasSet).sort()
    });
  } catch (error) {
    console.error('Error fetching Home Assistant areas:', error);
    res.json({ 
      success: false, 
      error: error.message,
      areas: []
    });
  }
});

// API endpoint for getting summary/dashboard data
router.get('/summary', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  if (!config || !config.url || !config.token) {
    return res.json({ 
      success: false, 
      error: 'Home Assistant is not configured.',
      summary: null
    });
  }

  try {
    const [configData, states] = await Promise.all([
      makeHomeAssistantRequest(config, '/config'),
      makeHomeAssistantRequest(config, '/states')
    ]);
    
    // Count entities by domain
    const domainCounts = {};
    states.forEach(state => {
      const domain = state.entity_id.split('.')[0];
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
    
    // Get some quick status info
    const lights = states.filter(s => s.entity_id.startsWith('light.'));
    const lightsOn = lights.filter(s => s.state === 'on').length;
    
    const switches = states.filter(s => s.entity_id.startsWith('switch.'));
    const switchesOn = switches.filter(s => s.state === 'on').length;
    
    const sensors = states.filter(s => s.entity_id.startsWith('sensor.'));
    const binarySensors = states.filter(s => s.entity_id.startsWith('binary_sensor.'));
    
    const climate = states.filter(s => s.entity_id.startsWith('climate.'));
    const thermostats = climate.map(c => ({
      name: c.attributes?.friendly_name || c.entity_id,
      currentTemp: c.attributes?.current_temperature,
      targetTemp: c.attributes?.temperature,
      hvacMode: c.state
    }));
    
    res.json({ 
      success: true, 
      summary: {
        locationName: configData.location_name,
        version: configData.version,
        totalEntities: states.length,
        domainCounts,
        lights: {
          total: lights.length,
          on: lightsOn
        },
        switches: {
          total: switches.length,
          on: switchesOn
        },
        sensors: sensors.length,
        binarySensors: binarySensors.length,
        thermostats
      }
    });
  } catch (error) {
    console.error('Error fetching Home Assistant summary:', error);
    res.json({ 
      success: false, 
      error: error.message,
      summary: null
    });
  }
});

// ============================================================================
// Apollo UI Activity Tracking - Exposes Apollo as a sensor to Home Assistant
// ============================================================================

// Helper to push Apollo state to Home Assistant
async function pushApolloStateToHomeAssistant(config) {
  const now = new Date();
  const lastActivity = apolloActivityState.lastActivity 
    ? new Date(apolloActivityState.lastActivity) 
    : null;
  
  // Calculate idle time
  const idleMs = lastActivity ? (now - lastActivity) : null;
  const idleSeconds = idleMs !== null ? Math.floor(idleMs / 1000) : null;
  
  // Determine if truly active (had activity within timeout period)
  const isActive = apolloActivityState.active && 
    idleMs !== null && 
    idleMs < apolloActivityState.idleTimeoutMs;
  
  // Prepare the entity state for Home Assistant
  const entityState = {
    state: isActive ? 'on' : 'off',
    attributes: {
      friendly_name: 'Apollo UI Active',
      device_class: 'occupancy',
      last_activity: apolloActivityState.lastActivity,
      current_page: apolloActivityState.currentPage,
      session_start: apolloActivityState.sessionStart,
      idle_seconds: idleSeconds,
      icon: isActive ? 'mdi:rocket-launch' : 'mdi:rocket-launch-outline'
    }
  };

  try {
    const url = `${config.url}/api/states/binary_sensor.apollo_ui_active`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entityState)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Home Assistant API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error pushing Apollo state to Home Assistant:', error.message);
    throw error;
  }
}

// POST /api/homeassistant/apollo/heartbeat - Report UI activity
router.post('/apollo/heartbeat', async (req, res) => {
  const config = loadHomeAssistantConfig();
  const { currentPage, sessionId } = req.body;
  
  const now = new Date().toISOString();
  
  // Update activity state
  if (!apolloActivityState.sessionStart || apolloActivityState.sessionId !== sessionId) {
    apolloActivityState.sessionStart = now;
    apolloActivityState.sessionId = sessionId;
  }
  
  apolloActivityState.active = true;
  apolloActivityState.lastActivity = now;
  apolloActivityState.currentPage = currentPage || '/';
  
  // If Home Assistant is configured, push the state
  if (config && config.url && config.token) {
    try {
      await pushApolloStateToHomeAssistant(config);
      res.json({ success: true, pushed: true });
    } catch (error) {
      // Still return success even if HA push fails - we tracked the state locally
      res.json({ success: true, pushed: false, error: error.message });
    }
  } else {
    res.json({ success: true, pushed: false, reason: 'Home Assistant not configured' });
  }
});

// POST /api/homeassistant/apollo/inactive - Report UI became inactive
router.post('/apollo/inactive', async (req, res) => {
  const config = loadHomeAssistantConfig();
  
  apolloActivityState.active = false;
  
  // If Home Assistant is configured, push the inactive state
  if (config && config.url && config.token) {
    try {
      await pushApolloStateToHomeAssistant(config);
      res.json({ success: true, pushed: true });
    } catch (error) {
      res.json({ success: true, pushed: false, error: error.message });
    }
  } else {
    res.json({ success: true, pushed: false, reason: 'Home Assistant not configured' });
  }
});

// GET /api/homeassistant/apollo/state - Get current Apollo activity state
router.get('/apollo/state', (req, res) => {
  const now = new Date();
  const lastActivity = apolloActivityState.lastActivity 
    ? new Date(apolloActivityState.lastActivity) 
    : null;
  
  const idleMs = lastActivity ? (now - lastActivity) : null;
  const idleSeconds = idleMs !== null ? Math.floor(idleMs / 1000) : null;
  
  const isActive = apolloActivityState.active && 
    idleMs !== null && 
    idleMs < apolloActivityState.idleTimeoutMs;
  
  res.json({
    success: true,
    state: {
      active: isActive,
      lastActivity: apolloActivityState.lastActivity,
      currentPage: apolloActivityState.currentPage,
      sessionStart: apolloActivityState.sessionStart,
      idleSeconds
    }
  });
});

// POST /api/homeassistant/apollo/config - Configure Apollo activity tracking
router.post('/apollo/config', (req, res) => {
  const { idleTimeoutMs } = req.body;
  
  if (idleTimeoutMs && typeof idleTimeoutMs === 'number' && idleTimeoutMs > 0) {
    apolloActivityState.idleTimeoutMs = idleTimeoutMs;
  }
  
  res.json({
    success: true,
    config: {
      idleTimeoutMs: apolloActivityState.idleTimeoutMs
    }
  });
});

module.exports = router;
