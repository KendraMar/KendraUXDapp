import React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Title
} from '@patternfly/react-core';

const PersonalInfoTab = ({ fullName, setFullName, email, setEmail, bio, setBio }) => {
  return (
    <Form>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
        Personal Information
      </Title>
      <FormGroup label="Full name" isRequired fieldId="full-name">
        <TextInput
          isRequired
          type="text"
          id="full-name"
          value={fullName}
          onChange={(_event, value) => setFullName(value)}
        />
      </FormGroup>
      <FormGroup label="Email address" isRequired fieldId="email">
        <TextInput
          isRequired
          type="email"
          id="email"
          value={email}
          onChange={(_event, value) => setEmail(value)}
        />
      </FormGroup>
      <FormGroup label="Bio" fieldId="bio">
        <TextInput
          type="text"
          id="bio"
          value={bio}
          onChange={(_event, value) => setBio(value)}
          placeholder="Tell us about yourself..."
        />
      </FormGroup>
    </Form>
  );
};

export default PersonalInfoTab;
