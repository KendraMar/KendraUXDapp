import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  FormSelect,
  FormSelectOption,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Button,
  Alert,
  Flex,
  FlexItem
} from '@patternfly/react-core';

const CreateTaskModal = ({
  isOpen,
  onClose,
  task,
  onChange,
  onSave,
  isSaving,
  error
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
    >
      <ModalHeader title="Create new task" />
      <ModalBody>
        <Form>
          {error && (
            <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}
          
          <FormGroup label="Title" isRequired fieldId="task-title">
            <TextInput
              isRequired
              id="task-title"
              value={task.title}
              onChange={(_event, value) => onChange('title', value)}
              placeholder="Enter task title"
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="task-description">
            <TextArea
              id="task-description"
              value={task.description}
              onChange={(_event, value) => onChange('description', value)}
              placeholder="Describe the task..."
              rows={4}
            />
          </FormGroup>

          <Flex spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <FormGroup label="Type" fieldId="task-type">
                <FormSelect
                  id="task-type"
                  value={task.type}
                  onChange={(_event, value) => onChange('type', value)}
                >
                  <FormSelectOption value="task" label="Task" />
                  <FormSelectOption value="bug" label="Bug" />
                  <FormSelectOption value="feature" label="Feature" />
                  <FormSelectOption value="story" label="Story" />
                  <FormSelectOption value="epic" label="Epic" />
                  <FormSelectOption value="spike" label="Spike" />
                </FormSelect>
              </FormGroup>
            </FlexItem>

            <FlexItem flex={{ default: 'flex_1' }}>
              <FormGroup label="Status" fieldId="task-status">
                <FormSelect
                  id="task-status"
                  value={task.status}
                  onChange={(_event, value) => onChange('status', value)}
                >
                  <FormSelectOption value="backlog" label="Backlog" />
                  <FormSelectOption value="open" label="Open" />
                  <FormSelectOption value="in-progress" label="In Progress" />
                  <FormSelectOption value="blocked" label="Blocked" />
                  <FormSelectOption value="review" label="In Review" />
                  <FormSelectOption value="done" label="Done" />
                </FormSelect>
              </FormGroup>
            </FlexItem>

            <FlexItem flex={{ default: 'flex_1' }}>
              <FormGroup label="Priority" fieldId="task-priority">
                <FormSelect
                  id="task-priority"
                  value={task.priority}
                  onChange={(_event, value) => onChange('priority', value)}
                >
                  <FormSelectOption value="critical" label="Critical" />
                  <FormSelectOption value="high" label="High" />
                  <FormSelectOption value="medium" label="Medium" />
                  <FormSelectOption value="low" label="Low" />
                </FormSelect>
              </FormGroup>
            </FlexItem>
          </Flex>

          <Flex spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <FormGroup label="Component" fieldId="task-component">
                <TextInput
                  id="task-component"
                  value={task.component}
                  onChange={(_event, value) => onChange('component', value)}
                  placeholder="e.g., frontend, backend"
                />
              </FormGroup>
            </FlexItem>

            <FlexItem flex={{ default: 'flex_1' }}>
              <FormGroup label="Due date" fieldId="task-due">
                <TextInput
                  id="task-due"
                  type="date"
                  value={task.due}
                  onChange={(_event, value) => onChange('due', value)}
                />
              </FormGroup>
            </FlexItem>
          </Flex>

          <FormGroup label="Labels" fieldId="task-labels">
            <TextInput
              id="task-labels"
              value={task.labels}
              onChange={(_event, value) => onChange('labels', value)}
              placeholder="Comma-separated labels (e.g., urgent, frontend)"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>Separate multiple labels with commas</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onSave}
          isLoading={isSaving}
          isDisabled={isSaving || !task.title.trim()}
        >
          Create
        </Button>
        <Button
          variant="link"
          onClick={onClose}
          isDisabled={isSaving}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateTaskModal;
