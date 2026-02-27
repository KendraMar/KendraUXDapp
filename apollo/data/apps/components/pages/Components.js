import React from 'react';
import {
  PageSection,
  Title,
  Content,
  Sidebar,
  SidebarPanel,
  SidebarContent,
  Nav,
  NavList,
  NavItem,
  TextInput,
  Divider,
  Card,
  CardTitle,
  CardBody
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import ButtonsAndActions from './components/ButtonsAndActions';
import FormsAndInputs from './components/FormsAndInputs';
import DataDisplay from './components/DataDisplay';
import Feedback from './components/Feedback';
import NavigationComponents from './components/NavigationComponents';
import LayoutComponents from './components/LayoutComponents';
import Overlays from './components/Overlays';
import SpecialComponents from './components/SpecialComponents';

const Components = () => {
  const [activeSection, setActiveSection] = React.useState('buttons-actions');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Define sections with metadata for search
  const sections = [
    { 
      id: 'buttons-actions', 
      title: 'Buttons & Actions', 
      component: ButtonsAndActions,
      keywords: 'button action toggle clipboard copy primary secondary'
    },
    { 
      id: 'forms-inputs', 
      title: 'Forms & Inputs', 
      component: FormsAndInputs,
      keywords: 'form input text textarea checkbox radio switch number date time picker slider search select file upload'
    },
    { 
      id: 'data-display', 
      title: 'Data Display', 
      component: DataDisplay,
      keywords: 'avatar badge label list description data tree skeleton truncate timestamp code block'
    },
    { 
      id: 'feedback', 
      title: 'Feedback', 
      component: Feedback,
      keywords: 'alert banner progress spinner tooltip popover helper hint empty state'
    },
    { 
      id: 'navigation', 
      title: 'Navigation', 
      component: NavigationComponents,
      keywords: 'tabs breadcrumb pagination dropdown menu jump links'
    },
    { 
      id: 'layouts', 
      title: 'Layouts', 
      component: LayoutComponents,
      keywords: 'flex stack split level gallery bullseye panel sidebar divider grid'
    },
    { 
      id: 'overlays', 
      title: 'Overlays', 
      component: Overlays,
      keywords: 'modal drawer backdrop popover dialog'
    },
    { 
      id: 'special', 
      title: 'Special', 
      component: SpecialComponents,
      keywords: 'accordion expandable calendar toolbar about notification dual list skip'
    }
  ];

  // Filter sections based on search query
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return sections;
    
    const query = searchQuery.toLowerCase();
    return sections.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.keywords.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Track which section is in view
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          PatternFly 6 Components Library
        </Title>
        <Content component="p">
          Comprehensive interactive examples of PatternFly 6 components - scroll or search to explore
        </Content>
        <div style={{ marginTop: '1rem', maxWidth: '500px' }}>
          <TextInput
            value={searchQuery}
            type="search"
            onChange={(_event, value) => setSearchQuery(value)}
            placeholder="Search components... (e.g., button, modal, form)"
            iconVariant="search"
          />
        </div>
      </PageSection>
      <PageSection padding={{ default: 'noPadding' }}>
        <Sidebar hasGutter>
          <SidebarPanel 
            width={{ default: 'width_25', lg: 'width_20' }}
            style={{ 
              position: 'sticky', 
              top: '1rem', 
              alignSelf: 'flex-start', 
              maxHeight: 'calc(100vh - 2rem)', 
              overflowY: 'auto' 
            }}
          >
            <div style={{ padding: '0 1rem' }}>
              <Title headingLevel="h3" size="md" style={{ marginBottom: '1rem' }}>
                Categories
              </Title>
              <Nav aria-label="Component categories navigation">
                <NavList>
                  {filteredSections.map((section) => (
                    <NavItem
                      key={section.id}
                      itemId={section.id}
                      isActive={activeSection === section.id}
                      onClick={() => scrollToSection(section.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {section.title}
                    </NavItem>
                  ))}
                </NavList>
              </Nav>
            </div>
          </SidebarPanel>
          <SidebarContent>
            {filteredSections.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Title headingLevel="h3" size="lg">No components found</Title>
                <Content component="p">Try adjusting your search query</Content>
              </div>
            ) : (
              filteredSections.map((section, index) => {
                const SectionComponent = section.component;
                return (
                  <div key={section.id}>
                    <div id={section.id} style={{ scrollMarginTop: '80px', padding: '1.5rem 1.5rem 0.5rem' }}>
                      <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                        {section.title}
                      </Title>
                      <Divider style={{ marginBottom: '1.5rem' }} />
                      <SectionComponent />
                    </div>
                    {index < filteredSections.length - 1 && (
                      <div style={{ padding: '2rem 0' }}>
                        <Divider />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </SidebarContent>
        </Sidebar>
      </PageSection>
    </>
  );
};

export default Components;
