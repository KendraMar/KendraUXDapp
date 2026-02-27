import React from 'react';
import {
  Content,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateBody
} from '@patternfly/react-core';

/**
 * ChartWidget - Displays a simple horizontal bar chart using CSS
 * 
 * Expected data shape:
 * {
 *   title: string (optional),
 *   bars: [
 *     {
 *       label: string,
 *       value: number,
 *       color: string (optional, CSS color)
 *     }
 *   ]
 * }
 */

const DEFAULT_COLORS = [
  'var(--pf-t--global--color--brand--default)',
  'var(--pf-t--global--color--status--success--default)',
  'var(--pf-t--global--color--status--warning--default)',
  'var(--pf-t--global--color--status--danger--default)',
  'var(--pf-t--global--color--status--info--default)',
  'var(--pf-t--global--color--status--custom--default)',
];

const ChartWidget = ({ data }) => {
  if (!data || !data.bars || data.bars.length === 0) {
    return (
      <EmptyState variant="xs">
        <EmptyStateBody>No data available</EmptyStateBody>
      </EmptyState>
    );
  }

  const { bars, title } = data;
  const maxValue = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="dashboard-chart-widget" style={{ padding: '0.75rem', height: '100%', overflow: 'auto' }}>
      {title && (
        <Content component="p" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
          {title}
        </Content>
      )}
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        {bars.map((bar, index) => (
          <FlexItem key={index}>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '0.25rem' }}>
              <FlexItem>
                <Content component="small" style={{ fontWeight: 500 }}>
                  {bar.label}
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="small" style={{ fontWeight: 600 }}>
                  {bar.value}
                </Content>
              </FlexItem>
            </Flex>
            <div
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${(bar.value / maxValue) * 100}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: bar.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </FlexItem>
        ))}
      </Flex>
    </div>
  );
};

export default ChartWidget;
