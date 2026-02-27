import React, { useState } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
  Gallery,
  GalleryItem,
  Label,
  Flex,
  FlexItem,
  Content,
  ContentVariants,
  Tabs,
  Tab,
  TabTitleText,
  Button,
  ClipboardCopy,
  Tooltip,
  Split,
  SplitItem,
  Divider
} from '@patternfly/react-core';
import {
  OutlinedStarIcon,
  StarIcon,
  DownloadIcon,
  CodeIcon
} from '@patternfly/react-icons';

// Import assistant icons - Original and Static
import AssistantApollo from '../../../../src/assets/assistants/assistant-apollo.svg';
import AssistantWaves from '../../../../src/assets/assistants/assistant-waves.svg';

// Animated Glow Variations
import AssistantLava from '../../../../src/assets/assistants/assistant-lava.svg';
import AssistantPlasma from '../../../../src/assets/assistants/assistant-plasma.svg';
import AssistantAurora from '../../../../src/assets/assistants/assistant-aurora.svg';
import AssistantNebula from '../../../../src/assets/assistants/assistant-nebula.svg';
import AssistantPulse from '../../../../src/assets/assistants/assistant-pulse.svg';
import AssistantFirefly from '../../../../src/assets/assistants/assistant-firefly.svg';
import AssistantCrystal from '../../../../src/assets/assistants/assistant-crystal.svg';

// Brand assets (served from public folder)
const brandAssets = [
  {
    id: 'logo-dark',
    name: 'Apollo Dark',
    description: 'Primary logo for dark backgrounds. Blue icon on dark circular background.',
    src: '/logo-apollo-dark.png',
    file: 'logo-apollo-dark.png',
    tags: ['logo', 'dark-mode', 'primary'],
    animated: false,
    category: 'brand',
    isPublic: true
  },
  {
    id: 'logo-light',
    name: 'Apollo Light',
    description: 'Logo variant with blue gradient. Suitable for app icons and light backgrounds.',
    src: '/logo-apollo-light.png',
    file: 'logo-apollo-light.png',
    tags: ['logo', 'gradient', 'app-icon'],
    animated: false,
    category: 'brand',
    isPublic: true
  },
  {
    id: 'logo-catalog',
    name: 'Apollo Catalog',
    description: 'Warm coral/orange gradient variant. Used for catalog and secondary branding.',
    src: '/logo-apollo-catalog.png',
    file: 'logo-apollo-catalog.png',
    tags: ['logo', 'gradient', 'catalog', 'warm'],
    animated: false,
    category: 'brand',
    isPublic: true
  }
];

