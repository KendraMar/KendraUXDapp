import * as React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Intro } from '@app/Intro/Intro';
import { Homepage } from '@app/Homepage/Homepage';
import { AllServices } from '@app/AllServices/AllServices';
import { Dashboard } from '@app/Dashboard/Dashboard';
import { Dashboard2 } from '@app/Dashboard/Dashboard2';
import { Dashboard3 } from '@app/Dashboard/Dashboard3';
import { AccessOverview } from '@app/AccessOverview/AccessOverview';
import { AlertManager } from '@app/AlertManager/AlertManager';
import { RoleDeleted } from '@app/AlertManager/RoleDeleted';
import { AuthenticationPolicy } from '@app/AuthenticationPolicy/AuthenticationPolicy';
import { DataIntegration } from '@app/DataIntegration/DataIntegration';
import { EventLog } from '@app/EventLog/EventLog';
import { LearningResources } from '@app/LearningResources/LearningResources';
import { LearningResourcesIAM } from '@app/LearningResourcesIAM/LearningResourcesIAM';
import { MyUserAccess } from '@app/MyUserAccess/MyUserAccess'; 
import { ServiceAccounts } from '@app/ServiceAccounts/ServiceAccounts';
import { UserAccess } from '@app/UserAccess/UserAccess';
import { CVEDashboard } from '@app/CVEDashboard/CVEDashboard';
import { RHELDashboard } from '@app/RHELDashboard/RHELDashboard';
import { Integrations } from '@app/Integrations/Integrations';
import { RHELSystems } from '@app/RHELSystems/RHELSystems';
import { RHELCompliance } from '@app/RHELCompliance/RHELCompliance';
import { RHELOpenShift } from '@app/RHELOpenShift/RHELOpenShift';
import { Support } from '@app/Support/Support';
import { JIRA } from '@app/JIRA/JIRA';
import { Users } from '@app/Users/Users';
import { Groups } from '@app/Groups/Groups';
import { Roles } from '@app/Roles/Roles';
import { AlertOverriderRole } from '@app/Roles/AlertOverriderRole';
import { Workspaces } from '@app/Workspaces/Workspaces';
import { RedHatAccessRequests } from '@app/RedHatAccessRequests/RedHatAccessRequests';
import { GeneralSettings } from '@app/Settings/General/GeneralSettings';
import { ProfileSettings } from '@app/Settings/Profile/ProfileSettings';
import { NotFound } from '@app/NotFound/NotFound';

