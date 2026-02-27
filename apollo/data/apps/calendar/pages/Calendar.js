import React, { useState, useEffect } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Spinner,
  Alert,
  Button,
  Checkbox,
  Label,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  Divider,
  Panel,
  PanelMain,
  PanelMainBody,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Tooltip
} from '@patternfly/react-core';
import {
  CalendarAltIcon,
  ExternalLinkAltIcon,
  MapMarkerAltIcon,
  UsersIcon,
  VideoIcon,
  ClockIcon,
  SyncAltIcon,
  CogIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [enabledCalendars, setEnabledCalendars] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Load calendars and events on mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload events when enabled calendars change
  useEffect(() => {
    if (Object.keys(enabledCalendars).length > 0) {
      loadEvents();
    }
  }, [enabledCalendars]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load calendars and preferences in parallel
      const [calendarsResponse, prefsResponse] = await Promise.all([
        fetch('/api/google/calendar/calendars'),
        fetch('/api/google/calendar/preferences')
      ]);
      
      const calendarsData = await calendarsResponse.json();
      const prefsData = await prefsResponse.json();
      
      if (!calendarsData.success) {
        throw new Error(calendarsData.error || 'Failed to load calendars');
      }
      
      setCalendars(calendarsData.calendars);
      
      // Load saved preferences, or default all to OFF
      const savedEnabled = prefsData.success ? prefsData.preferences?.enabledCalendars || {} : {};
      
      // Build enabled state - use saved preferences if available, otherwise default to false
      const enabledState = {};
      calendarsData.calendars.forEach(cal => {
        enabledState[cal.id] = savedEnabled[cal.id] === true;
      });
      setEnabledCalendars(enabledState);
      
      // Load events for any enabled calendars
      const enabledIds = Object.entries(enabledState)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id)
        .join(',');
      
      if (enabledIds) {
        await loadEventsForCalendars(enabledIds);
      } else {
        setEvents([]);
      }
      
    } catch (err) {
      console.error('Error loading calendar data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    const enabledIds = Object.entries(enabledCalendars)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id)
      .join(',');
    
    if (!enabledIds) {
      setEvents([]);
      return;
    }
    
    await loadEventsForCalendars(enabledIds);
  };

  const loadEventsForCalendars = async (calendarIds) => {
    try {
      const eventsResponse = await fetch(`/api/google/calendar/events?calendarIds=${encodeURIComponent(calendarIds)}`);
      const eventsData = await eventsResponse.json();
      
      if (!eventsData.success) {
        throw new Error(eventsData.error || 'Failed to load events');
      }
      
      setEvents(eventsData.events);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleCalendar = (calendarId) => {
    setEnabledCalendars(prev => {
      const newState = {
        ...prev,
        [calendarId]: !prev[calendarId]
      };
      
      // Save preferences to server
      savePreferences(newState);
      
      return newState;
    });
  };

  const savePreferences = async (enabledState) => {
    try {
      await fetch('/api/google/calendar/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledCalendars: enabledState })
      });
    } catch (err) {
      console.error('Error saving calendar preferences:', err);
    }
  };

  const formatEventTime = (event) => {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    
    if (!start) return '';
    
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    // All-day event
    if (event.start?.date) {
      return 'All day';
    }
    
    const timeOptions = { hour: 'numeric', minute: '2-digit' };
    const startTime = startDate.toLocaleTimeString([], timeOptions);
    const endTime = endDate ? endDate.toLocaleTimeString([], timeOptions) : '';
    
    return endTime ? `${startTime} - ${endTime}` : startTime;
  };

  const formatEventDate = (event) => {
    const start = event.start?.dateTime || event.start?.date;
    if (!start) return '';
    
    const date = new Date(start);
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCalendarColor = (calendarId) => {
    const calendar = calendars.find(c => c.id === calendarId);
    return calendar?.backgroundColor || '#4285F4';
  };

  const getCalendarName = (calendarId) => {
    const calendar = calendars.find(c => c.id === calendarId);
    return calendar?.summary || 'Calendar';
  };

  // Group calendars into "My Calendars" and "Other Calendars"
  const groupCalendars = (calendars) => {
    const myCalendars = [];
    const otherCalendars = [];
    
    calendars.forEach(cal => {
      // Primary calendar or calendars the user owns go in "My Calendars"
      if (cal.primary || cal.accessRole === 'owner') {
        myCalendars.push(cal);
      } else {
        otherCalendars.push(cal);
      }
    });
    
    // Sort: primary calendar first, then alphabetically
    myCalendars.sort((a, b) => {
      if (a.primary) return -1;
      if (b.primary) return 1;
      return a.summary.localeCompare(b.summary);
    });
    
    otherCalendars.sort((a, b) => a.summary.localeCompare(b.summary));
    
    return { myCalendars, otherCalendars };
  };

  const groupEventsByDate = (events) => {
    const groups = {};
    
    events.forEach(event => {
      const start = event.start?.dateTime || event.start?.date;
      if (!start) return;
      
      const date = new Date(start);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return groups;
  };

  const isToday = (dateString) => {
    return new Date(dateString).toDateString() === new Date().toDateString();
  };

  const isTomorrow = (dateString) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(dateString).toDateString() === tomorrow.toDateString();
  };

  const getDateLabel = (dateString) => {
    if (isToday(dateString)) return 'Today';
    if (isTomorrow(dateString)) return 'Tomorrow';
    
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">Calendar</Title>
          <Content component="p">Your upcoming events</Content>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ height: '300px' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </>
    );
  }

  // Render error state
  if (error) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">Calendar</Title>
          <Content component="p">Your upcoming events</Content>
        </PageSection>
        <PageSection isFilled>
          <EmptyState
            headingLevel="h2"
            titleText="Unable to load calendar"
            icon={CalendarAltIcon}
          >
            <EmptyStateBody>
              {error.includes('not configured') ? (
                <>
                  Google Calendar is not connected yet. Please configure it in Settings to view your calendar.
                </>
              ) : (
                <>
                  There was an error loading your calendar: {error}
                </>
              )}
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                {error.includes('not configured') ? (
                  <Button variant="primary" onClick={() => navigate('/settings')}>
                    <CogIcon /> &nbsp;Go to Settings
                  </Button>
                ) : (
                  <Button variant="primary" onClick={loadData}>
                    Try Again
                  </Button>
                )}
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </PageSection>
      </>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">Calendar</Title>
            <Content component="p">Your upcoming events for the next 30 days</Content>
          </FlexItem>
          <FlexItem>
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
              isLoading={refreshing}
              icon={<SyncAltIcon />}
            >
              Refresh
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection isFilled>
        <Split hasGutter>
          {/* Sidebar: Calendar Selector */}
          <SplitItem style={{ width: '280px', flexShrink: 0 }}>
            <Card isCompact>
              <CardHeader>
                <CardTitle>Calendars</CardTitle>
              </CardHeader>
              <CardBody>
                {(() => {
                  const { myCalendars, otherCalendars } = groupCalendars(calendars);
                  
                  const renderCalendarList = (calendarList) => (
                    <Stack hasGutter>
                      {calendarList.map(calendar => (
                        <StackItem key={calendar.id}>
                          <Checkbox
                            id={`cal-${calendar.id}`}
                            label={
                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                <div 
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    backgroundColor: calendar.backgroundColor || '#4285F4'
                                  }}
                                />
                                <span style={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  maxWidth: '180px'
                                }}>
                                  {calendar.summary}
                                </span>
                                {calendar.primary && (
                                  <Label color="blue" isCompact>Primary</Label>
                                )}
                              </Flex>
                            }
                            isChecked={enabledCalendars[calendar.id] || false}
                            onChange={() => toggleCalendar(calendar.id)}
                          />
                        </StackItem>
                      ))}
                    </Stack>
                  );
                  
                  return (
                    <Stack hasGutter>
                      {myCalendars.length > 0 && (
                        <StackItem>
                          <Content 
                            component="small" 
                            style={{ 
                              fontWeight: 600, 
                              color: 'var(--pf-v6-global--Color--200)',
                              textTransform: 'uppercase',
                              fontSize: '0.7rem',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                              display: 'block'
                            }}
                          >
                            My Calendars
                          </Content>
                          {renderCalendarList(myCalendars)}
                        </StackItem>
                      )}
                      
                      {otherCalendars.length > 0 && (
                        <StackItem>
                          <Divider style={{ margin: '8px 0' }} />
                          <Content 
                            component="small" 
                            style={{ 
                              fontWeight: 600, 
                              color: 'var(--pf-v6-global--Color--200)',
                              textTransform: 'uppercase',
                              fontSize: '0.7rem',
                              letterSpacing: '0.05em',
                              marginBottom: '8px',
                              display: 'block'
                            }}
                          >
                            Other Calendars
                          </Content>
                          {renderCalendarList(otherCalendars)}
                        </StackItem>
                      )}
                    </Stack>
                  );
                })()}
              </CardBody>
            </Card>
          </SplitItem>

          {/* Main Content: Events List */}
          <SplitItem isFilled>
            {events.length === 0 ? (
              <EmptyState
                headingLevel="h3"
                titleText={Object.values(enabledCalendars).some(v => v) ? "No upcoming events" : "Select calendars to view events"}
                icon={CalendarAltIcon}
              >
                <EmptyStateBody>
                  {Object.values(enabledCalendars).some(v => v) 
                    ? "You don't have any events scheduled for the next 30 days in the selected calendars."
                    : "Enable one or more calendars from the sidebar to see your upcoming events."}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <Stack hasGutter>
                {sortedDates.map(dateString => (
                  <StackItem key={dateString}>
                    {/* Date Header */}
                    <Flex 
                      alignItems={{ default: 'alignItemsCenter' }} 
                      style={{ 
                        marginBottom: '12px',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                        padding: '8px 0',
                        zIndex: 1
                      }}
                    >
                      <Title 
                        headingLevel="h3" 
                        size="lg"
                        style={{
                          color: isToday(dateString) 
                            ? 'var(--pf-v6-global--primary-color--100)' 
                            : 'inherit'
                        }}
                      >
                        {getDateLabel(dateString)}
                      </Title>
                    </Flex>

                    {/* Events for this date */}
                    <Stack hasGutter>
                      {groupedEvents[dateString].map(event => (
                        <StackItem key={event.id}>
                          <Card 
                            isCompact 
                            isFlat
                            style={{
                              borderLeft: `4px solid ${getCalendarColor(event.calendarId)}`,
                              transition: 'box-shadow 0.15s ease'
                            }}
                            className="pf-v6-u-box-shadow-sm"
                          >
                            <CardBody style={{ padding: '16px' }}>
                              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                                <FlexItem flex={{ default: 'flex_1' }}>
                                  {/* Event Title */}
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} style={{ marginBottom: '8px' }}>
                                    <Title headingLevel="h4" size="md" style={{ margin: 0 }}>
                                      {event.summary || '(No title)'}
                                    </Title>
                                    {event.htmlLink && (
                                      <Tooltip content="Open in Google Calendar">
                                        <a 
                                          href={event.htmlLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ color: 'var(--pf-v6-global--Color--200)' }}
                                        >
                                          <ExternalLinkAltIcon />
                                        </a>
                                      </Tooltip>
                                    )}
                                  </Flex>

                                  {/* Event Details */}
                                  <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
                                    {/* Time */}
                                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                      <ClockIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                        {formatEventTime(event)}
                                      </Content>
                                    </Flex>

                                    {/* Location */}
                                    {event.location && (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                        <MapMarkerAltIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                                        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                          {event.location}
                                        </Content>
                                      </Flex>
                                    )}

                                    {/* Video Call Link */}
                                    {(event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri) && (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                        <VideoIcon style={{ color: 'var(--pf-v6-global--primary-color--100)' }} />
                                        <a 
                                          href={event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: '0.875rem' }}
                                        >
                                          Join video call
                                        </a>
                                      </Flex>
                                    )}

                                    {/* Attendees */}
                                    {event.attendees && event.attendees.length > 0 && (
                                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                                        <UsersIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                                        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                                        </Content>
                                      </Flex>
                                    )}
                                  </Flex>
                                </FlexItem>

                                {/* Calendar Label */}
                                <FlexItem>
                                  <Label 
                                    style={{ 
                                      backgroundColor: getCalendarColor(event.calendarId),
                                      color: '#fff'
                                    }}
                                    isCompact
                                  >
                                    {getCalendarName(event.calendarId)}
                                  </Label>
                                </FlexItem>
                              </Flex>

                              {/* Description */}
                              {event.description && (
                                <Content 
                                  component="p" 
                                  style={{ 
                                    marginTop: '12px', 
                                    fontSize: '0.875rem',
                                    color: 'var(--pf-v6-global--Color--200)',
                                    maxHeight: '60px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {event.description.substring(0, 200)}
                                  {event.description.length > 200 && '...'}
                                </Content>
                              )}
                            </CardBody>
                          </Card>
                        </StackItem>
                      ))}
                    </Stack>
                  </StackItem>
                ))}
              </Stack>
            )}
          </SplitItem>
        </Split>
      </PageSection>
    </>
  );
};

export default Calendar;
