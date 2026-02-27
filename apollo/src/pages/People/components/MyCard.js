import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  FormSection,
  TextInput,
  TextArea,
  Flex,
  FlexItem,
  Switch,
  Spinner,
  Alert,
  HelperText,
  HelperTextItem,
  Label,
  Divider,
  Card,
  CardBody
} from '@patternfly/react-core';
import {
  LockIcon,
  LockOpenIcon,
  UploadIcon,
  TimesIcon
} from '@patternfly/react-icons';

const SHARING_FIELDS = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'bio', label: 'Biography' },
  { key: 'skills', label: 'Skills' },
  { key: 'interests', label: 'Interests' },
  { key: 'projects', label: 'Projects' },
  { key: 'integrations', label: 'Integration IDs' }
];

const MyCard = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Contact data
  const [formData, setFormData] = useState({
    name: { first: '', last: '', middle: '' },
    nickname: '',
    role: '',
    company: '',
    email: '',
    phone: '',
    location: '',
    timezone: '',
    bio: '',
    avatar: '',
    skills: '',
    interests: '',
    integrations: {
      slack: '',
      gitlab: '',
      jira: '',
      github: ''
    }
  });

  // Sharing settings
  const [sharing, setSharing] = useState({
    fields: {
      email: 'public',
      phone: 'private',
      location: 'public',
      timezone: 'public',
      bio: 'public',
      skills: 'public',
      interests: 'public',
      projects: 'public',
      integrations: 'private'
    }
  });

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  const uploadAvatar = async () => {
    if (!pendingAvatarFile) return { ok: true, avatarUrl: null };
    setAvatarUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('avatar', pendingAvatarFile);
      const res = await fetch('/api/people/me/avatar', {
        method: 'POST',
        body: uploadData
      });
      const result = await res.json();
      if (result.success) {
        handleChange('avatar', result.avatarUrl);
        setPendingAvatarFile(null);
        return { ok: true, avatarUrl: result.avatarUrl };
      } else {
        setError(result.error || 'Failed to upload avatar');
        return { ok: false, avatarUrl: null };
      }
    } catch {
      setError('Failed to upload avatar');
      return { ok: false, avatarUrl: null };
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await fetch('/api/people/me/avatar', { method: 'DELETE' });
      handleChange('avatar', '');
      setAvatarPreview(null);
      setPendingAvatarFile(null);
    } catch {
      setError('Failed to remove avatar');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleAvatarFile(file);
  }, [handleAvatarFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  // Load my card data
  useEffect(() => {
    if (!isOpen) return;

    const loadMyCard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/people/me');
        const data = await response.json();
        if (data.success) {
          const c = data.person || {};
          setFormData({
            name: c.name || { first: '', last: '', middle: '' },
            nickname: c.nickname || '',
            role: c.role || '',
            company: c.company || '',
            email: c.email || '',
            phone: c.phone || '',
            location: c.location || '',
            timezone: c.timezone || '',
            bio: c.bio || '',
            avatar: c.avatar || '',
            skills: (c.skills || []).join(', '),
            interests: (c.interests || []).join(', '),
            integrations: {
              slack: c.integrations?.slack || '',
              gitlab: c.integrations?.gitlab || '',
              jira: c.integrations?.jira || '',
              github: c.integrations?.github || ''
            }
          });
          if (data.sharing) {
            setSharing(data.sharing);
          }
        }
      } catch (err) {
        setError('Failed to load your card');
      } finally {
        setLoading(false);
      }
    };

    loadMyCard();
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      name: { ...prev.name, [field]: value }
    }));
  };

  const handleIntegrationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      integrations: { ...prev.integrations, [field]: value }
    }));
  };

  const toggleSharingField = (fieldKey) => {
    setSharing(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: prev.fields[fieldKey] === 'public' ? 'private' : 'public'
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Upload avatar file first if pending, capture the new URL directly
      let avatarUrl = formData.avatar;
      if (pendingAvatarFile) {
        const result = await uploadAvatar();
        if (!result.ok) {
          setSaving(false);
          return;
        }
        if (result.avatarUrl) {
          avatarUrl = result.avatarUrl;
        }
      }

      const personData = {
        name: formData.name,
        nickname: formData.nickname,
        role: formData.role,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        timezone: formData.timezone,
        bio: formData.bio,
        avatar: avatarUrl,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
        integrations: formData.integrations
      };

      const [personRes, sharingRes] = await Promise.all([
        fetch('/api/people/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personData)
        }),
        fetch('/api/people/me/sharing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sharing)
        })
      ]);

      const personResult = await personRes.json();
      const sharingResult = await sharingRes.json();

      if (personResult.success && sharingResult.success) {
        setSuccessMessage('Your card has been saved.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to save some settings. Please try again.');
      }
    } catch (err) {
      setError('Failed to save your card');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="my-card-modal-title"
      variant="large"
    >
      <ModalHeader title="My Card" description="This is your personal card. Control what information is shared with others." />
      <ModalBody>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" title={error} style={{ marginBottom: '1rem' }} />
            )}
            {successMessage && (
              <Alert variant="success" title={successMessage} style={{ marginBottom: '1rem' }} />
            )}

            <Form>
              <FormSection title="Your Information">
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="First Name" fieldId="my-first-name">
                      <TextInput id="my-first-name" value={formData.name.first} onChange={(_event, value) => handleNameChange('first', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Middle Name" fieldId="my-middle-name">
                      <TextInput id="my-middle-name" value={formData.name.middle} onChange={(_event, value) => handleNameChange('middle', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Last Name" fieldId="my-last-name">
                      <TextInput id="my-last-name" value={formData.name.last} onChange={(_event, value) => handleNameChange('last', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>

                <FormGroup label="Nickname" fieldId="my-nickname">
                  <TextInput id="my-nickname" value={formData.nickname} onChange={(_event, value) => handleChange('nickname', value)} />
                </FormGroup>

                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Role / Title" fieldId="my-role">
                      <TextInput id="my-role" value={formData.role} onChange={(_event, value) => handleChange('role', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Company" fieldId="my-company">
                      <TextInput id="my-company" value={formData.company} onChange={(_event, value) => handleChange('company', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>

                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Email" fieldId="my-email">
                      <TextInput type="email" id="my-email" value={formData.email} onChange={(_event, value) => handleChange('email', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Phone" fieldId="my-phone">
                      <TextInput type="tel" id="my-phone" value={formData.phone} onChange={(_event, value) => handleChange('phone', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>

                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Location" fieldId="my-location">
                      <TextInput id="my-location" value={formData.location} onChange={(_event, value) => handleChange('location', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Timezone" fieldId="my-timezone">
                      <TextInput id="my-timezone" value={formData.timezone} onChange={(_event, value) => handleChange('timezone', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>

                <FormGroup label="Biography" fieldId="my-bio">
                  <TextArea id="my-bio" value={formData.bio} onChange={(_event, value) => handleChange('bio', value)} placeholder="Tell others about yourself..." rows={3} />
                </FormGroup>

                <FormGroup label="Profile Photo" fieldId="my-avatar">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDraggingOver ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--BorderColor--100)'}`,
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isDraggingOver ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                        e.target.value = '';
                      }}
                    />
                    {(avatarPreview || formData.avatar) ? (
                      <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        <FlexItem>
                          <img
                            src={avatarPreview || formData.avatar}
                            alt="Profile"
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        </FlexItem>
                        <FlexItem>
                          <span style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                            {pendingAvatarFile ? 'New photo selected - save to apply' : 'Click or drag to replace'}
                          </span>
                        </FlexItem>
                        <FlexItem>
                          <Button
                            variant="link"
                            isDanger
                            isSmall
                            icon={<TimesIcon />}
                            onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                          >
                            Remove photo
                          </Button>
                        </FlexItem>
                      </Flex>
                    ) : (
                      <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        <FlexItem>
                          <UploadIcon style={{ fontSize: '2rem', color: 'var(--pf-v6-global--Color--200)' }} />
                        </FlexItem>
                        <FlexItem>
                          <span style={{ fontWeight: 500 }}>Click to upload or drag and drop</span>
                        </FlexItem>
                        <FlexItem>
                          <span style={{ fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
                            JPEG, PNG, GIF, or WebP (max 5MB)
                          </span>
                        </FlexItem>
                      </Flex>
                    )}
                    {avatarUploading && <Spinner size="md" style={{ marginTop: '0.5rem' }} />}
                  </div>
                </FormGroup>

                <FormGroup label="Skills" fieldId="my-skills">
                  <TextInput id="my-skills" value={formData.skills} onChange={(_event, value) => handleChange('skills', value)} placeholder="JavaScript, React, Node.js" />
                  <HelperText><HelperTextItem>Comma-separated</HelperTextItem></HelperText>
                </FormGroup>

                <FormGroup label="Interests" fieldId="my-interests">
                  <TextInput id="my-interests" value={formData.interests} onChange={(_event, value) => handleChange('interests', value)} placeholder="hiking, photography, music" />
                  <HelperText><HelperTextItem>Comma-separated</HelperTextItem></HelperText>
                </FormGroup>
              </FormSection>

              <FormSection title="Integration IDs">
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Slack ID" fieldId="my-slack">
                      <TextInput id="my-slack" value={formData.integrations.slack} onChange={(_event, value) => handleIntegrationChange('slack', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="GitLab Username" fieldId="my-gitlab">
                      <TextInput id="my-gitlab" value={formData.integrations.gitlab} onChange={(_event, value) => handleIntegrationChange('gitlab', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>
                <Flex gap={{ default: 'gapMd' }}>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="Jira Email" fieldId="my-jira">
                      <TextInput id="my-jira" value={formData.integrations.jira} onChange={(_event, value) => handleIntegrationChange('jira', value)} />
                    </FormGroup>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <FormGroup label="GitHub Username" fieldId="my-github">
                      <TextInput id="my-github" value={formData.integrations.github} onChange={(_event, value) => handleIntegrationChange('github', value)} />
                    </FormGroup>
                  </FlexItem>
                </Flex>
              </FormSection>

              <Divider style={{ marginTop: '1rem', marginBottom: '1rem' }} />

              <FormSection title="Sharing Controls" titleElement="h3">
                <p style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }}>
                  Choose which fields are visible when others view your card. Private fields are only visible to you.
                </p>
                <Card isCompact>
                  <CardBody>
                    {SHARING_FIELDS.map(field => (
                      <Flex
                        key={field.key}
                        justifyContent={{ default: 'justifyContentSpaceBetween' }}
                        alignItems={{ default: 'alignItemsCenter' }}
                        style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' }}
                      >
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              {sharing.fields[field.key] === 'public' ? (
                                <LockOpenIcon style={{ color: 'var(--pf-v6-global--success-color--100)' }} />
                              ) : (
                                <LockIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                              )}
                            </FlexItem>
                            <FlexItem>{field.label}</FlexItem>
                          </Flex>
                        </FlexItem>
                        <FlexItem>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <FlexItem>
                              <Label
                                color={sharing.fields[field.key] === 'public' ? 'green' : 'grey'}
                                isCompact
                              >
                                {sharing.fields[field.key] === 'public' ? 'Public' : 'Private'}
                              </Label>
                            </FlexItem>
                            <FlexItem>
                              <Switch
                                id={`sharing-${field.key}`}
                                isChecked={sharing.fields[field.key] === 'public'}
                                onChange={() => toggleSharingField(field.key)}
                                aria-label={`Toggle ${field.label} visibility`}
                              />
                            </FlexItem>
                          </Flex>
                        </FlexItem>
                      </Flex>
                    ))}
                  </CardBody>
                </Card>
              </FormSection>
            </Form>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={handleSave} isLoading={saving} isDisabled={loading}>
          Save Card
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MyCard;
