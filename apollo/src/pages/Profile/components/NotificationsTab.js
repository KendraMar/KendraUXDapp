import React from 'react';
import { Title } from '@patternfly/react-core';

const NotificationsTab = () => {
  return (
    <div>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
        Notification Settings
      </Title>
      <p>Notification preferences will be available here.</p>
    </div>
  );
};

export default NotificationsTab;