const assistantIcons = [
  {
    id: 'original',
    name: 'Original',
    description: 'Minimal abstract globe with sweeping horizon arc. Single-color, easily printable.',
    src: AssistantApollo,
    file: 'assistant-apollo.svg',
    tags: ['minimal', 'single-color', 'print-ready'],
    animated: false,
    category: 'assistant'
  },
  {
    id: 'waves',
    name: 'Flowing Waves',
    description: 'Stacked wave patterns with floating orb accent, evoking ocean depth.',
    src: AssistantWaves,
    file: 'assistant-waves.svg',
    tags: ['gradient', 'waves', 'ocean'],
    animated: false,
    category: 'assistant'
  },
  {
    id: 'lava',
    name: 'Lava Lamp',
    description: 'Oozy orb effect with morphing blob shapes. Hover to accelerate the swirl!',
    src: AssistantLava,
    file: 'assistant-lava.svg',
    tags: ['animated', 'interactive', 'morphing'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'plasma',
    name: 'Plasma Orb',
    description: 'Ethereal plasma effect with soft-edge blurs. Hover to intensify the glow!',
    src: AssistantPlasma,
    file: 'assistant-plasma.svg',
    tags: ['animated', 'interactive', 'ethereal'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Flowing aurora ribbons with twinkling stars. Hover for color wave effect!',
    src: AssistantAurora,
    file: 'assistant-aurora.svg',
    tags: ['animated', 'aurora', 'cosmic'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    description: 'Rotating cosmic dust with glowing core. A galaxy in your assistant!',
    src: AssistantNebula,
    file: 'assistant-nebula.svg',
    tags: ['animated', 'rotating', 'space'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'pulse',
    name: 'Pulse Ring',
    description: 'Concentric pulsing rings radiating from center. Hover to quicken the pulse!',
    src: AssistantPulse,
    file: 'assistant-pulse.svg',
    tags: ['animated', 'pulse', 'rings'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'firefly',
    name: 'Firefly Swarm',
    description: 'Floating glowing particles in warm and cool tones. Magical nighttime feel!',
    src: AssistantFirefly,
    file: 'assistant-firefly.svg',
    tags: ['animated', 'particles', 'magical'],
    animated: true,
    category: 'assistant'
  },
  {
    id: 'crystal',
    name: 'Crystal Heart',
    description: 'Glowing crystalline structure with inner light. Elegant and mystical!',
    src: AssistantCrystal,
    file: 'assistant-crystal.svg',
    tags: ['animated', 'crystal', 'mystical'],
    animated: true,
    category: 'assistant'
  }
];

// Combined assets from all categories
const allAssets = [...assistantIcons, ...brandAssets];

const Assets = () => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [favorites, setFavorites] = useState(['original', 'logo-dark']);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const handleTabSelect = (event, tabIndex) => {
    setActiveTabKey(tabIndex);
    setSelectedIcon(null);
  };

  const getFilteredIcons = () => {
    switch (activeTabKey) {
      case 0: // All
        return allAssets;
      case 1: // Brand
        return allAssets.filter(l => l.category === 'brand');
      case 2: // Assistants
        return allAssets.filter(l => l.category === 'assistant');
      case 3: // Animated
        return allAssets.filter(l => l.animated);
      case 4: // Favorites
        return allAssets.filter(l => favorites.includes(l.id));
      default:
        return allAssets;
    }
  };

  const getBackgroundStyle = (icon) => {
    if (icon.category === 'animal') {
      return 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)';
    }
    if (icon.category === 'brand') {
      return 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    }
    return 'linear-gradient(135deg, var(--pf-t--global--background--color--secondary--default) 0%, #1e1b4b 100%)';
  };

  const renderAssetImage = (icon, size = '160px') => {
    const isSvg = icon.file.endsWith('.svg');
    
    if (isSvg) {
      return (
        <object 
          type="image/svg+xml" 
          data={icon.src}
          style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: size,
            maxHeight: size,
            color: icon.category === 'animal' ? '#1f2937' : '#e2e8f0'
          }}
          aria-label={icon.name}
        >
          <img src={icon.src} alt={icon.name} />
        </object>
      );
    }
    
    return (
      <img 
        src={icon.src} 
        alt={icon.name}
        style={{ 
          width: '100%', 
          height: '100%',
          maxWidth: size,
          maxHeight: size,
          objectFit: 'contain'
        }}
      />
    );
  };

  const IconCard = ({ icon }) => {
    const isFavorite = favorites.includes(icon.id);
    
    return (
      <Card 
        isClickable 
        isSelectable
        isSelected={selectedIcon === icon.id}
        onClick={() => setSelectedIcon(icon.id === selectedIcon ? null : icon.id)}
        style={{ height: '100%' }}
      >
        <CardHeader
          actions={{
            actions: (
              <Tooltip content={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                <Button 
                  variant="plain" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(icon.id);
                  }}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? <StarIcon color="var(--pf-t--global--color--status--warning--default)" /> : <OutlinedStarIcon />}
                </Button>
              </Tooltip>
            ),
            hasNoOffset: true
          }}
        >
          <CardTitle>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>{icon.name}</FlexItem>
              {icon.animated && (
                <FlexItem>
                  <Label color="purple" isCompact>Animated</Label>
                </FlexItem>
              )}
              {icon.category === 'brand' && (
                <FlexItem>
                  <Label color="blue" isCompact>Brand</Label>
                </FlexItem>
              )}
              {icon.category === 'animal' && (
                <FlexItem>
                  <Label color="orange" isCompact>Animal</Label>
                </FlexItem>
              )}
            </Flex>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div 
            style={{ 
              width: '100%', 
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: getBackgroundStyle(icon),
              borderRadius: '8px',
              marginBottom: '16px',
              padding: '24px'
            }}
          >
            {renderAssetImage(icon)}
          </div>
          <Content component={ContentVariants.small} style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
            {icon.description}
          </Content>
          <Flex gap={{ default: 'gapXs' }} style={{ marginTop: '12px' }} wrap={{ default: 'wrap' }}>
            {icon.tags.map(tag => (
              <FlexItem key={tag}>
                <Label isCompact color="blue">{tag}</Label>
              </FlexItem>
            ))}
          </Flex>
        </CardBody>
      </Card>
    );
  };

  const getDetailBackground = (icon) => {
    if (icon.category === 'animal') {
      return 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)';
    }
    if (icon.category === 'brand') {
      return 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    }
    return 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
  };

  const getImportPath = (icon) => {
    if (icon.isPublic) {
      return `<img src="/${icon.file}" alt="${icon.name}" />`;
    }
    if (icon.category === 'assistant') {
      return `import Asset from '../assets/assistants/${icon.file}';`;
    }
    return `import Asset from '../assets/${icon.file}';`;
  };

  const IconDetail = ({ icon }) => {
    const isSvg = icon.file.endsWith('.svg');
    
    return (
      <Card>
        <CardBody>
          <Split hasGutter>
            <SplitItem>
              <div 
                style={{ 
                  width: '300px', 
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: getDetailBackground(icon),
                  borderRadius: '12px',
                  padding: '40px'
                }}
              >
                {renderAssetImage(icon, '220px')}
              </div>
            </SplitItem>
            <SplitItem isFilled>
              <Title headingLevel="h3">{icon.name}</Title>
              <Content component={ContentVariants.p}>{icon.description}</Content>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Content component={ContentVariants.h4}>File</Content>
              <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                {icon.file}
              </ClipboardCopy>
              
              <Content component={ContentVariants.h4} style={{ marginTop: '16px' }}>
                {icon.isPublic ? 'Usage' : 'Import Path'}
              </Content>
              <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" isCode>
                {getImportPath(icon)}
              </ClipboardCopy>
              
              <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '24px' }}>
                <FlexItem>
                  <Button 
                    variant="primary" 
                    icon={<DownloadIcon />}
                    component="a"
                    href={icon.src}
                    download={icon.file}
                  >
                    Download {isSvg ? 'SVG' : 'PNG'}
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button 
                    variant="secondary" 
                    icon={<CodeIcon />}
                    component="a"
                    href={icon.src}
                    target="_blank"
                  >
                    View {isSvg ? 'Source' : 'Image'}
                  </Button>
                </FlexItem>
              </Flex>
            </SplitItem>
          </Split>
        </CardBody>
      </Card>
    );
  };

  const selectedIconData = allAssets.find(l => l.id === selectedIcon);
  const filteredIcons = getFilteredIcons();

  return (
    <PageSection>
      <div style={{ marginBottom: '24px' }}>
        <Title headingLevel="h1">Assets</Title>
        <Content component={ContentVariants.p}>Brand logos, assistant icons, and design resources for the Apollo project.</Content>
      </div>

      <Tabs activeKey={activeTabKey} onSelect={handleTabSelect} style={{ marginBottom: '24px' }}>
        <Tab 
          eventKey={0} 
          title={<TabTitleText>All ({allAssets.length})</TabTitleText>}
        />
        <Tab 
          eventKey={1} 
          title={<TabTitleText>Brand ({allAssets.filter(l => l.category === 'brand').length})</TabTitleText>}
        />
        <Tab 
          eventKey={2} 
          title={<TabTitleText>Assistants ({allAssets.filter(l => l.category === 'assistant').length})</TabTitleText>}
        />
        <Tab 
          eventKey={3} 
          title={<TabTitleText>Animated ({allAssets.filter(l => l.animated).length})</TabTitleText>}
        />
        <Tab 
          eventKey={4} 
          title={<TabTitleText>Favorites ({favorites.length})</TabTitleText>}
        />
      </Tabs>

      {selectedIconData && (
        <div style={{ marginBottom: '24px' }}>
          <IconDetail icon={selectedIconData} />
        </div>
      )}

      <Gallery hasGutter minWidths={{ default: '280px' }}>
        {filteredIcons.map(icon => (
          <GalleryItem key={icon.id}>
            <IconCard icon={icon} />
          </GalleryItem>
        ))}
      </Gallery>

      {filteredIcons.length === 0 && (
        <Card>
          <CardBody>
            <Content component={ContentVariants.p} style={{ textAlign: 'center', padding: '40px' }}>
              {activeTabKey === 4 
                ? 'No favorites yet. Click the star icon on any asset to add it to your favorites.'
                : 'No assets found in this category.'}
            </Content>
          </CardBody>
        </Card>
      )}
    </PageSection>
  );
};

export default Assets;
