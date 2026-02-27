import React from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Alert,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Content,
  Button,
  Flex,
  FlexItem,
  Label,
  Checkbox,
  Title,
  Spinner,
  Progress,
  ProgressSize
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  SyncAltIcon,
  DownloadIcon
} from '@patternfly/react-icons';

const IntegrationModal = ({
  editingService,
  editForm,
  setEditForm,
  saving,
  saveMessage,
  testing,
  testResult,
  handleSave,
  handleTestConnection,
  closeEditModal,
  setupApollo,
  apolloSetupProgress,
  apolloSetupMessage,
  apolloStatus,
  loadApolloStatus
}) => {
  if (!editingService) return null;

  const isJira = editingService.configKey === 'jira';
  const isAI = editingService.configKey === 'ai';
  const isSlack = editingService.configKey === 'slack';
  const isGoogle = editingService.configKey === 'google';
  const isGoogleCalendar = editingService.configKey === 'googleCalendar';
  const isGoogleTasks = editingService.configKey === 'googleTasks';
  const isTranscription = editingService.configKey === 'transcription';
  const isConfluence = editingService.configKey === 'confluence';
  const isGitLab = editingService.configKey === 'gitlab';
  const isFigma = editingService.configKey === 'figma';
  const isOpenAI = editingService.configKey === 'openai';
  const isAnthropic = editingService.configKey === 'anthropic';
  const isLocal = editingService.configKey === 'local';
  const isHomeAssistant = editingService.configKey === 'homeAssistant';
  const isAmbientAi = editingService.configKey === 'ambientAi';
  const isAppleMusic = editingService.configKey === 'appleMusic';
  const isKagi = editingService.configKey === 'kagi';

  return (
    <Modal
      isOpen={!!editingService}
      onClose={closeEditModal}
      aria-label={`Configure ${editingService.name}`}
      variant="medium"
    >
      <ModalHeader title={`Configure ${editingService.name}`} />
      <ModalBody>
        {saveMessage && (
          <Alert 
            variant={saveMessage.type} 
            title={saveMessage.text}
            isInline
            style={{ marginBottom: '1rem' }}
          />
        )}
        {testResult && (
          <Alert 
            variant={testResult.type} 
            title={testResult.text}
            isInline
            style={{ marginBottom: '1rem' }}
          />
        )}
        
        <Form>
          {isJira && (
            <>
              <FormGroup label="Jira URL" isRequired fieldId="jira-url">
                <TextInput
                  isRequired
                  type="url"
                  id="jira-url"
                  value={editForm.url || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, url: value }))}
                  placeholder="https://your-company.atlassian.net"
                />
              </FormGroup>
              <FormGroup label="Username / Email" isRequired fieldId="jira-username">
                <TextInput
                  isRequired
                  type="email"
                  id="jira-username"
                  value={editForm.username || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, username: value }))}
                  placeholder="your.email@company.com"
                />
              </FormGroup>
              <FormGroup 
                label="API Token" 
                isRequired={!editForm.hasExistingToken}
                fieldId="jira-token"
              >
                <TextInput
                  type="password"
                  id="jira-token"
                  value={editForm.token || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, token: value }))}
                  placeholder={editForm.hasExistingToken ? '••••••••  (leave blank to keep existing)' : 'Enter your Jira API token'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Generate a token at: Atlassian Account → Security → API Tokens
                </Content>
              </FormGroup>
            </>
          )}
          
          {isAI && (
            <>
              <FormGroup label="API URL" isRequired fieldId="ai-url">
                <TextInput
                  isRequired
                  type="url"
                  id="ai-url"
                  value={editForm.apiUrl || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiUrl: value }))}
                  placeholder="http://127.0.0.1:1234"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  For local LM Studio: http://127.0.0.1:1234
                </Content>
              </FormGroup>
              <FormGroup label="Model Name" isRequired fieldId="ai-model">
                <TextInput
                  isRequired
                  type="text"
                  id="ai-model"
                  value={editForm.model || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                  placeholder="e.g., llama-3.2-3b-instruct"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The model identifier as shown in your AI provider
                </Content>
              </FormGroup>
            </>
          )}

          {isTranscription && (
            <>
              <FormGroup fieldId="use-apollo-model">
                <Checkbox
                  id="use-apollo-model"
                  label="Use Apollo Model (built-in transcription)"
                  description="Use the built-in Whisper large-v3-turbo model for transcription. No external API required."
                  isChecked={editForm.useBuiltIn !== false}
                  onChange={(_event, checked) => setEditForm(prev => ({ ...prev, useBuiltIn: checked }))}
                />
              </FormGroup>

              {editForm.useBuiltIn !== false ? (
                <>
                  {/* Apollo Model Setup Section */}
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                    borderRadius: '8px'
                  }}>
                    <Title headingLevel="h4" size="md" style={{ marginBottom: '0.75rem' }}>
                      Apollo Transcription Status
                    </Title>
                    
                    {apolloStatus.loading ? (
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        <Spinner size="md" />
                        <Content component="p">Checking status...</Content>
                      </Flex>
                    ) : apolloStatus.ready ? (
                      <Alert variant="success" isInline title="Ready to transcribe">
                        <Content component="p" style={{ fontSize: '0.875rem' }}>
                          All components are installed and ready to use.
                        </Content>
                      </Alert>
                    ) : (
                      <>
                        {/* Component status list */}
                        <div style={{ marginBottom: '1rem' }}>
                          <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                              {apolloStatus.ffmpegInstalled ? (
                                <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                              ) : (
                                <ExclamationCircleIcon color="var(--pf-v6-global--warning-color--100)" />
                              )}
                              <Content component="span" style={{ fontSize: '0.875rem' }}>
                                ffmpeg {apolloStatus.ffmpegInstalled ? '(installed)' : '(not installed)'}
                              </Content>
                            </Flex>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                              {apolloStatus.whisperInstalled ? (
                                <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                              ) : (
                                <ExclamationCircleIcon color="var(--pf-v6-global--warning-color--100)" />
                              )}
                              <Content component="span" style={{ fontSize: '0.875rem' }}>
                                whisper.cpp {apolloStatus.whisperInstalled ? '(compiled)' : '(not installed)'}
                              </Content>
                            </Flex>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                              {apolloStatus.modelInstalled ? (
                                <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                              ) : (
                                <ExclamationCircleIcon color="var(--pf-v6-global--warning-color--100)" />
                              )}
                              <Content component="span" style={{ fontSize: '0.875rem' }}>
                                Whisper large-v3-turbo model {apolloStatus.modelInstalled ? '(downloaded)' : '(not downloaded)'}
                              </Content>
                            </Flex>
                          </Flex>
                        </div>

                        {/* ffmpeg installation instructions */}
                        {!apolloStatus.ffmpegInstalled && (
                          <Alert variant="warning" isInline title="ffmpeg required" style={{ marginBottom: '1rem' }}>
                            <Content component="p" style={{ fontSize: '0.875rem' }}>
                              ffmpeg is required to process video files. Install it with Homebrew:
                            </Content>
                            <code style={{ 
                              display: 'block', 
                              marginTop: '0.5rem', 
                              padding: '0.5rem', 
                              backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                              borderRadius: '4px',
                              fontSize: '0.875rem'
                            }}>
                              brew install ffmpeg
                            </code>
                            <Content component="p" style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
                              After installing, click the refresh button or re-open this modal to check again.
                            </Content>
                          </Alert>
                        )}
                        
                        {/* whisper.cpp and model setup */}
                        {apolloStatus.ffmpegInstalled && (!apolloStatus.whisperInstalled || !apolloStatus.modelInstalled) && (
                          <>
                            {apolloSetupProgress !== null ? (
                              <div>
                                <Content component="p" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                  {apolloSetupMessage}
                                </Content>
                                <Progress
                                  value={apolloSetupProgress}
                                  size={ProgressSize.sm}
                                  aria-label="Setup progress"
                                />
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                icon={<DownloadIcon />}
                                onClick={setupApollo}
                                isDisabled={saving}
                              >
                                Download & Setup Apollo Transcription
                              </Button>
                            )}
                            
                            <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.75rem', display: 'block' }}>
                              This will download whisper.cpp, compile it (requires Xcode Command Line Tools), and download the Whisper large-v3-turbo model (~1.5GB).
                            </Content>
                          </>
                        )}
                        
                        {/* Refresh button */}
                        <Button
                          variant="link"
                          onClick={() => loadApolloStatus()}
                          style={{ marginTop: '0.5rem', padding: 0 }}
                          icon={<SyncAltIcon />}
                        >
                          Refresh status
                        </Button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* External API Configuration */}
                  <Alert 
                    variant="info" 
                    isInline 
                    title="Whisper-compatible API"
                    style={{ marginTop: '1rem', marginBottom: '1rem' }}
                  >
                    <Content component="p" style={{ fontSize: '0.875rem' }}>
                      Configure a Whisper-compatible transcription endpoint. This can be:<br />
                      • OpenAI Whisper API<br />
                      • Local Whisper server (e.g., faster-whisper-server)<br />
                      • Any OpenAI-compatible transcription API
                    </Content>
                  </Alert>
                  <FormGroup label="API URL" isRequired fieldId="transcription-url">
                    <TextInput
                      isRequired
                      type="url"
                      id="transcription-url"
                      value={editForm.apiUrl || ''}
                      onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiUrl: value }))}
                      placeholder="http://127.0.0.1:8000"
                    />
                    <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                      The base URL of your Whisper API (e.g., http://localhost:8000 or https://api.openai.com)
                    </Content>
                  </FormGroup>
                  <FormGroup label="Model Name" isRequired fieldId="transcription-model">
                    <TextInput
                      isRequired
                      type="text"
                      id="transcription-model"
                      value={editForm.model || ''}
                      onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                      placeholder="e.g., whisper-1 or large-v3"
                    />
                    <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                      The Whisper model to use (whisper-1 for OpenAI, or model name for local)
                    </Content>
                  </FormGroup>
                </>
              )}
            </>
          )}

          {isConfluence && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Confluence Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Enter your Confluence URL (can be a specific page or space URL), your email, and an API token.
                  The URL you provide will be used as the default Wiki page.
                </Content>
              </Alert>
              <FormGroup label="Confluence URL" isRequired fieldId="confluence-url">
                <TextInput
                  isRequired
                  type="url"
                  id="confluence-url"
                  value={editForm.url || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, url: value }))}
                  placeholder="https://spaces.redhat.com/spaces/USEREXPDES/pages/256837177/..."
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Paste the full URL to your Confluence space or page
                </Content>
              </FormGroup>
              <FormGroup label="Username / Email" isRequired fieldId="confluence-username">
                <TextInput
                  isRequired
                  type="email"
                  id="confluence-username"
                  value={editForm.username || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, username: value }))}
                  placeholder="your.email@company.com"
                />
              </FormGroup>
              <FormGroup 
                label="Personal Access Token" 
                isRequired={!editForm.hasExistingToken}
                fieldId="confluence-token"
              >
                <TextInput
                  type="password"
                  id="confluence-token"
                  value={editForm.token || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, token: value }))}
                  placeholder={editForm.hasExistingToken ? '••••••••  (leave blank to keep existing)' : 'Enter your Personal Access Token'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Generate a token at: <a href="https://spaces.redhat.com/plugins/personalaccesstokens/usertokens.action" target="_blank" rel="noopener noreferrer">Personal Access Tokens</a>
                </Content>
              </FormGroup>
            </>
          )}

          {isSlack && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="How to get your Slack tokens"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  1. Open Slack in your browser and log in<br />
                  2. Open Developer Tools (F12) → Application tab → Cookies<br />
                  3. Find the cookies named <code>d</code> (XOXD token) and look for the <code>xoxc-</code> token in localStorage or network requests
                </Content>
              </Alert>
              <FormGroup 
                label="XOXC Token" 
                isRequired={!editForm.hasExistingXoxcToken}
                fieldId="slack-xoxc-token"
              >
                <TextInput
                  type="password"
                  id="slack-xoxc-token"
                  value={editForm.xoxcToken || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, xoxcToken: value }))}
                  placeholder={editForm.hasExistingXoxcToken ? '••••••••  (leave blank to keep existing)' : 'xoxc-...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The xoxc- token from Slack (used for API authentication)
                </Content>
              </FormGroup>
              <FormGroup 
                label="XOXD Token" 
                isRequired={!editForm.hasExistingXoxdToken}
                fieldId="slack-xoxd-token"
              >
                <TextInput
                  type="password"
                  id="slack-xoxd-token"
                  value={editForm.xoxdToken || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, xoxdToken: value }))}
                  placeholder={editForm.hasExistingXoxdToken ? '••••••••  (leave blank to keep existing)' : 'xoxd-...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The xoxd- token from the "d" cookie in Slack
                </Content>
              </FormGroup>
            </>
          )}

          {isGoogle && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Setup Instructions"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a><br />
                  2. Create a project and enable the Google Drive API<br />
                  3. Go to "APIs &amp; Services" → "Credentials" → Create OAuth client ID (Web application)<br />
                  4. Add <code>http://localhost:3001/api/google/oauth/callback</code> as an authorized redirect URI<br />
                  5. Enter your Client ID and Secret below, save, then click "Connect with Google"
                </Content>
              </Alert>
              <FormGroup 
                label="Client ID" 
                isRequired={!editForm.hasExistingClientId}
                fieldId="google-client-id"
              >
                <TextInput
                  type="password"
                  id="google-client-id"
                  value={editForm.clientId || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientId: value }))}
                  placeholder={editForm.hasExistingClientId ? '••••••••  (leave blank to keep existing)' : 'your-client-id.apps.googleusercontent.com'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client ID from Google Cloud Console
                </Content>
              </FormGroup>
              <FormGroup 
                label="Client Secret" 
                isRequired={!editForm.hasExistingClientSecret}
                fieldId="google-client-secret"
              >
                <TextInput
                  type="password"
                  id="google-client-secret"
                  value={editForm.clientSecret || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientSecret: value }))}
                  placeholder={editForm.hasExistingClientSecret ? '••••••••  (leave blank to keep existing)' : 'Your client secret'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client Secret from Google Cloud Console
                </Content>
              </FormGroup>
              
              {/* Connect with Google button - only show if Client ID and Secret are configured */}
              {(editForm.hasExistingClientId || editForm.clientId) && (editForm.hasExistingClientSecret || editForm.clientSecret) && (
                <FormGroup 
                  label="Authorization" 
                  fieldId="google-auth"
                >
                  {editForm.hasExistingRefreshToken ? (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <Label color="green" icon={<CheckCircleIcon />}>Connected</Label>
                      <Button
                        variant="link"
                        onClick={() => window.open('/api/google/oauth/authorize', '_blank', 'width=600,height=700')}
                      >
                        Reconnect
                      </Button>
                    </Flex>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Save current form first, then open OAuth
                          handleSave().then(() => {
                            window.open('/api/google/oauth/authorize', '_blank', 'width=600,height=700');
                          });
                        }}
                        isDisabled={saving}
                      >
                        Connect with Google
                      </Button>
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem', display: 'block' }}>
                        This will open Google's authorization page. After authorizing, your refresh token will be saved automatically.
                      </Content>
                    </>
                  )}
                </FormGroup>
              )}
            </>
          )}

          {isGitLab && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="GitLab Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to your self-hosted GitLab instance using a Personal Access Token (PAT).<br />
                  Generate a token at: <a href="https://gitlab.cee.redhat.com/-/user_settings/personal_access_tokens" target="_blank" rel="noopener noreferrer">GitLab Personal Access Tokens</a><br />
                  Required scopes: <code>read_api</code>, <code>read_user</code>, <code>read_repository</code>
                </Content>
              </Alert>
              <FormGroup label="GitLab URL" isRequired fieldId="gitlab-url">
                <TextInput
                  isRequired
                  type="url"
                  id="gitlab-url"
                  value={editForm.url || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, url: value }))}
                  placeholder="https://gitlab.cee.redhat.com"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The base URL of your GitLab instance
                </Content>
              </FormGroup>
              <FormGroup 
                label="Personal Access Token" 
                isRequired={!editForm.hasExistingToken}
                fieldId="gitlab-token"
              >
                <TextInput
                  type="password"
                  id="gitlab-token"
                  value={editForm.token || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, token: value }))}
                  placeholder={editForm.hasExistingToken ? '••••••••  (leave blank to keep existing)' : 'glpat-...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Personal Access Token with read_api, read_user, and read_repository scopes
                </Content>
              </FormGroup>
            </>
          )}

          {isGoogleCalendar && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Setup Instructions"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a><br />
                  2. Create a project and enable the Google Calendar API<br />
                  3. Go to "APIs &amp; Services" → "Credentials" → Create OAuth client ID (Web application)<br />
                  4. Add <code>http://localhost:3001/api/google/calendar/oauth/callback</code> as an authorized redirect URI<br />
                  5. Enter your Client ID and Secret below, save, then click "Connect with Google Calendar"
                </Content>
              </Alert>
              <FormGroup 
                label="Client ID" 
                isRequired={!editForm.hasExistingClientId}
                fieldId="google-calendar-client-id"
              >
                <TextInput
                  type="password"
                  id="google-calendar-client-id"
                  value={editForm.clientId || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientId: value }))}
                  placeholder={editForm.hasExistingClientId ? '••••••••  (leave blank to keep existing)' : 'your-client-id.apps.googleusercontent.com'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client ID from Google Cloud Console
                </Content>
              </FormGroup>
              <FormGroup 
                label="Client Secret" 
                isRequired={!editForm.hasExistingClientSecret}
                fieldId="google-calendar-client-secret"
              >
                <TextInput
                  type="password"
                  id="google-calendar-client-secret"
                  value={editForm.clientSecret || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientSecret: value }))}
                  placeholder={editForm.hasExistingClientSecret ? '••••••••  (leave blank to keep existing)' : 'Your client secret'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client Secret from Google Cloud Console
                </Content>
              </FormGroup>
              
              {/* Connect with Google button - only show if Client ID and Secret are configured */}
              {(editForm.hasExistingClientId || editForm.clientId) && (editForm.hasExistingClientSecret || editForm.clientSecret) && (
                <FormGroup 
                  label="Authorization" 
                  fieldId="google-calendar-auth"
                >
                  {editForm.hasExistingRefreshToken ? (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <Label color="green" icon={<CheckCircleIcon />}>Connected</Label>
                      <Button
                        variant="link"
                        onClick={() => window.open('/api/google/calendar/oauth/authorize', '_blank', 'width=600,height=700')}
                      >
                        Reconnect
                      </Button>
                    </Flex>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Save current form first, then open OAuth
                          handleSave().then(() => {
                            window.open('/api/google/calendar/oauth/authorize', '_blank', 'width=600,height=700');
                          });
                        }}
                        isDisabled={saving}
                      >
                        Connect with Google Calendar
                      </Button>
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem', display: 'block' }}>
                        This will open Google's authorization page. After authorizing, your refresh token will be saved automatically.
                      </Content>
                    </>
                  )}
                </FormGroup>
              )}
            </>
          )}

          {isGoogleTasks && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Setup Instructions"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  1. Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">Google Cloud Console</a><br />
                  2. Create a project and enable the Google Tasks API<br />
                  3. Go to "APIs &amp; Services" → "Credentials" → Create OAuth client ID (Web application)<br />
                  4. Add <code>http://localhost:1226/api/google/tasks/oauth/callback</code> as an authorized redirect URI<br />
                  5. Enter your Client ID and Secret below, save, then click "Connect with Google Tasks"
                </Content>
              </Alert>
              <FormGroup 
                label="Client ID" 
                isRequired={!editForm.hasExistingClientId}
                fieldId="google-tasks-client-id"
              >
                <TextInput
                  type="password"
                  id="google-tasks-client-id"
                  value={editForm.clientId || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientId: value }))}
                  placeholder={editForm.hasExistingClientId ? '••••••••  (leave blank to keep existing)' : 'your-client-id.apps.googleusercontent.com'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client ID from Google Cloud Console
                </Content>
              </FormGroup>
              <FormGroup 
                label="Client Secret" 
                isRequired={!editForm.hasExistingClientSecret}
                fieldId="google-tasks-client-secret"
              >
                <TextInput
                  type="password"
                  id="google-tasks-client-secret"
                  value={editForm.clientSecret || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, clientSecret: value }))}
                  placeholder={editForm.hasExistingClientSecret ? '••••••••  (leave blank to keep existing)' : 'Your client secret'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  OAuth 2.0 Client Secret from Google Cloud Console
                </Content>
              </FormGroup>
              
              {/* Connect with Google button - only show if Client ID and Secret are configured */}
              {(editForm.hasExistingClientId || editForm.clientId) && (editForm.hasExistingClientSecret || editForm.clientSecret) && (
                <FormGroup 
                  label="Authorization" 
                  fieldId="google-tasks-auth"
                >
                  {editForm.hasExistingRefreshToken ? (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <Label color="green" icon={<CheckCircleIcon />}>Connected</Label>
                      <Button
                        variant="link"
                        onClick={() => window.open('/api/google/tasks/oauth/authorize', '_blank', 'width=600,height=700')}
                      >
                        Reconnect
                      </Button>
                    </Flex>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Save current form first, then open OAuth
                          handleSave().then(() => {
                            window.open('/api/google/tasks/oauth/authorize', '_blank', 'width=600,height=700');
                          });
                        }}
                        isDisabled={saving}
                      >
                        Connect with Google Tasks
                      </Button>
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem', display: 'block' }}>
                        This will open Google's authorization page. After authorizing, your refresh token will be saved automatically.
                      </Content>
                    </>
                  )}
                </FormGroup>
              )}
            </>
          )}

          {isFigma && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Figma Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to Figma using a Personal Access Token.<br />
                  Generate a token at: <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer">Figma Account Settings → Personal Access Tokens</a>
                </Content>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)', borderRadius: '4px' }}>
                  <Content component="p" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Required Scopes:
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem' }}>
                    • <code>current_user:read</code> — Read your user info<br />
                    • <code>file_comments:read</code> — Read comments on files<br />
                    • <code>file_content:read</code> — Read file content and versions<br />
                    • <code>file_metadata:read</code> — Read file metadata<br />
                    • <code>projects:read</code> — Read projects and teams
                  </Content>
                </div>
              </Alert>
              <FormGroup 
                label="Personal Access Token" 
                isRequired={!editForm.hasExistingToken}
                fieldId="figma-token"
              >
                <TextInput
                  type="password"
                  id="figma-token"
                  value={editForm.token || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, token: value }))}
                  placeholder={editForm.hasExistingToken ? '••••••••  (leave blank to keep existing)' : 'figd_...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Personal Access Token from Figma settings
                </Content>
              </FormGroup>
              <FormGroup 
                label="Team ID(s)" 
                isRequired
                fieldId="figma-team-ids"
              >
                <TextInput
                  type="text"
                  id="figma-team-ids"
                  value={editForm.teamIds || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, teamIds: value }))}
                  placeholder="e.g., 1234567890123456"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Your Figma Team ID. Find it in the URL when viewing your team: <code>figma.com/files/team/<strong>TEAM_ID</strong>/...</code><br />
                  For multiple teams, separate with commas: <code>123456,789012</code>
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'openai' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="OpenAI Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to OpenAI for access to GPT-4, GPT-4o, and other models.<br />
                  Get your API key at: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a>
                </Content>
              </Alert>
              <FormGroup 
                label="API Key" 
                isRequired={!editForm.hasExistingApiKey}
                fieldId="openai-api-key"
              >
                <TextInput
                  type="password"
                  id="openai-api-key"
                  value={editForm.apiKey || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiKey: value }))}
                  placeholder={editForm.hasExistingApiKey ? '••••••••  (leave blank to keep existing)' : 'sk-...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Your OpenAI API key (starts with sk-)
                </Content>
              </FormGroup>
              <FormGroup label="Model" fieldId="openai-model">
                <TextInput
                  type="text"
                  id="openai-model"
                  value={editForm.model || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                  placeholder="gpt-4o"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Default model to use (e.g., gpt-4o, gpt-4-turbo, gpt-3.5-turbo)
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'anthropic' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Anthropic Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to Anthropic for access to Claude models.<br />
                  Get your API key at: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Anthropic Console</a>
                </Content>
              </Alert>
              <FormGroup 
                label="API Key" 
                isRequired={!editForm.hasExistingApiKey}
                fieldId="anthropic-api-key"
              >
                <TextInput
                  type="password"
                  id="anthropic-api-key"
                  value={editForm.apiKey || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiKey: value }))}
                  placeholder={editForm.hasExistingApiKey ? '••••••••  (leave blank to keep existing)' : 'sk-ant-...'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Your Anthropic API key (starts with sk-ant-)
                </Content>
              </FormGroup>
              <FormGroup label="Model" fieldId="anthropic-model">
                <TextInput
                  type="text"
                  id="anthropic-model"
                  value={editForm.model || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                  placeholder="claude-sonnet-4-20250514"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Default model to use (e.g., claude-sonnet-4-20250514, claude-3-5-sonnet-20241022)
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'local' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Local LLM Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to a local LLM server like Ollama or LM Studio.<br />
                  • <strong>Ollama:</strong> Default port 11434 (<code>http://127.0.0.1:11434</code>)<br />
                  • <strong>LM Studio:</strong> Default port 1234 (<code>http://127.0.0.1:1234</code>)
                </Content>
              </Alert>
              <FormGroup label="API URL" isRequired fieldId="local-api-url">
                <TextInput
                  isRequired
                  type="url"
                  id="local-api-url"
                  value={editForm.apiUrl || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiUrl: value }))}
                  placeholder="http://127.0.0.1:11434"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The base URL of your local LLM server
                </Content>
              </FormGroup>
              <FormGroup label="Model" isRequired fieldId="local-model">
                <TextInput
                  isRequired
                  type="text"
                  id="local-model"
                  value={editForm.model || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                  placeholder="e.g., llama3.2, mistral, codellama"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The model name as configured in your local server
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'ambientAi' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Ambient AI Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to Red Hat's internal Ambient Code Platform for Claude-powered AI tasks.<br />
                  Get your access key from the Ambient platform: Project Settings → Access Keys → Create Key
                </Content>
              </Alert>
              <FormGroup label="API Base URL" isRequired fieldId="ambient-api-url">
                <TextInput
                  isRequired
                  type="url"
                  id="ambient-api-url"
                  value={editForm.apiUrl || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiUrl: value }))}
                  placeholder="https://vteam-backend.apps.example.com/api"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The base URL of your Ambient Code Platform API (e.g., <code>https://vteam-backend.apps.your-cluster.com/api</code>)
                </Content>
              </FormGroup>
              <FormGroup label="Project Name" fieldId="ambient-project-name">
                <TextInput
                  type="text"
                  id="ambient-project-name"
                  value={editForm.projectName || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, projectName: value }))}
                  placeholder="my-project"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Your default project name for agentic sessions (optional, can be changed per session)
                </Content>
              </FormGroup>
              <FormGroup 
                label="Access Key" 
                isRequired={!editForm.hasExistingAccessKey}
                fieldId="ambient-access-key"
              >
                <TextInput
                  type="password"
                  id="ambient-access-key"
                  value={editForm.accessKey || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, accessKey: value }))}
                  placeholder={editForm.hasExistingAccessKey ? '••••••••  (leave blank to keep existing)' : 'Enter your Ambient access key'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Your Ambient access key (project-scoped ServiceAccount token). This is only shown once when created.
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'claudeCode' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Claude Code Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to Anthropic's Claude API directly or via Google Vertex AI.<br />
                  <strong>Direct API:</strong> Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a><br />
                  <strong>Vertex AI:</strong> Uses your local <code>gcloud</code> credentials (run <code>gcloud auth application-default login</code>)
                </Content>
              </Alert>
              <FormGroup label="Authentication Type" isRequired fieldId="claude-auth-type">
                <Flex>
                  <FlexItem>
                    <Button
                      variant={editForm.authType === 'apiKey' ? 'primary' : 'secondary'}
                      onClick={() => setEditForm(prev => ({ ...prev, authType: 'apiKey' }))}
                      size="sm"
                    >
                      Direct API Key
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={editForm.authType === 'vertex' ? 'primary' : 'secondary'}
                      onClick={() => setEditForm(prev => ({ ...prev, authType: 'vertex' }))}
                      size="sm"
                    >
                      Google Vertex AI
                    </Button>
                  </FlexItem>
                </Flex>
              </FormGroup>
              
              {editForm.authType === 'apiKey' && (
                <FormGroup 
                  label="Anthropic API Key" 
                  isRequired={!editForm.hasExistingApiKey}
                  fieldId="claude-api-key"
                >
                  <TextInput
                    type="password"
                    id="claude-api-key"
                    value={editForm.apiKey || ''}
                    onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiKey: value }))}
                    placeholder={editForm.hasExistingApiKey ? '••••••••  (leave blank to keep existing)' : 'sk-ant-...'}
                  />
                  <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                    Your Anthropic API key from console.anthropic.com
                  </Content>
                </FormGroup>
              )}
              
              {editForm.authType === 'vertex' && (
                <>
                  <FormGroup label="Vertex AI Project ID" isRequired fieldId="claude-vertex-project">
                    <TextInput
                      isRequired
                      type="text"
                      id="claude-vertex-project"
                      value={editForm.vertexProjectId || ''}
                      onChange={(_event, value) => setEditForm(prev => ({ ...prev, vertexProjectId: value }))}
                      placeholder="my-gcp-project-id"
                    />
                    <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                      Your Google Cloud project ID with Vertex AI enabled
                    </Content>
                  </FormGroup>
                  <FormGroup label="Vertex AI Region" isRequired fieldId="claude-vertex-region">
                    <TextInput
                      isRequired
                      type="text"
                      id="claude-vertex-region"
                      value={editForm.vertexRegion || 'us-east5'}
                      onChange={(_event, value) => setEditForm(prev => ({ ...prev, vertexRegion: value }))}
                      placeholder="us-east5"
                    />
                    <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                      The Vertex AI region (e.g., us-east5, europe-west1). Must support Claude models.
                    </Content>
                  </FormGroup>
                </>
              )}
              
              <FormGroup label="Model" fieldId="claude-model">
                <TextInput
                  type="text"
                  id="claude-model"
                  value={editForm.model || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, model: value }))}
                  placeholder={editForm.authType === 'vertex' ? 'claude-sonnet-4@20250514' : 'claude-sonnet-4-20250514'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The Claude model to use (optional, defaults to Claude Sonnet 4)
                </Content>
              </FormGroup>
            </>
          )}

          {editingService?.configKey === 'cursorCli' && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Cursor CLI Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Cursor CLI lets you interact with AI agents directly from your terminal.<br />
                  <strong>Install:</strong> <code>curl https://cursor.com/install -fsS | bash</code><br />
                  <a href="https://cursor.com/docs/cli/overview" target="_blank" rel="noopener noreferrer">View documentation</a>
                </Content>
              </Alert>
              <FormGroup label="Authentication" fieldId="cursor-auth">
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          setTestResult({ type: 'info', text: 'Starting login flow...' });
                          const response = await fetch('/api/cursorcli/login', { method: 'POST' });
                          const data = await response.json();
                          if (data.success) {
                            setTestResult({ type: 'success', text: data.message });
                          } else {
                            setTestResult({ type: 'danger', text: data.error });
                          }
                        } catch (error) {
                          setTestResult({ type: 'danger', text: `Login failed: ${error.message}` });
                        }
                      }}
                      size="sm"
                    >
                      Login to Cursor
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/cursorcli/auth-status');
                          const data = await response.json();
                          if (data.authenticated) {
                            setTestResult({ type: 'success', text: 'Authenticated with Cursor CLI' });
                          } else if (data.installed) {
                            setTestResult({ type: 'warning', text: 'Not logged in. Click "Login to Cursor" to authenticate.' });
                          } else {
                            setTestResult({ type: 'danger', text: 'Cursor CLI is not installed' });
                          }
                        } catch (error) {
                          setTestResult({ type: 'danger', text: `Status check failed: ${error.message}` });
                        }
                      }}
                      size="sm"
                    >
                      Check Status
                    </Button>
                  </FlexItem>
                </Flex>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Click "Login to Cursor" to open browser authentication. After logging in, click "Check Status" to verify.
                </Content>
              </FormGroup>
              <FormGroup label="Enable Cursor CLI" fieldId="cursor-enabled">
                <Flex>
                  <FlexItem>
                    <Button
                      variant={editForm.enabled ? 'primary' : 'secondary'}
                      onClick={() => setEditForm(prev => ({ ...prev, enabled: true }))}
                      size="sm"
                    >
                      Enabled
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant={!editForm.enabled ? 'primary' : 'secondary'}
                      onClick={() => setEditForm(prev => ({ ...prev, enabled: false }))}
                      size="sm"
                    >
                      Disabled
                    </Button>
                  </FlexItem>
                </Flex>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Enable to use Cursor CLI models in the Chat page
                </Content>
              </FormGroup>
              <FormGroup label="Default Model" fieldId="cursor-default-model">
                <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
                  <FlexItem grow={{ default: 'grow' }}>
                    <TextInput
                      type="text"
                      id="cursor-default-model"
                      value={editForm.defaultModel || 'claude-4.5-sonnet'}
                      onChange={(_event, value) => setEditForm(prev => ({ ...prev, defaultModel: value }))}
                      placeholder="claude-4.5-sonnet"
                    />
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        try {
                          setTestResult({ type: 'info', text: 'Fetching available models...' });
                          const response = await fetch('/api/cursorcli/list-models');
                          const data = await response.json();
                          if (data.success && data.rawOutput) {
                            setTestResult({ 
                              type: 'info', 
                              text: `Available models:\n${data.rawOutput}`
                            });
                          } else {
                            setTestResult({ type: 'danger', text: data.error || 'Failed to list models' });
                          }
                        } catch (error) {
                          setTestResult({ type: 'danger', text: `Failed to list models: ${error.message}` });
                        }
                      }}
                    >
                      List Models
                    </Button>
                  </FlexItem>
                </Flex>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Click "List Models" to see available model IDs, then enter the exact model ID above
                </Content>
              </FormGroup>
            </>
          )}

          {isKagi && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Kagi Search API"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Kagi is a premium, ad-free search engine. Connect your API key to use Kagi web search directly from Apollo's search bar.<br />
                  <strong>Pricing:</strong> $25 per 1,000 queries (2.5 cents per search)<br />
                  <a href="https://kagi.com/settings/api" target="_blank" rel="noopener noreferrer">Get your API key</a>
                </Content>
              </Alert>
              <FormGroup 
                label="API Key" 
                isRequired={!editForm.hasExistingApiKey}
                fieldId="kagi-api-key"
              >
                <TextInput
                  type="password"
                  id="kagi-api-key"
                  value={editForm.apiKey || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, apiKey: value }))}
                  placeholder={editForm.hasExistingApiKey ? '••••••••  (leave blank to keep existing)' : 'Enter your Kagi API key'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Generate a key at: Kagi Settings → Advanced → API portal
                </Content>
              </FormGroup>
            </>
          )}

          {isHomeAssistant && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Home Assistant Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to your local Home Assistant instance using a Long-Lived Access Token.<br />
                  This integration is read-only and will allow you to view entity states and sensor data.
                </Content>
              </Alert>
              <FormGroup label="Home Assistant URL" isRequired fieldId="homeassistant-url">
                <TextInput
                  isRequired
                  type="url"
                  id="homeassistant-url"
                  value={editForm.url || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, url: value }))}
                  placeholder="http://homeassistant.local:8123"
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The URL of your Home Assistant instance (e.g., http://homeassistant.local:8123 or http://192.168.1.100:8123)
                </Content>
              </FormGroup>
              <FormGroup 
                label="Long-Lived Access Token" 
                isRequired={!editForm.hasExistingToken}
                fieldId="homeassistant-token"
              >
                <TextInput
                  type="password"
                  id="homeassistant-token"
                  value={editForm.token || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, token: value }))}
                  placeholder={editForm.hasExistingToken ? '••••••••  (leave blank to keep existing)' : 'Enter your Long-Lived Access Token'}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  Generate a token at: Home Assistant → Profile → Long-Lived Access Tokens → Create Token
                </Content>
              </FormGroup>
            </>
          )}

          {isAppleMusic && (
            <>
              <Alert 
                variant="info" 
                isInline 
                title="Apple Music Setup"
                style={{ marginBottom: '1rem' }}
              >
                <Content component="p" style={{ fontSize: '0.875rem' }}>
                  Connect to Apple Music using tokens from your browser.<br />
                  <strong>A paid Apple Music subscription is required.</strong>
                </Content>
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)', borderRadius: '4px' }}>
                  <Content component="p" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    How to get your tokens:
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem' }}>
                    1. Open <a href="https://music.apple.com/" target="_blank" rel="noopener noreferrer">music.apple.com</a> in Chrome and sign in<br />
                    2. Open Developer Tools (F12 or Cmd+Option+I)
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    For Developer Token:
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem' }}>
                    3. Go to the <strong>Network</strong> tab and refresh the page<br />
                    4. Click on any request to <code>amp-api.music.apple.com</code><br />
                    5. In Request Headers, find <code>Authorization</code> and copy the value after "Bearer "
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                    For Media User Token:
                  </Content>
                  <Content component="p" style={{ fontSize: '0.8rem' }}>
                    6. Go to the <strong>Application</strong> tab<br />
                    7. Under Storage → Cookies, click "https://music.apple.com"<br />
                    8. Find and copy the value of <code>media-user-token</code>
                  </Content>
                </div>
                <Alert 
                  variant="warning" 
                  isInline 
                  isPlain
                  title="Tokens expire periodically"
                  style={{ marginTop: '0.5rem' }}
                >
                  <Content component="small">
                    Both tokens will expire after some time. You'll need to repeat this process when that happens.
                  </Content>
                </Alert>
              </Alert>
              <FormGroup 
                label="Developer Token (Authorization Bearer)" 
                isRequired={!editForm.hasExistingDeveloperToken}
                fieldId="applemusic-developer-token"
              >
                <TextArea
                  id="applemusic-developer-token"
                  value={editForm.developerToken || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, developerToken: value }))}
                  placeholder={editForm.hasExistingDeveloperToken ? '••••••••  (leave blank to keep existing)' : 'Paste the Authorization Bearer token (starts with eyJ...)'}
                  rows={3}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The value from the <code>Authorization</code> header (without "Bearer " prefix)
                </Content>
              </FormGroup>
              <FormGroup 
                label="Media User Token" 
                isRequired={!editForm.hasExistingMediaUserToken}
                fieldId="applemusic-token"
              >
                <TextArea
                  id="applemusic-token"
                  value={editForm.mediaUserToken || ''}
                  onChange={(_event, value) => setEditForm(prev => ({ ...prev, mediaUserToken: value }))}
                  placeholder={editForm.hasExistingMediaUserToken ? '••••••••  (leave blank to keep existing)' : 'Paste your Media-User-Token header value'}
                  rows={3}
                />
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
                  The value from the <code>Media-User-Token</code> header
                </Content>
              </FormGroup>
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
          <FlexItem>
            {(isJira || isSlack || isGoogle || isGoogleCalendar || isConfluence || isGitLab || isFigma || isHomeAssistant || isAmbientAi || isAppleMusic) && (
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                isLoading={testing}
                isDisabled={testing || saving}
                icon={<SyncAltIcon />}
              >
                Test Connection
              </Button>
            )}
          </FlexItem>
          <Flex gap={{ default: 'gapSm' }}>
            <Button variant="link" onClick={closeEditModal} isDisabled={saving}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSave}
              isLoading={saving}
              isDisabled={saving}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </ModalFooter>
    </Modal>
  );
};

export default IntegrationModal;
