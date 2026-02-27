import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Checkbox,
  Radio,
  Switch,
  NumberInput,
  DatePicker,
  TimePicker,
  Slider,
  SearchInput,
  FormSelect,
  FormSelectOption,
  FileUpload,
  InputGroup,
  InputGroupItem,
  InputGroupText,
  Button,
  Divider
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

const FormsAndInputs = () => {
  const [textInput, setTextInput] = React.useState('');
  const [textArea, setTextArea] = React.useState('');
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState('option1');
  const [switchChecked, setSwitchChecked] = React.useState(false);
  const [numberValue, setNumberValue] = React.useState(0);
  const [dateValue, setDateValue] = React.useState('');
  const [timeValue, setTimeValue] = React.useState('');
  const [sliderValue, setSliderValue] = React.useState(50);
  const [searchValue, setSearchValue] = React.useState('');
  const [selectValue, setSelectValue] = React.useState('');
  const [fileValue, setFileValue] = React.useState('');
  const [filename, setFilename] = React.useState('');

  const onMinus = () => {
    const newValue = numberValue - 1;
    setNumberValue(newValue);
  };

  const onPlus = () => {
    const newValue = numberValue + 1;
    setNumberValue(newValue);
  };

  return (
    <Grid hasGutter>
      {/* Text Inputs */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Text Inputs</CardTitle>
          <CardBody>
            <Form>
              <FormGroup label="Text Input" isRequired>
                <TextInput
                  value={textInput}
                  type="text"
                  onChange={(_event, value) => setTextInput(value)}
                  placeholder="Enter text here"
                />
              </FormGroup>
              <FormGroup label="Text Area">
                <TextArea
                  value={textArea}
                  onChange={(_event, value) => setTextArea(value)}
                  placeholder="Enter multi-line text"
                  rows={3}
                />
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </GridItem>

      {/* Checkboxes and Radio */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Checkboxes & Radio Buttons</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Checkboxes:</strong>
              <Checkbox
                id="checkbox1"
                label="Option 1"
                isChecked={checkboxChecked}
                onChange={(_event, checked) => setCheckboxChecked(checked)}
                style={{ marginTop: '0.5rem' }}
              />
              <Checkbox
                id="checkbox2"
                label="Option 2 (disabled)"
                isDisabled
              />
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Radio Buttons:</strong>
              <Radio
                id="radio1"
                name="radio-example"
                label="Option 1"
                isChecked={radioValue === 'option1'}
                onChange={() => setRadioValue('option1')}
                style={{ marginTop: '0.5rem' }}
              />
              <Radio
                id="radio2"
                name="radio-example"
                label="Option 2"
                isChecked={radioValue === 'option2'}
                onChange={() => setRadioValue('option2')}
              />
              <Radio
                id="radio3"
                name="radio-example"
                label="Option 3"
                isChecked={radioValue === 'option3'}
                onChange={() => setRadioValue('option3')}
              />
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Switch and Number Input */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Switch & Number Input</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Switch:</strong>
              <Switch
                id="switch-example"
                label="Toggle switch"
                isChecked={switchChecked}
                onChange={(_event, checked) => setSwitchChecked(checked)}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            <Divider style={{ margin: '1rem 0' }} />
            <div>
              <strong>Number Input:</strong>
              <NumberInput
                value={numberValue}
                onMinus={onMinus}
                onPlus={onPlus}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setNumberValue(isNaN(value) ? 0 : value);
                }}
                inputName="number-input"
                inputAriaLabel="number input"
                minusBtnAriaLabel="minus"
                plusBtnAriaLabel="plus"
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </CardBody>
        </Card>
      </GridItem>

      {/* Date and Time Pickers */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Date & Time Pickers</CardTitle>
          <CardBody>
            <Form>
              <FormGroup label="Date Picker">
                <DatePicker
                  value={dateValue}
                  onChange={(_event, value) => setDateValue(value)}
                  placeholder="YYYY-MM-DD"
                />
              </FormGroup>
              <FormGroup label="Time Picker">
                <TimePicker
                  time={timeValue}
                  onChange={(_event, time) => setTimeValue(time)}
                  placeholder="HH:MM"
                />
              </FormGroup>
            </Form>
          </CardBody>
        </Card>
      </GridItem>

      {/* Slider */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Slider</CardTitle>
          <CardBody>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Value: {sliderValue}</strong>
            </div>
            <Slider
              value={sliderValue}
              onChange={(_event, value) => setSliderValue(value)}
              min={0}
              max={100}
              step={1}
              showTicks
            />
          </CardBody>
        </Card>
      </GridItem>

      {/* Search Input */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Search Input</CardTitle>
          <CardBody>
            <SearchInput
              placeholder="Search..."
              value={searchValue}
              onChange={(_event, value) => setSearchValue(value)}
              onClear={() => setSearchValue('')}
            />
            {searchValue && (
              <div style={{ marginTop: '1rem', color: '#6a6e73' }}>
                Searching for: <strong>{searchValue}</strong>
              </div>
            )}
          </CardBody>
        </Card>
      </GridItem>

      {/* Form Select */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Form Select</CardTitle>
          <CardBody>
            <FormSelect
              value={selectValue}
              onChange={(_event, value) => setSelectValue(value)}
              aria-label="FormSelect Input"
            >
              <FormSelectOption key="placeholder" value="" label="Choose an option" isPlaceholder />
              <FormSelectOption key="option1" value="option1" label="Option 1" />
              <FormSelectOption key="option2" value="option2" label="Option 2" />
              <FormSelectOption key="option3" value="option3" label="Option 3" />
            </FormSelect>
            {selectValue && (
              <div style={{ marginTop: '1rem' }}>
                Selected: <strong>{selectValue}</strong>
              </div>
            )}
          </CardBody>
        </Card>
      </GridItem>

      {/* File Upload */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>File Upload</CardTitle>
          <CardBody>
            <FileUpload
              id="file-upload"
              value={fileValue}
              filename={filename}
              onChange={(_event, value) => setFileValue(value)}
              onFileInputChange={(_event, file) => setFilename(file.name)}
              onClearClick={() => {
                setFileValue('');
                setFilename('');
              }}
            />
          </CardBody>
        </Card>
      </GridItem>

      {/* Input Group */}
      <GridItem span={12} md={6}>
        <Card isFullHeight>
          <CardTitle>Input Group</CardTitle>
          <CardBody>
            <InputGroup>
              <InputGroupItem>
                <InputGroupText>
                  <SearchIcon />
                </InputGroupText>
              </InputGroupItem>
              <InputGroupItem isFill>
                <TextInput
                  type="search"
                  placeholder="Search with icon"
                  aria-label="search input"
                />
              </InputGroupItem>
              <InputGroupItem>
                <Button variant="control">Search</Button>
              </InputGroupItem>
            </InputGroup>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default FormsAndInputs;


