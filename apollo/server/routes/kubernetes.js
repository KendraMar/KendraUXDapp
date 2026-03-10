const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const router = express.Router();

// Store connection config in memory (in production, use proper session/config management)
let k8sConfig = {
  apiServer: '',
  token: '',
  caCert: '',
  clientCert: '',
  clientKey: '',
  connected: false,
  contextName: ''
};

// Helper to make K8s API requests
const k8sRequest = (endpoint, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    if (!k8sConfig.apiServer) {
      reject(new Error('Not connected to a Kubernetes cluster'));
      return;
    }

    const url = new URL(endpoint, k8sConfig.apiServer);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // For local development with self-signed certs
      rejectUnauthorized: false
    };

    // Support bearer token authentication
    if (k8sConfig.token) {
      options.headers['Authorization'] = `Bearer ${k8sConfig.token}`;
    }

    // Support client certificate authentication (e.g., for minikube)
    if (k8sConfig.clientCert && k8sConfig.clientKey) {
      options.cert = k8sConfig.clientCert;
      options.key = k8sConfig.clientKey;
    }

    // Use CA certificate if provided
    if (k8sConfig.caCert) {
      options.ca = k8sConfig.caCert;
    }

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Try to load kubeconfig from default location
const tryLoadKubeconfig = () => {
  try {
    const kubeconfigPath = path.join(process.env.HOME || process.env.USERPROFILE, '.kube', 'config');
    if (!fs.existsSync(kubeconfigPath)) {
      return null;
    }

    const content = fs.readFileSync(kubeconfigPath, 'utf8');
    const kubeconfig = YAML.parse(content);

    // Get current context
    const currentContextName = kubeconfig['current-context'];
    if (!currentContextName) {
      console.error('No current-context found in kubeconfig');
      return null;
    }

    // Find the context
    const context = kubeconfig.contexts?.find(c => c.name === currentContextName);
    if (!context) {
      console.error(`Context ${currentContextName} not found`);
      return null;
    }

    // Find the cluster
    const cluster = kubeconfig.clusters?.find(c => c.name === context.context.cluster);
    if (!cluster) {
      console.error(`Cluster ${context.context.cluster} not found`);
      return null;
    }

    // Find the user
    const user = kubeconfig.users?.find(u => u.name === context.context.user);
    if (!user) {
      console.error(`User ${context.context.user} not found`);
      return null;
    }

    const result = {
      apiServer: cluster.cluster.server,
      contextName: currentContextName
    };

    // Handle CA certificate
    if (cluster.cluster['certificate-authority']) {
      try {
        result.caCert = fs.readFileSync(cluster.cluster['certificate-authority'], 'utf8');
      } catch (e) {
        console.warn('Could not read CA certificate:', e.message);
      }
    } else if (cluster.cluster['certificate-authority-data']) {
      result.caCert = Buffer.from(cluster.cluster['certificate-authority-data'], 'base64').toString('utf8');
    }

    // Handle user authentication - token
    if (user.user.token) {
      result.token = user.user.token;
    }

    // Handle user authentication - client certificate (e.g., minikube)
    if (user.user['client-certificate']) {
      try {
        result.clientCert = fs.readFileSync(user.user['client-certificate'], 'utf8');
      } catch (e) {
        console.warn('Could not read client certificate:', e.message);
      }
    } else if (user.user['client-certificate-data']) {
      result.clientCert = Buffer.from(user.user['client-certificate-data'], 'base64').toString('utf8');
    }

    if (user.user['client-key']) {
      try {
        result.clientKey = fs.readFileSync(user.user['client-key'], 'utf8');
      } catch (e) {
        console.warn('Could not read client key:', e.message);
      }
    } else if (user.user['client-key-data']) {
      result.clientKey = Buffer.from(user.user['client-key-data'], 'base64').toString('utf8');
    }

    return result;
  } catch (err) {
    console.error('Error loading kubeconfig:', err);
  }
  return null;
};

// Check connection status
router.get('/status', async (req, res) => {
  if (!k8sConfig.connected) {
    // Try to auto-detect kubeconfig
    const kubeconfig = tryLoadKubeconfig();
    if (kubeconfig) {
      k8sConfig.apiServer = kubeconfig.apiServer;
      k8sConfig.token = kubeconfig.token || '';
      k8sConfig.caCert = kubeconfig.caCert || '';
      k8sConfig.clientCert = kubeconfig.clientCert || '';
      k8sConfig.clientKey = kubeconfig.clientKey || '';
      k8sConfig.contextName = kubeconfig.contextName || '';
      
      try {
        const version = await k8sRequest('/version');
        k8sConfig.connected = true;
        return res.json({
          connected: true,
          apiServer: k8sConfig.apiServer,
          contextName: k8sConfig.contextName,
          authMethod: k8sConfig.token ? 'token' : (k8sConfig.clientCert ? 'certificate' : 'none'),
          clusterInfo: {
            version: version.gitVersion,
            platform: version.platform
          }
        });
      } catch (err) {
        // Auto-detect failed, user needs to connect manually
        console.error('Auto-connect failed:', err.message);
      }
    }
    return res.json({ connected: false });
  }

  try {
    const version = await k8sRequest('/version');
    res.json({
      connected: true,
      apiServer: k8sConfig.apiServer,
      contextName: k8sConfig.contextName,
      authMethod: k8sConfig.token ? 'token' : (k8sConfig.clientCert ? 'certificate' : 'none'),
      clusterInfo: {
        version: version.gitVersion,
        platform: version.platform
      }
    });
  } catch (err) {
    k8sConfig.connected = false;
    res.json({ connected: false, error: err.message });
  }
});

