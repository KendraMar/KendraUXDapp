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
  Checkbox,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem,
  Spinner
} from '@patternfly/react-core';
import {
  UploadIcon,
  TimesIcon
} from '@patternfly/react-icons';

const defaultFormData = {
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
  projects: '',
  integrations: {
    slack: '',
    gitlab: '',
    jira: '',
    github: ''
  },
  tags: '',
  favorite: false
};

const PersonModal = ({
  isOpen,
  onClose,
  onSave,
  isEditMode,
  person
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB.');
      return;
    }
    setAvatarError(null);
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

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

  const removeAvatar = useCallback(async () => {
    if (isEditMode && person?.username && formData.avatar) {
      try {
        await fetch(`/api/people/${person.username}/avatar`, { method: 'DELETE' });
      } catch {
        // Ignore errors on delete
      }
    }
    setAvatarPreview(null);
    setPendingAvatarFile(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
  }, [isEditMode, person, formData.avatar]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAvatarPreview(null);
      setPendingAvatarFile(null);
      setAvatarError(null);
      if (isEditMode && person) {
        setFormData({
          name: person.name || { first: '', last: '', middle: '' },
          nickname: person.nickname || '',
          role: person.role || '',
          company: person.company || '',
          email: person.email || '',
          phone: person.phone || '',
          location: person.location || '',
          timezone: person.timezone || '',
          bio: person.bio || '',
          avatar: person.avatar || '',
          skills: (person.skills || []).join(', '),
          interests: (person.interests || []).join(', '),
          projects: (person.projects || []).map(p => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', '),
          integrations: {
            slack: person.integrations?.slack || '',
            gitlab: person.integrations?.gitlab || '',
            jira: person.integrations?.jira || '',
            github: person.integrations?.github || ''
          },
          tags: (person.tags || []).join(', '),
          favorite: person.favorite || false
        });
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, isEditMode, person]);

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

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        nickname: formData.nickname,
        role: formData.role,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        timezone: formData.timezone,
        bio: formData.bio,
        avatar: formData.avatar,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
        projects: formData.projects.split(',').map(p => {
          const match = p.trim().match(/^(.+?)(?:\s*\((.+)\))?$/);
          if (!match) return null;
          return { name: match[1].trim(), role: match[2]?.trim() || '' };
        }).filter(Boolean),
        integrations: formData.integrations,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        favorite: formData.favorite,
        _avatarFile: pendingAvatarFile || undefined
      };

      const success = await onSave(data);
      if (success !== false) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="person-modal-title"
      variant="large"
    >
      <ModalHeader title={isEditMode ? 'Edit Person' : 'Add Person'} />
      <ModalBody>
        <Form>
          <FormSection title="Basic Information">
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="First Name" isRequired fieldId="person-first-name">
                  <TextInput
                    isRequired
                    id="person-first-name"
                    value={formData.name.first}
                    onChange={(_event, value) => handleNameChange('first', value)}
                    placeholder="First name"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Middle Name" fieldId="person-middle-name">
                  <TextInput
                    id="person-middle-name"
                    value={formData.name.middle}
                    onChange={(_event, value) => handleNameChange('middle', value)}
                    placeholder="Middle name"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Last Name" fieldId="person-last-name">
                  <TextInput
                    id="person-last-name"
                    value={formData.name.last}
                    onChange={(_event, value) => handleNameChange('last', value)}
                    placeholder="Last name"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>

            <FormGroup label="Nickname" fieldId="person-nickname">
              <TextInput
                id="person-nickname"
                value={formData.nickname}
                onChange={(_event, value) => handleChange('nickname', value)}
                placeholder="Preferred name or alias"
              />
            </FormGroup>

            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Role / Title" fieldId="person-role">
                  <TextInput
                    id="person-role"
                    value={formData.role}
                    onChange={(_event, value) => handleChange('role', value)}
                    placeholder="e.g., Senior Engineer, Product Manager"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Company" fieldId="person-company">
                  <TextInput
                    id="person-company"
                    value={formData.company}
                    onChange={(_event, value) => handleChange('company', value)}
                    placeholder="Company or organization"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>
          </FormSection>

          <FormSection title="Contact Information">
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Email" fieldId="person-email">
                  <TextInput
                    type="email"
                    id="person-email"
                    value={formData.email}
                    onChange={(_event, value) => handleChange('email', value)}
                    placeholder="name@example.com"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Phone" fieldId="person-phone">
                  <TextInput
                    type="tel"
                    id="person-phone"
                    value={formData.phone}
                    onChange={(_event, value) => handleChange('phone', value)}
                    placeholder="+1-555-0123"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>

            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Location" fieldId="person-location">
                  <TextInput
                    id="person-location"
                    value={formData.location}
                    onChange={(_event, value) => handleChange('location', value)}
                    placeholder="City, State/Country"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Timezone" fieldId="person-timezone">
                  <TextInput
                    id="person-timezone"
                    value={formData.timezone}
                    onChange={(_event, value) => handleChange('timezone', value)}
                    placeholder="e.g., America/New_York, UTC+5:30"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>
          </FormSection>

          <FormSection title="Profile">
            <FormGroup label="Biography" fieldId="person-bio">
              <TextArea
                id="person-bio"
                value={formData.bio}
                onChange={(_event, value) => handleChange('bio', value)}
                placeholder="A short description or bio..."
                rows={3}
              />
            </FormGroup>

            <FormGroup label="Profile Photo" fieldId="person-avatar">
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
              </div>
              {avatarError && (
                <HelperText><HelperTextItem variant="error">{avatarError}</HelperTextItem></HelperText>
              )}
            </FormGroup>

            <FormGroup label="Skills" fieldId="person-skills">
              <TextInput
                id="person-skills"
                value={formData.skills}
                onChange={(_event, value) => handleChange('skills', value)}
                placeholder="JavaScript, React, Node.js"
              />
              <HelperText>
                <HelperTextItem>Comma-separated list of skills</HelperTextItem>
              </HelperText>
            </FormGroup>

            <FormGroup label="Interests" fieldId="person-interests">
              <TextInput
                id="person-interests"
                value={formData.interests}
                onChange={(_event, value) => handleChange('interests', value)}
                placeholder="hiking, photography, music"
              />
              <HelperText>
                <HelperTextItem>Comma-separated list of interests</HelperTextItem>
              </HelperText>
            </FormGroup>

            <FormGroup label="Projects" fieldId="person-projects">
              <TextInput
                id="person-projects"
                value={formData.projects}
                onChange={(_event, value) => handleChange('projects', value)}
                placeholder="Apollo (Lead Developer), Project X (Contributor)"
              />
              <HelperText>
                <HelperTextItem>Comma-separated: Project Name (Role)</HelperTextItem>
              </HelperText>
            </FormGroup>
          </FormSection>

          <FormSection title="Integrations">
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Slack ID" fieldId="person-slack">
                  <TextInput
                    id="person-slack"
                    value={formData.integrations.slack}
                    onChange={(_event, value) => handleIntegrationChange('slack', value)}
                    placeholder="U12345ABC"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="GitLab Username" fieldId="person-gitlab">
                  <TextInput
                    id="person-gitlab"
                    value={formData.integrations.gitlab}
                    onChange={(_event, value) => handleIntegrationChange('gitlab', value)}
                    placeholder="username"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>
            <Flex gap={{ default: 'gapMd' }}>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="Jira Email" fieldId="person-jira">
                  <TextInput
                    id="person-jira"
                    value={formData.integrations.jira}
                    onChange={(_event, value) => handleIntegrationChange('jira', value)}
                    placeholder="user@company.com"
                  />
                </FormGroup>
              </FlexItem>
              <FlexItem style={{ flex: 1 }}>
                <FormGroup label="GitHub Username" fieldId="person-github">
                  <TextInput
                    id="person-github"
                    value={formData.integrations.github}
                    onChange={(_event, value) => handleIntegrationChange('github', value)}
                    placeholder="username"
                  />
                </FormGroup>
              </FlexItem>
            </Flex>
          </FormSection>

          <FormSection title="Organization">
            <FormGroup label="Tags" fieldId="person-tags">
              <TextInput
                id="person-tags"
                value={formData.tags}
                onChange={(_event, value) => handleChange('tags', value)}
                placeholder="engineering, mentor, teammate"
              />
              <HelperText>
                <HelperTextItem>Comma-separated tags for organization</HelperTextItem>
              </HelperText>
            </FormGroup>

            <FormGroup fieldId="person-favorite">
              <Checkbox
                id="person-favorite"
                label="Mark as favorite"
                isChecked={formData.favorite}
                onChange={(_event, checked) => handleChange('favorite', checked)}
              />
            </FormGroup>
          </FormSection>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="save"
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSaving}
          isDisabled={!formData.name.first}
        >
          {isEditMode ? 'Save Changes' : 'Add Person'}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default PersonModal;
