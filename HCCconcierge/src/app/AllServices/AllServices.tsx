import * as React from 'react';
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Gallery,
  Grid,
  GridItem,
  PageSection,
  Title
} from '@patternfly/react-core';
import { 
  BellIcon,
  BrainIcon, 
  CreditCardIcon,
  CubeIcon,
  ExternalLinkAltIcon,
  EyeIcon,
  ListIcon,
  PlayIcon,
  RocketIcon,
  ServerIcon,
  ShieldAltIcon,
  StarIcon,
  UsersIcon,
  WrenchIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  details: string;
  features: string[];
  icon: React.ReactElement;
  url?: string;
  isLink?: boolean;
  category: string;
  route?: string;
}

const AllServices: React.FunctionComponent = () => {
  const navigate = useNavigate();

  // Services data from the masthead dropdown - combining Platforms and Services
  const allServices: ServiceItem[] = [
    // Cloud Services
    {
      id: 'my-favorite-services',
      name: 'My Favorite Services',
      description: 'Quick access to your most-used services',
      details: 'Access your frequently used and bookmarked services in one convenient location. Customize your dashboard with the services you use most often to improve your workflow efficiency.',
      features: ['Quick Access', 'Custom Dashboard', 'Service Bookmarks', 'Usage Analytics'],
      icon: <StarIcon style={{ color: '#f39200' }} />,
      category: 'Services'
    },
    {
      id: 'ai-ml',
      name: 'AI/ML',
      description: 'Artificial intelligence and machine learning services',
      details: 'Build, train, and deploy machine learning models with enterprise-grade AI/ML platforms. Access GPU-accelerated computing, automated model training, and MLOps pipelines.',
      features: ['Model Training', 'GPU Computing', 'MLOps Pipelines', 'Data Science Workbenches'],
      icon: <BrainIcon />,
      category: 'Services'
    },
    {
      id: 'alerting-data-integrations',
      name: 'Alerting & Data Integrations',
      description: 'Monitoring alerts and data pipeline management',
      details: 'Configure intelligent alerting systems and manage data integration workflows across your hybrid cloud infrastructure with real-time monitoring and automated responses.',
      features: ['Real-time Alerts', 'Data Pipelines', 'Integration Workflows', 'Event Processing'],
      icon: <BellIcon />,
      category: 'Services',
      route: '/alert-manager'
    },
    {
      id: 'automation',
      name: 'Automation',
      description: 'Infrastructure and application automation',
      details: 'Automate repetitive tasks, configuration management, and deployment processes with comprehensive automation tools and workflow orchestration.',
      features: ['Task Automation', 'Configuration Management', 'Workflow Orchestration', 'Process Optimization'],
      icon: <WrenchIcon />,
      category: 'Services'
    },
    {
      id: 'containers',
      name: 'Containers',
      description: 'Container management and orchestration',
      details: 'Deploy, manage, and scale containerized applications with enterprise Kubernetes platforms, container registries, and orchestration tools.',
      features: ['Container Orchestration', 'Registry Management', 'Application Scaling', 'Service Mesh'],
      icon: <CubeIcon />,
      category: 'Services'
    },
    {
      id: 'deploy',
      name: 'Deploy',
      description: 'Application deployment and delivery',
      details: 'Streamline application deployment with CI/CD pipelines, automated testing, and progressive delivery strategies across multiple environments.',
      features: ['CI/CD Pipelines', 'Automated Testing', 'Progressive Delivery', 'Environment Management'],
      icon: <RocketIcon />,
      category: 'Services'
    },
    {
      id: 'identity-access-mgmt',
      name: 'Identity & Access Management',
      description: 'User authentication and authorization',
      details: 'Secure your applications with comprehensive identity management, single sign-on, multi-factor authentication, and role-based access controls.',
      features: ['Single Sign-On', 'Multi-Factor Auth', 'Role-Based Access', 'Identity Federation'],
      icon: <UsersIcon />,
      category: 'Services',
      route: '/my-user-access'
    },
    {
      id: 'inventories',
      name: 'Inventories',
      description: 'Asset and resource inventory management',
      details: 'Track and manage your IT assets, infrastructure resources, and application inventories with automated discovery and real-time updates.',
      features: ['Asset Discovery', 'Resource Tracking', 'Inventory Updates', 'Compliance Reporting'],
      icon: <ListIcon />,
      category: 'Services'
    },
    {
      id: 'observability-monitoring',
      name: 'Observability & Monitoring',
      description: 'System monitoring and observability',
      details: 'Gain deep insights into your applications and infrastructure with comprehensive monitoring, logging, tracing, and performance analytics.',
      features: ['Application Monitoring', 'Infrastructure Metrics', 'Distributed Tracing', 'Log Analytics'],
      icon: <EyeIcon />,
      category: 'Services'
    },
    {
      id: 'operators',
      name: 'Operators',
      description: 'Kubernetes operators and lifecycle management',
      details: 'Deploy and manage complex applications on Kubernetes with operators that automate installation, updates, and day-2 operations.',
      features: ['Operator Lifecycle', 'Application Management', 'Automated Updates', 'Cluster Operations'],
      icon: <PlayIcon />,
      category: 'Services'
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Security scanning and threat protection',
      details: 'Protect your infrastructure with advanced security scanning, vulnerability management, threat detection, and compliance monitoring.',
      features: ['Vulnerability Scanning', 'Threat Detection', 'Security Policies', 'Compliance Monitoring'],
      icon: <ShieldAltIcon />,
      category: 'Services'
    },
    {
      id: 'subscriptions-spend',
      name: 'Subscriptions & Spend',
      description: 'Subscription management and cost optimization',
      details: 'Manage subscriptions, track usage, optimize costs, and analyze spending patterns across your Red Hat services and cloud resources.',
      features: ['Subscription Tracking', 'Cost Analysis', 'Usage Optimization', 'Spend Management'],
      icon: <CreditCardIcon />,
      category: 'Services'
    },
    {
      id: 'system-configuration',
      name: 'System Configuration',
      description: 'System settings and configuration management',
      details: 'Configure and manage system settings, infrastructure parameters, and application configurations with centralized management tools.',
      features: ['Configuration Management', 'System Settings', 'Parameter Tuning', 'Change Tracking'],
      icon: <ServerIcon />,
      category: 'Services'
    }
  ];

  const categories = ['All', 'Platforms', 'Services'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredServices = selectedCategory === 'All' 
    ? allServices 
    : allServices.filter(service => service.category === selectedCategory);

  const handleServiceClick = (service: ServiceItem) => {
    if (service.isLink && service.url) {
      // External link
      window.open(service.url, '_blank');
    } else if (service.route) {
      // Internal route
      navigate(service.route);
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Home</BreadcrumbItem>
          <BreadcrumbItem isActive>All Services</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
          <FlexItem>
            <Content>
              <Title headingLevel="h1" size="2xl">
                All Services
              </Title>
              <p>
                Explore all available services in your Red Hat Hybrid Cloud Console. 
                Find the tools and services you need to manage your hybrid cloud environment.
              </p>
            </Content>
          </FlexItem>

          <FlexItem>
            {/* Category Filter */}
            <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: '24px' }}>
              {categories.map((category) => (
                <FlexItem key={category}>
                  <Button
                    variant={selectedCategory === category ? 'primary' : 'secondary'}
                    onClick={() => setSelectedCategory(category)}
                    size="sm"
                  >
                    {category}
                  </Button>
                </FlexItem>
              ))}
            </Flex>
          </FlexItem>
          
          <FlexItem>
            <Gallery hasGutter minWidths={{ default: '360px' }} maxWidths={{ default: '1fr' }}>
              {filteredServices.map((service) => (
                <Card 
                  key={service.id}
                  isClickable={!!(service.route || (service.isLink && service.url))}
                  onClick={() => handleServiceClick(service)}
                  style={{ 
                    height: '100%',
                    cursor: (service.route || (service.isLink && service.url)) ? 'pointer' : 'default'
                  }}
                >
                  <CardHeader>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <div style={{ fontSize: '20px', color: 'var(--pf-v6-global--primary-color--100)' }}>
                          {service.icon}
                        </div>
                      </FlexItem>
                      <FlexItem flex={{ default: 'flex_1' }}>
                        <CardTitle component="h3">{service.name}</CardTitle>
                      </FlexItem>
                      <FlexItem>
                        <Badge isRead>{service.category}</Badge>
                      </FlexItem>
                    </Flex>
                    {service.isLink && (
                      <div style={{ marginTop: '8px' }}>
                        <ExternalLinkAltIcon style={{ fontSize: '14px', color: 'var(--pf-v6-global--Color--200)' }} />
                      </div>
                    )}
                  </CardHeader>
                  <CardBody>
                    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Content>
                          <p style={{ margin: 0, color: 'var(--pf-v6-global--Color--200)' }}>
                            {service.description}
                          </p>
                        </Content>
                      </FlexItem>
                      <FlexItem>
                        <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ flexWrap: 'wrap' }}>
                          {service.features.slice(0, 3).map((feature, index) => (
                            <FlexItem key={index}>
                              <Badge 
                                style={{ 
                                  fontSize: '11px',
                                  padding: '2px 6px'
                                }}
                              >
                                {feature}
                              </Badge>
                            </FlexItem>
                          ))}
                          {service.features.length > 3 && (
                            <FlexItem>
                              <Badge 
                                style={{ 
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  color: 'var(--pf-v6-global--Color--200)'
                                }}
                              >
                                +{service.features.length - 3} more
                              </Badge>
                            </FlexItem>
                          )}
                        </Flex>
                      </FlexItem>
                      {!(service.route || (service.isLink && service.url)) && (
                        <FlexItem>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--pf-v6-global--Color--200)',
                            fontStyle: 'italic'
                          }}>
                            Coming soon
                          </div>
                        </FlexItem>
                      )}
                    </Flex>
                  </CardBody>
                </Card>
              ))}
            </Gallery>
          </FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export { AllServices };