export interface IAppRoute {
  label?: string; // Excluding the label will exclude the route from the nav sidebar in AppLayout
  element: React.ReactElement;
  exact?: boolean;
  path: string;
  title: string;
  routes?: undefined;
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

export type AppRouteConfig = IAppRoute | IAppRouteGroup;

const routes: AppRouteConfig[] = [
  {
    element: <Intro />,
    exact: true,
    label: 'Intro',
    path: '/intro',
    title: 'Intro | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Homepage />,
    exact: true,
    label: 'Dashboard',
    path: '/dashboard',
    title: 'Dashboard | Red Hat Hybrid Cloud Console',
  },
  {
    element: <AllServices />,
    exact: true,
    path: '/all-services',
    title: 'All Services | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Dashboard />,
    exact: true,
    label: 'Overview',
    path: '/overview',
    title: 'Overview | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Dashboard2 />,
    exact: true,
    label: 'Dashboard2',
    path: '/dashboard2',
    title: 'Dashboard2 | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Dashboard3 />,
    exact: true,
    label: 'Dashboard3',
    path: '/dashboard3',
    title: 'Dashboard3 | Red Hat Hybrid Cloud Console',
  },
  {
    element: <AccessOverview />,
    exact: true,
    label: 'Access Overview',
    path: '/access-overview',
    title: 'Access Overview | Red Hat Hybrid Cloud Console',
  },
  {
    element: <AlertManager />,
    exact: true,
    label: 'Alert Manager',
    path: '/alert-manager',
    title: 'Alert Manager | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RoleDeleted />,
    exact: true,
    path: '/alert-manager/role-deleted',
    title: 'Role deleted | Alert Manager | Red Hat Hybrid Cloud Console',
  },
  {
    element: <DataIntegration />,
    exact: true,
    label: 'Data Integration',
    path: '/data-integration',
    title: 'Data Integration | Red Hat Hybrid Cloud Console',
  },
  {
    element: <DataIntegration />,
    exact: true,
    path: '/data-integrations',
    title: 'Data Integration | Red Hat Hybrid Cloud Console',
  },
  {
    element: <EventLog />,
    exact: true,
    label: 'Event Log',
    path: '/event-log',
    title: 'Event Log | Red Hat Hybrid Cloud Console',
  },
  {
    element: <LearningResources />,
    exact: true,
    label: 'Learning Resources',
    path: '/learning-resources',
    title: 'Learning Resources | Red Hat Hybrid Cloud Console',
  },
  // Routes without labels (accessible via URL but not shown in navigation)
  {
    element: <MyUserAccess />,
    exact: true,
    path: '/my-user-access',
    title: 'My Access | Red Hat Hybrid Cloud Console',
  },
  {
    element: <UserAccess />,
    exact: true,
    path: '/user-access',
    title: 'User Access | Red Hat Hybrid Cloud Console',
  },
  {
    element: <CVEDashboard />,
    exact: true,
    path: '/cve-dashboard',
    title: 'CVE Dashboard | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RHELDashboard />,
    exact: true,
    path: '/rhel-dashboard',
    title: 'RHEL Dashboard | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Integrations />,
    exact: true,
    path: '/integrations',
    title: 'Integrations | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RHELSystems />,
    exact: true,
    path: '/rhel-systems',
    title: 'RHEL Systems | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RHELCompliance />,
    exact: true,
    path: '/rhel-compliance',
    title: 'RHEL Compliance | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RHELOpenShift />,
    exact: true,
    path: '/rhelopenshift',
    title: 'RHEL & OpenShift Systems | Red Hat Hybrid Cloud Console',
  },
  {
    element: <AuthenticationPolicy />,
    exact: true,
    path: '/authentication-policy',
    title: 'Authentication Policy | Red Hat Hybrid Cloud Console',
  },
  {
    element: <ServiceAccounts />,
    exact: true,
    path: '/service-accounts',
    title: 'Service Accounts | Red Hat Hybrid Cloud Console',
  },
  {
    element: <GeneralSettings />,
    exact: true,
    path: '/settings/general',
    title: 'General Settings | Red Hat Hybrid Cloud Console',
  },
  {
    element: <ProfileSettings />,
    exact: true,
    path: '/settings/profile',
    title: 'Profile Settings | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Support />,
    exact: true,
    path: '/support',
    title: 'Support | Red Hat Hybrid Cloud Console',
  },
  {
    element: <JIRA />,
    exact: true,
    label: 'JIRA Issues',
    path: '/jira',
    title: 'JIRA Issues | Red Hat Hybrid Cloud Console',
  },
  {
    element: <LearningResourcesIAM />,
    exact: true,
    path: '/learning-resources-iam',
    title: 'IAM Learning Resources | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Users />,
    exact: true,
    path: '/users',
    title: 'Users | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Groups />,
    exact: true,
    path: '/groups',
    title: 'Groups | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Roles />,
    exact: true,
    path: '/roles',
    title: 'Roles | Red Hat Hybrid Cloud Console',
  },
  {
    element: <AlertOverriderRole />,
    exact: true,
    path: '/user-access/roles/alert-overrider',
    title: 'Alert overrider | Red Hat Hybrid Cloud Console',
  },
  {
    element: <Workspaces />,
    exact: true,
    path: '/workspaces',
    title: 'Workspaces | Red Hat Hybrid Cloud Console',
  },
  {
    element: <RedHatAccessRequests />,
    exact: true,
    path: '/red-hat-access-requests',
    title: 'Red Hat Access Requests | Red Hat Hybrid Cloud Console',
  },
];

const flattenedRoutes: IAppRoute[] = routes.reduce(
  (flattened, route) => [...flattened, ...(route.routes ? route.routes : [route])],
  [] as IAppRoute[],
);

const AppRoutes = (): React.ReactElement => (
  <Routes>
    <Route path="/" element={<Navigate to="/intro" replace />} />
    {flattenedRoutes.map(({ path, element }, idx) => (
      <Route path={path} element={element} key={idx} />
    ))}
    <Route element={<NotFound />} />
  </Routes>
);

export { AppRoutes, routes };
