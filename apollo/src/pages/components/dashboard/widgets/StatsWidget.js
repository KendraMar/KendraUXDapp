import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flex,
  FlexItem,
  Title,
  Content,
  Icon
} from '@patternfly/react-core';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  EqualsIcon
} from '@patternfly/react-icons';

/**
 * StatsWidget - Displays a large number/metric with optional label and trend
 * 
 * Expected data shape:
 * {
 *   value: number | string,
 *   label: string,
 *   linkUrl: string (optional) - in-app route to navigate on click,
 *   trend: { direction: 'up' | 'down' | 'flat', value: string } (optional)
 *   secondaryStats: [{ label: string, value: string|number }] (optional)
 * }
 */
const StatsWidget = ({ data }) => {
  const navigate = useNavigate();

  if (!data) return null;

  const { value, label, trend, secondaryStats, linkUrl } = data;

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up': return ArrowUpIcon;
      case 'down': return ArrowDownIcon;
      default: return EqualsIcon;
    }
  };

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up': return 'var(--pf-t--global--color--status--success--default)';
      case 'down': return 'var(--pf-t--global--color--status--danger--default)';
      default: return 'var(--pf-t--global--color--status--info--default)';
    }
  };

  const handleClick = () => {
    if (linkUrl) {
      navigate(linkUrl);
    }
  };

  return (
    <Flex
      direction={{ default: 'column' }}
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      className={`dashboard-stats-widget ${linkUrl ? 'dashboard-stats-widget--clickable' : ''}`}
      style={{ height: '100%', textAlign: 'center', padding: '1rem', cursor: linkUrl ? 'pointer' : 'default' }}
      onClick={handleClick}
      role={linkUrl ? 'link' : undefined}
      tabIndex={linkUrl ? 0 : undefined}
      onKeyDown={linkUrl ? (e) => { if (e.key === 'Enter') handleClick(); } : undefined}
    >
      <FlexItem>
        <Title headingLevel="h2" size="4xl" className="dashboard-stats-value">
          {value !== undefined ? value : '--'}
        </Title>
      </FlexItem>
      {label && (
        <FlexItem>
          <Content component="p" className="dashboard-stats-label" style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: '1rem', marginTop: '0.25rem' }}>
            {label}
          </Content>
        </FlexItem>
      )}
      {trend && (
        <FlexItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }} style={{ marginTop: '0.5rem' }}>
            <FlexItem>
              <Icon style={{ color: getTrendColor(trend.direction) }}>
                {React.createElement(getTrendIcon(trend.direction))}
              </Icon>
            </FlexItem>
            <FlexItem>
              <Content component="small" style={{ color: getTrendColor(trend.direction) }}>
                {trend.value}
              </Content>
            </FlexItem>
          </Flex>
        </FlexItem>
      )}
      {secondaryStats && secondaryStats.length > 0 && (
        <FlexItem style={{ marginTop: '1rem', width: '100%' }}>
          <Flex justifyContent={{ default: 'justifyContentSpaceEvenly' }} gap={{ default: 'gapMd' }}>
            {secondaryStats.map((stat, i) => (
              <FlexItem key={i} style={{ textAlign: 'center' }}>
                <Content component="p" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{stat.value}</Content>
                <Content component="small" style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>{stat.label}</Content>
              </FlexItem>
            ))}
          </Flex>
        </FlexItem>
      )}
    </Flex>
  );
};

export default StatsWidget;
