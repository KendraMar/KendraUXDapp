import React from 'react';
import {
  FormGroup,
  Checkbox
} from '@patternfly/react-core';

const ContentTypes = ({ contentTypes, onChange }) => {
  return (
    <FormGroup 
      label="Content Types" 
      fieldId="content-types"
      style={{ marginBottom: '1.5rem' }}
    >
      <Checkbox
        id="content-news"
        label="News Articles"
        isChecked={contentTypes.news}
        onChange={(_event, checked) => onChange('news', checked)}
      />
      <Checkbox
        id="content-analysis"
        label="Analysis & Deep Dives"
        isChecked={contentTypes.analysis}
        onChange={(_event, checked) => onChange('analysis', checked)}
      />
      <Checkbox
        id="content-opinions"
        label="Opinion Pieces"
        isChecked={contentTypes.opinions}
        onChange={(_event, checked) => onChange('opinions', checked)}
      />
      <Checkbox
        id="content-multimedia"
        label="Multimedia Content"
        isChecked={contentTypes.multimedia}
        onChange={(_event, checked) => onChange('multimedia', checked)}
      />
      <Checkbox
        id="content-research"
        label="Research Papers"
        isChecked={contentTypes.research}
        onChange={(_event, checked) => onChange('research', checked)}
      />
    </FormGroup>
  );
};

export default ContentTypes;