// Connect to cluster
router.post('/connect', async (req, res) => {
  const { apiServer, token, caCert } = req.body;

  if (!apiServer) {
    return res.status(400).json({ success: false, error: 'API server URL is required' });
  }

  k8sConfig = {
    apiServer: apiServer.replace(/\/$/, ''), // Remove trailing slash
    token: token || '',
    caCert: caCert || '',
    connected: false
  };

  try {
    // Test connection by getting version info
    const version = await k8sRequest('/version');
    k8sConfig.connected = true;

    res.json({
      success: true,
      clusterInfo: {
        version: version.gitVersion,
        platform: version.platform,
        name: new URL(apiServer).hostname
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `Failed to connect: ${err.message}`
    });
  }
});

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  if (!k8sConfig.connected) {
    return res.status(400).json({ success: false, error: 'Not connected to cluster' });
  }

  try {
    // Fetch multiple resources in parallel
    const [nodes, pods, deployments, services, pvcs, namespaces] = await Promise.all([
      k8sRequest('/api/v1/nodes').catch(() => ({ items: [] })),
      k8sRequest('/api/v1/pods').catch(() => ({ items: [] })),
      k8sRequest('/apis/apps/v1/deployments').catch(() => ({ items: [] })),
      k8sRequest('/api/v1/services').catch(() => ({ items: [] })),
      k8sRequest('/api/v1/persistentvolumeclaims').catch(() => ({ items: [] })),
      k8sRequest('/api/v1/namespaces').catch(() => ({ items: [] }))
    ]);

    // Calculate stats
    const nodeItems = nodes.items || [];
    const podItems = pods.items || [];
    const deploymentItems = deployments.items || [];
    const serviceItems = services.items || [];
    const pvcItems = pvcs.items || [];
    const namespaceItems = namespaces.items || [];

    const stats = {
      nodes: {
        total: nodeItems.length,
        ready: nodeItems.filter(n => 
          n.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
        ).length
      },
      pods: {
        total: podItems.length,
        running: podItems.filter(p => p.status?.phase === 'Running').length,
        pending: podItems.filter(p => p.status?.phase === 'Pending').length,
        failed: podItems.filter(p => p.status?.phase === 'Failed').length
      },
      deployments: {
        total: deploymentItems.length,
        available: deploymentItems.filter(d => 
          d.status?.availableReplicas >= (d.spec?.replicas || 0)
        ).length
      },
      services: {
        total: serviceItems.length,
        loadBalancer: serviceItems.filter(s => s.spec?.type === 'LoadBalancer').length,
        nodePort: serviceItems.filter(s => s.spec?.type === 'NodePort').length
      },
      pvcs: {
        total: pvcItems.length,
        bound: pvcItems.filter(p => p.status?.phase === 'Bound').length,
        pending: pvcItems.filter(p => p.status?.phase === 'Pending').length
      },
      namespaces: {
        total: namespaceItems.length,
        active: namespaceItems.filter(n => n.status?.phase === 'Active').length
      }
    };

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Resource type to API path mapping
const resourcePaths = {
  // Core v1
  pods: '/api/v1/pods',
  services: '/api/v1/services',
  configmaps: '/api/v1/configmaps',
  secrets: '/api/v1/secrets',
  persistentvolumeclaims: '/api/v1/persistentvolumeclaims',
  persistentvolumes: '/api/v1/persistentvolumes',
  nodes: '/api/v1/nodes',
  namespaces: '/api/v1/namespaces',
  events: '/api/v1/events',
  serviceaccounts: '/api/v1/serviceaccounts',
  endpoints: '/api/v1/endpoints',
  
  // Apps v1
  deployments: '/apis/apps/v1/deployments',
  replicasets: '/apis/apps/v1/replicasets',
  statefulsets: '/apis/apps/v1/statefulsets',
  daemonsets: '/apis/apps/v1/daemonsets',
  
  // Batch v1
  jobs: '/apis/batch/v1/jobs',
  cronjobs: '/apis/batch/v1/cronjobs',
  
  // Networking
  ingresses: '/apis/networking.k8s.io/v1/ingresses',
  networkpolicies: '/apis/networking.k8s.io/v1/networkpolicies',
  
  // Storage
  storageclasses: '/apis/storage.k8s.io/v1/storageclasses',
  
  // RBAC
  roles: '/apis/rbac.authorization.k8s.io/v1/roles',
  rolebindings: '/apis/rbac.authorization.k8s.io/v1/rolebindings',
  clusterroles: '/apis/rbac.authorization.k8s.io/v1/clusterroles',
  clusterrolebindings: '/apis/rbac.authorization.k8s.io/v1/clusterrolebindings'
};

// Namespaced resource paths
const namespacedResourcePaths = {
  pods: '/api/v1/namespaces/{namespace}/pods',
  services: '/api/v1/namespaces/{namespace}/services',
  configmaps: '/api/v1/namespaces/{namespace}/configmaps',
  secrets: '/api/v1/namespaces/{namespace}/secrets',
  persistentvolumeclaims: '/api/v1/namespaces/{namespace}/persistentvolumeclaims',
  events: '/api/v1/namespaces/{namespace}/events',
  serviceaccounts: '/api/v1/namespaces/{namespace}/serviceaccounts',
  endpoints: '/api/v1/namespaces/{namespace}/endpoints',
  deployments: '/apis/apps/v1/namespaces/{namespace}/deployments',
  replicasets: '/apis/apps/v1/namespaces/{namespace}/replicasets',
  statefulsets: '/apis/apps/v1/namespaces/{namespace}/statefulsets',
  daemonsets: '/apis/apps/v1/namespaces/{namespace}/daemonsets',
  jobs: '/apis/batch/v1/namespaces/{namespace}/jobs',
  cronjobs: '/apis/batch/v1/namespaces/{namespace}/cronjobs',
  ingresses: '/apis/networking.k8s.io/v1/namespaces/{namespace}/ingresses',
  networkpolicies: '/apis/networking.k8s.io/v1/namespaces/{namespace}/networkpolicies',
  roles: '/apis/rbac.authorization.k8s.io/v1/namespaces/{namespace}/roles',
  rolebindings: '/apis/rbac.authorization.k8s.io/v1/namespaces/{namespace}/rolebindings'
};

// List resources
router.get('/resources/:resourceType', async (req, res) => {
  if (!k8sConfig.connected) {
    return res.status(400).json({ success: false, error: 'Not connected to cluster' });
  }

  const { resourceType } = req.params;
  const { namespace } = req.query;

  let apiPath;
  if (namespace && namespacedResourcePaths[resourceType]) {
    apiPath = namespacedResourcePaths[resourceType].replace('{namespace}', namespace);
  } else {
    apiPath = resourcePaths[resourceType];
  }

  if (!apiPath) {
    return res.status(400).json({ success: false, error: `Unknown resource type: ${resourceType}` });
  }

  try {
    const data = await k8sRequest(apiPath);
    res.json({
      success: true,
      items: data.items || [],
      metadata: data.metadata
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single resource
router.get('/resource/:resourceType/:name', async (req, res) => {
  if (!k8sConfig.connected) {
    return res.status(400).json({ success: false, error: 'Not connected to cluster' });
  }

  const { resourceType, name } = req.params;
  const { namespace } = req.query;

  let apiPath;
  if (namespace && namespacedResourcePaths[resourceType]) {
    apiPath = namespacedResourcePaths[resourceType].replace('{namespace}', namespace) + '/' + name;
  } else {
    apiPath = resourcePaths[resourceType] + '/' + name;
  }

  if (!resourcePaths[resourceType]) {
    return res.status(400).json({ success: false, error: `Unknown resource type: ${resourceType}` });
  }

  try {
    const data = await k8sRequest(apiPath);
    res.json({
      success: true,
      resource: data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get events for a resource
router.get('/events/:namespace/:name', async (req, res) => {
  if (!k8sConfig.connected) {
    return res.status(400).json({ success: false, error: 'Not connected to cluster' });
  }

  const { namespace, name } = req.params;

  try {
    const apiPath = `/api/v1/namespaces/${namespace}/events?fieldSelector=involvedObject.name=${name}`;
    const data = await k8sRequest(apiPath);
    
    // Sort events by last timestamp
    const events = (data.items || []).sort((a, b) => {
      const timeA = new Date(a.lastTimestamp || a.eventTime || 0);
      const timeB = new Date(b.lastTimestamp || b.eventTime || 0);
      return timeB - timeA;
    });

    res.json({
      success: true,
      events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get pod logs
router.get('/logs/:namespace/:podName', async (req, res) => {
  if (!k8sConfig.connected) {
    return res.status(400).json({ success: false, error: 'Not connected to cluster' });
  }

  const { namespace, podName } = req.params;
  const { container, tailLines = 100 } = req.query;

  try {
    let apiPath = `/api/v1/namespaces/${namespace}/pods/${podName}/log?tailLines=${tailLines}`;
    if (container) {
      apiPath += `&container=${container}`;
    }

    const logs = await k8sRequest(apiPath);
    res.json({
      success: true,
      logs: typeof logs === 'string' ? logs : ''
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Disconnect
router.post('/disconnect', (req, res) => {
  k8sConfig = {
    apiServer: '',
    token: '',
    caCert: '',
    clientCert: '',
    clientKey: '',
    connected: false,
    contextName: ''
  };
  res.json({ success: true });
});

module.exports = router;
