import React, { useState } from 'react';
import {
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  TextInput,
  Button
} from '@patternfly/react-core';
import { TimesIcon, PlusCircleIcon } from '@patternfly/react-icons';

const DocumentTags = ({ tags = [], onTagsChange }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTag('');
    }
  };

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
      <FlexItem>
        <LabelGroup>
          {tags.map((tag) => (
            <Label
              key={tag}
              onClose={() => removeTag(tag)}
              closeBtnAriaLabel={`Remove ${tag}`}
            >
              {tag}
            </Label>
          ))}
        </LabelGroup>
      </FlexItem>
      <FlexItem>
        {isAdding ? (
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <TextInput
                value={newTag}
                onChange={(e, val) => setNewTag(val)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                aria-label="New tag"
                autoFocus
                style={{ width: '120px' }}
              />
            </FlexItem>
            <FlexItem>
              <Button variant="plain" size="sm" onClick={addTag}>
                <PlusCircleIcon />
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="plain" size="sm" onClick={() => { setIsAdding(false); setNewTag(''); }}>
                <TimesIcon />
              </Button>
            </FlexItem>
          </Flex>
        ) : (
          <Button variant="link" size="sm" onClick={() => setIsAdding(true)} icon={<PlusCircleIcon />}>
            Add tag
          </Button>
        )}
      </FlexItem>
    </Flex>
  );
};

export default DocumentTags;
