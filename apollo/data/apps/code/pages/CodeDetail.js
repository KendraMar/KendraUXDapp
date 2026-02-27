import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { DiffEditor } from '@monaco-editor/react';

// ============================================================
// ICON COMPONENTS (inline SVG for VS Code-like icons)
// ============================================================
const Icon = ({ d, size = 16, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={style}>
    <path d={d} fill={color} />
  </svg>
);

const Icons = {
  files: 'M13 1H5a1 1 0 00-1 1v2H3a1 1 0 00-1 1v9a1 1 0 001 1h8a1 1 0 001-1v-2h1a1 1 0 001-1V2a1 1 0 00-1-1zM11 14H3V5h8v9zm2-3h-1V5a1 1 0 00-1-1H5V2h8v9z',
  search: 'M15.25 13.836l-3.76-3.76a5.508 5.508 0 10-1.414 1.414l3.76 3.76a1 1 0 001.414-1.414zM2 6.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z',
  gitBranch: 'M11 4a3 3 0 00-2 5.22V10a1 1 0 01-1 1H6a3 3 0 00-2-2V4.78a3 3 0 10-1 0V9a3 3 0 00-1 2 3 3 0 102 0 1 1 0 001-1h2a2 2 0 002-2v-.78A3 3 0 0011 4zM4 3a2 2 0 11-2 2 2 2 0 012-2zm0 10a2 2 0 11-2 2 2 2 0 012-2zm7-7a2 2 0 112-2 2 2 0 01-2 2z',
  folder: 'M14.5 3H7.71l-.85-.85A.5.5 0 006.5 2h-5a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-10a.5.5 0 00-.5-.5zm-.5 10H2V3h4.29l.85.85a.5.5 0 00.36.15H14v9z',
  folderOpen: 'M1.5 14h11l2-6H4l-2 6zm.74-1L3.5 9h9.74l-1.26 4H2.24zM14.5 3H7.71l-.85-.85A.5.5 0 006.5 2h-5a.5.5 0 00-.5.5V7h1V3h4.29l.85.85a.5.5 0 00.36.15H14v3h1V3.5a.5.5 0 00-.5-.5z',
  file: 'M13.71 4.29l-3-3A1 1 0 0010 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-.29-.71zM12 14H4V2h5v3a1 1 0 001 1h2v8z',
  close: 'M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z',
  chevronRight: 'M5.7 13.7l5-5a1 1 0 000-1.4l-5-5a1 1 0 00-1.4 1.4L8.58 8l-4.3 4.3a1 1 0 001.42 1.4z',
  chevronDown: 'M2.3 5.7l5 5a1 1 0 001.4 0l5-5a1 1 0 00-1.4-1.4L8 8.58 3.7 4.3a1 1 0 00-1.4 1.4z',
  add: 'M14 7v1H8v6H7V8H1V7h6V1h1v6h6z',
  check: 'M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.763.646z',
  refresh: 'M13.451 5.609l-.579-.344a5.5 5.5 0 101.395 4.58l.953.195a6.5 6.5 0 11-1.769-4.431zM13 6V2.5l-1 1V6h1z',
  arrowUp: 'M8 1l5.5 5.5-1 1L9 4v10H7V4L3.5 7.5l-1-1L8 1z',
  arrowDown: 'M8 15l-5.5-5.5 1-1L7 12V2h2v10l3.5-3.5 1 1L8 15z',
  sync: 'M2.006 8.267L.6 9.667l-0.6-.6 2-2h.8l2 2-.6.6-1.394-1.394a6 6 0 0011.142 3.477l.876.482A7 7 0 012.006 8.267zm13.388-.534l1.394 1.394a6 6 0 00-11.142-3.477l-.876-.482A7 7 0 0115.594 8.267L17 6.867l.6.6-2 2h-.8l-2-2 .6-.6z',
  ellipsis: 'M4 8a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z',
  minus: 'M14 7v1H2V7h12z',
  discard: 'M5.146 12.146l-.003-.003-2.353-2.354a.5.5 0 01.707-.707l1.5 1.5V5.5A3.5 3.5 0 018.497 2H12v1H8.497A2.5 2.5 0 005.997 5.5v5.082l1.5-1.5a.5.5 0 01.707.707l-2.354 2.354-.003.003-.351.354-.35-.354z',
  diffAdded: 'M14 7v1H8v6H7V8H1V7h6V1h1v6h6z',
  diffModified: 'M8 4a4 4 0 100 8 4 4 0 000-8z',
  diffDeleted: 'M14 7v1H2V7h12z',
  git: 'M14.85 7.73l-6.58-6.58a.51.51 0 00-.71 0L5.93 2.78l1.81 1.81a.6.6 0 01.8.8L10.33 7.2a.6.6 0 01.78.78.6.6 0 01-.78-.78l-1.77-1.79v4.71a.6.6 0 01.33.54.61.61 0 01-1.22 0 .6.6 0 01.33-.53V5.38a.61.61 0 01-.33-.53.6.6 0 01.07-.29L6.93 2.75 1.85 7.73a.51.51 0 000 .71l6.58 6.58a.5.5 0 00.71 0l5.71-5.71a.5.5 0 000-.58z',
  history: 'M13.507 12.324a7 7 0 10-2.183 2.183l-.39-.927a6 6 0 111.89-1.89l.683.634zM8 3v5h4v-1H9V3H8z',
  listView: 'M2 3h12v1H2V3zm0 4h12v1H2V7zm0 4h12v1H2v-1z',
  treeView: 'M1 2h5v1H1V2zm7 0h7v1H8V2zM1 6h5v1H1V6zm7 0h7v1H8V6zM1 10h5v1H1v-1zm7 0h7v1H8v-1zM3 14h4v1H3v-1zm4 0h7v1H7v-1z',
};

// ============================================================
// FILE ICON HELPERS
// ============================================================
const getFileIconColor = (name) => {
  const ext = name.split('.').pop()?.toLowerCase();
  const colorMap = {
    js: '#f0db4f', jsx: '#61dafb', ts: '#3178c6', tsx: '#3178c6',
    py: '#3572A5', rb: '#CC342D', go: '#00ADD8', rs: '#dea584',
    java: '#b07219', c: '#555555', cpp: '#f34b7d', h: '#555555',
    css: '#563d7c', scss: '#c6538c', html: '#e34c26', json: '#292929',
    yaml: '#cb171e', yml: '#cb171e', md: '#083fa1', sql: '#e38c00',
    sh: '#89e051', bash: '#89e051', xml: '#0060ac', svg: '#ff9900',
    gitignore: '#f44d27', env: '#ecd53f', lock: '#888',
    toml: '#9c4221', cfg: '#888', ini: '#888', txt: '#888',
  };
  return colorMap[ext] || '#888';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'modified': return '#e2c08d';
    case 'added': case 'untracked': return '#73c991';
    case 'deleted': return '#c74e39';
    case 'renamed': return '#73c991';
    default: return '#cccccc';
  }
};

const getStatusLetter = (status) => {
  switch (status) {
    case 'modified': return 'M';
    case 'added': return 'A';
    case 'untracked': return 'U';
    case 'deleted': return 'D';
    case 'renamed': return 'R';
    default: return '?';
  }
};

// ============================================================
// COMPACT TREE VIEW COMPONENT
// ============================================================
const TreeNode = ({ node, depth = 0, onFileClick, activeFile, expandedDirs, toggleDir }) => {
  const isDir = node.type === 'directory';
  const isExpanded = expandedDirs.has(node.path);
  const isActive = !isDir && activeFile === node.path;

  return (
    <>
      <div
        onClick={() => isDir ? toggleDir(node.path) : onFileClick(node)}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '22px',
          paddingLeft: `${12 + depth * 16}px`,
          paddingRight: '8px',
          cursor: 'pointer',
          background: isActive ? '#37373d' : 'transparent',
          color: isActive ? '#ffffff' : '#cccccc',
          fontSize: '13px',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#2a2d2e'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {isDir ? (
          <>
            <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Icon d={isExpanded ? Icons.chevronDown : Icons.chevronRight} size={10} color="#cccccc" />
            </span>
            <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '4px' }}>
              <Icon d={isExpanded ? Icons.folderOpen : Icons.folder} size={14} color="#dcb67a" />
            </span>
          </>
        ) : (
          <>
            <span style={{ width: '16px', flexShrink: 0 }} />
            <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '4px' }}>
              <Icon d={Icons.file} size={14} color={getFileIconColor(node.name)} />
            </span>
          </>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
      </div>
      {isDir && isExpanded && node.children && node.children.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onFileClick={onFileClick}
          activeFile={activeFile}
          expandedDirs={expandedDirs}
          toggleDir={toggleDir}
        />
      ))}
    </>
  );
};

// ============================================================
// GIT CHANGE TREE HELPERS
// ============================================================
const buildChangeTree = (files) => {
  const root = {};
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf file node
        current[part] = { __file: file };
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }
  // Convert to array structure
  const toArray = (obj, parentPath = '') => {
    const entries = Object.entries(obj).sort(([aKey, aVal], [bKey, bVal]) => {
      const aIsDir = !aVal.__file;
      const bIsDir = !bVal.__file;
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return aKey.localeCompare(bKey);
    });
    return entries.map(([key, val]) => {
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      if (val.__file) {
        return { name: key, path: fullPath, type: 'file', file: val.__file };
      }
      return { name: key, path: fullPath, type: 'directory', children: toArray(val, fullPath) };
    });
  };
  return toArray(root);
};

const GitChangeTreeNode = ({ node, depth = 0, onFileClick, onStage, onUnstage, onDiscard, isStaged, expandedScmDirs, toggleScmDir }) => {
  const isDir = node.type === 'directory';
  const isExpanded = expandedScmDirs.has(node.path);

  if (isDir) {
    return (
      <>
        <div
          onClick={() => toggleScmDir(node.path)}
          style={{
            display: 'flex', alignItems: 'center', height: '22px',
            paddingLeft: `${12 + depth * 16}px`, paddingRight: '8px',
            cursor: 'pointer', color: '#cccccc', fontSize: '13px',
            userSelect: 'none', whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Icon d={isExpanded ? Icons.chevronDown : Icons.chevronRight} size={10} color="#cccccc" />
          </span>
          <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '4px' }}>
            <Icon d={isExpanded ? Icons.folderOpen : Icons.folder} size={14} color="#dcb67a" />
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
        </div>
        {isExpanded && node.children && node.children.map(child => (
          <GitChangeTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            onFileClick={onFileClick}
            onStage={onStage}
            onUnstage={onUnstage}
            onDiscard={onDiscard}
            isStaged={isStaged}
            expandedScmDirs={expandedScmDirs}
            toggleScmDir={toggleScmDir}
          />
        ))}
      </>
    );
  }

  const file = node.file;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: '22px',
      paddingLeft: `${12 + depth * 16}px`, paddingRight: '8px',
      cursor: 'pointer', fontSize: '13px', color: getStatusColor(file.status),
      whiteSpace: 'nowrap'
    }}
      onClick={() => onFileClick(file.path)}
      onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
      <span style={{ width: '16px', flexShrink: 0 }} />
      <span style={{ width: '16px', display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '4px' }}>
        <Icon d={Icons.file} size={14} color={getFileIconColor(node.name)} />
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        {!isStaged && file.status !== 'untracked' && onDiscard && (
          <button onClick={(e) => { e.stopPropagation(); onDiscard([file.path]); }} title="Discard Changes"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <Icon d={Icons.discard} size={12} color="#cccccc" />
          </button>
        )}
        {isStaged && onUnstage ? (
          <button onClick={(e) => { e.stopPropagation(); onUnstage([file.path]); }} title="Unstage"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <Icon d={Icons.minus} size={12} color="#cccccc" />
          </button>
        ) : !isStaged && onStage && (
          <button onClick={(e) => { e.stopPropagation(); onStage([file.path]); }} title="Stage"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <Icon d={Icons.add} size={12} color="#cccccc" />
          </button>
        )}
      </div>
      <span style={{ width: '14px', textAlign: 'center', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
        {getStatusLetter(file.status)}
      </span>
    </div>
  );
};

// ============================================================
// MAIN CODE DETAIL COMPONENT
// ============================================================
const CodeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  // Project state
  const [project, setProject] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editor state
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [originalContents, setOriginalContents] = useState({});
  const [modifiedFiles, setModifiedFiles] = useState(new Set());

  // UI state
  const [activeSidebarPanel, setActiveSidebarPanel] = useState('explorer');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [saveMessage, setSaveMessage] = useState(null);

  // Git state
  const [gitStatus, setGitStatus] = useState(null);
  const [gitLog, setGitLog] = useState([]);
  const [gitBranches, setGitBranches] = useState({ branches: [], remoteBranches: [], currentBranch: '' });
  const [commitMessage, setCommitMessage] = useState('');
  const [gitLoading, setGitLoading] = useState(false);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const [scmViewMode, setScmViewMode] = useState('list'); // 'list' or 'tree'
  const [expandedScmDirs, setExpandedScmDirs] = useState(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Diff view state
  const [diffView, setDiffView] = useState(null); // { file, original, modified }

  // Command palette state
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const paletteRef = useRef(null);

  // ============================================================
  // DATA FETCHING
  // ============================================================
  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/code/${id}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
        const tree = buildFlatTree(data.files);
        setFileTree(tree);
        // Auto-expand first level directories
        const firstLevelDirs = tree.filter(n => n.type === 'directory').map(n => n.path);
        setExpandedDirs(new Set(firstLevelDirs));
        // Auto-open first file
        const firstFile = findFirstFile(tree);
        if (firstFile) openFile(firstFile);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
      setLoading(false);
    }
  };

  // Fetch git data
  const fetchGitStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/code/${id}/git/status`);
      const data = await response.json();
      if (data.success) {
        setGitStatus(data);
      }
    } catch (err) {
      console.error('Error fetching git status:', err);
    }
  }, [id]);

  const fetchGitLog = useCallback(async () => {
    try {
      const response = await fetch(`/api/code/${id}/git/log?limit=100`);
      const data = await response.json();
      if (data.success) {
        setGitLog(data.commits);
      }
    } catch (err) {
      console.error('Error fetching git log:', err);
    }
  }, [id]);

  const fetchGitBranches = useCallback(async () => {
    try {
      const response = await fetch(`/api/code/${id}/git/branches`);
      const data = await response.json();
      if (data.success) {
        setGitBranches(data);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  }, [id]);

  useEffect(() => {
    if (!loading) {
      fetchGitStatus();
      fetchGitLog();
      fetchGitBranches();
    }
  }, [loading, fetchGitStatus, fetchGitLog, fetchGitBranches]);

  // ============================================================
  // FILE TREE HELPERS
  // ============================================================
  const buildFlatTree = (files, parentPath = '') => {
    return files.map(file => {
      const fullPath = parentPath ? `${parentPath}/${file.name}` : file.name;
      return {
        ...file,
        path: fullPath,
        children: file.children ? buildFlatTree(file.children, fullPath) : undefined
      };
    });
  };

  const findFirstFile = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllFiles = (nodes, result = []) => {
    for (const node of nodes) {
      if (node.type === 'file') result.push(node);
      if (node.children) getAllFiles(node.children, result);
    }
    return result;
  };

  const toggleDir = useCallback((dirPath) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);

  const toggleScmDir = useCallback((dirPath) => {
    setExpandedScmDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) next.delete(dirPath);
      else next.add(dirPath);
      return next;
    });
  }, []);

  // ============================================================
  // FILE OPERATIONS
  // ============================================================
  const openFile = async (file) => {
    if (file.type === 'directory') return;

    // Close diff view when opening a regular file
    setDiffView(null);

    if (!openFiles.find(f => f.path === file.path)) {
      setOpenFiles(prev => [...prev, { name: file.name, path: file.path }]);
    }
    setActiveFile(file.path);

    if (!fileContents[file.path]) {
      try {
        const response = await fetch(`/api/code/${id}/file?path=${encodeURIComponent(file.path)}`);
        const data = await response.json();
        if (data.success) {
          setFileContents(prev => ({ ...prev, [file.path]: data.content }));
          setOriginalContents(prev => ({ ...prev, [file.path]: data.content }));
        }
      } catch (err) {
        console.error('Error fetching file:', err);
      }
    }
  };

  const closeFile = useCallback((filePath, e) => {
    e?.stopPropagation();
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(f => f.path !== filePath);
      if (activeFile === filePath) {
        const idx = prev.findIndex(f => f.path === filePath);
        const newActive = newOpenFiles[Math.min(idx, newOpenFiles.length - 1)]?.path || null;
        setActiveFile(newActive);
      }
      return newOpenFiles;
    });
    setModifiedFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
  }, [activeFile]);

  const handleEditorChange = useCallback((value) => {
    if (activeFile) {
      setFileContents(prev => ({ ...prev, [activeFile]: value }));
      setModifiedFiles(prev => new Set(prev).add(activeFile));
    }
  }, [activeFile]);

  const handleEditorMount = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const saveFile = async (filePath) => {
    const content = fileContents[filePath];
    if (content === undefined) return;
    try {
      const response = await fetch(`/api/code/${id}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });
      const data = await response.json();
      if (data.success) {
        setModifiedFiles(prev => {
          const next = new Set(prev);
          next.delete(filePath);
          return next;
        });
        setOriginalContents(prev => ({ ...prev, [filePath]: content }));
        setSaveMessage({ type: 'success', text: `Saved ${filePath.split('/').pop()}` });
        setTimeout(() => setSaveMessage(null), 2000);
      }
    } catch (err) {
      console.error('Error saving file:', err);
      setSaveMessage({ type: 'danger', text: 'Failed to save file' });
    }
  };

  const saveActiveFile = useCallback(() => {
    if (activeFile && modifiedFiles.has(activeFile)) {
      saveFile(activeFile);
    }
  }, [activeFile, modifiedFiles, fileContents]);

  // ============================================================
  // GIT OPERATIONS
  // ============================================================
  const gitStage = async (files) => {
    setGitLoading(true);
    try {
      await fetch(`/api/code/${id}/git/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      await fetchGitStatus();
    } catch (err) {
      console.error('Error staging:', err);
    }
    setGitLoading(false);
  };

  const gitUnstage = async (files) => {
    setGitLoading(true);
    try {
      await fetch(`/api/code/${id}/git/unstage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      await fetchGitStatus();
    } catch (err) {
      console.error('Error unstaging:', err);
    }
    setGitLoading(false);
  };

  const gitCommit = async () => {
    if (!commitMessage.trim()) return;
    setGitLoading(true);
    try {
      const response = await fetch(`/api/code/${id}/git/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage })
      });
      const data = await response.json();
      if (data.success) {
        setCommitMessage('');
        await fetchGitStatus();
        await fetchGitLog();
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Commit failed' });
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error committing:', err);
    }
    setGitLoading(false);
  };

  const gitPush = async () => {
    setGitLoading(true);
    try {
      const response = await fetch(`/api/code/${id}/git/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Pushed successfully' });
        await fetchGitStatus();
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Push failed' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error pushing:', err);
    }
    setGitLoading(false);
  };

  const gitPull = async () => {
    setGitLoading(true);
    try {
      const response = await fetch(`/api/code/${id}/git/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Pulled successfully' });
        await fetchGitStatus();
        await fetchGitLog();
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Pull failed' });
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error pulling:', err);
    }
    setGitLoading(false);
  };

  const gitFetch = async () => {
    setGitLoading(true);
    try {
      await fetch(`/api/code/${id}/git/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      await fetchGitStatus();
      await fetchGitBranches();
      setSaveMessage({ type: 'success', text: 'Fetched from remote' });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      console.error('Error fetching:', err);
    }
    setGitLoading(false);
  };

  const gitDiscard = async (files) => {
    setGitLoading(true);
    try {
      await fetch(`/api/code/${id}/git/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });
      // Reload the file contents
      for (const filePath of files) {
        if (fileContents[filePath]) {
          const response = await fetch(`/api/code/${id}/file?path=${encodeURIComponent(filePath)}`);
          const data = await response.json();
          if (data.success) {
            setFileContents(prev => ({ ...prev, [filePath]: data.content }));
            setOriginalContents(prev => ({ ...prev, [filePath]: data.content }));
            setModifiedFiles(prev => {
              const next = new Set(prev);
              next.delete(filePath);
              return next;
            });
          }
        }
      }
      await fetchGitStatus();
    } catch (err) {
      console.error('Error discarding:', err);
    }
    setGitLoading(false);
  };

  const gitCheckout = async (branch) => {
    setGitLoading(true);
    try {
      const response = await fetch(`/api/code/${id}/git/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      const data = await response.json();
      if (data.success) {
        setShowBranchPicker(false);
        await fetchGitStatus();
        await fetchGitLog();
        await fetchGitBranches();
        // Reload project to update file tree
        await fetchProject();
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Checkout failed' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error checking out:', err);
    }
    setGitLoading(false);
  };

  const openDiffView = async (filePath) => {
    try {
      const response = await fetch(`/api/code/${id}/git/file-diff?file=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      if (data.success) {
        setDiffView({ file: filePath, original: data.original, modified: data.modified });
        // Add to open files as a diff tab
        const diffName = `${filePath.split('/').pop()} (diff)`;
        const diffPath = `__diff__:${filePath}`;
        if (!openFiles.find(f => f.path === diffPath)) {
          setOpenFiles(prev => [...prev, { name: diffName, path: diffPath, isDiff: true }]);
        }
        setActiveFile(diffPath);
      }
    } catch (err) {
      console.error('Error getting diff:', err);
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================
  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/code/${id}/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Error searching:', err);
    }
    setSearchLoading(false);
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery) performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, performSearch]);

  // ============================================================
  // KEYBOARD SHORTCUTS
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveActiveFile();
      }
      // Ctrl/Cmd + P: Quick open (command palette)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowCommandPalette(true);
        setPaletteQuery('');
      }
      // Ctrl/Cmd + Shift + P: Command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCommandPalette(true);
        setPaletteQuery('>');
      }
      // Ctrl/Cmd + B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Ctrl/Cmd + W: Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeFile) closeFile(activeFile);
      }
      // Escape: Close palette
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowBranchPicker(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, saveActiveFile, closeFile]);

  // Focus palette input when opened
  useEffect(() => {
    if (showCommandPalette && paletteRef.current) {
      paletteRef.current.focus();
    }
  }, [showCommandPalette]);

  // ============================================================
  // LANGUAGE DETECTION
  // ============================================================
  const getLanguageFromPath = (filePath) => {
    const ext = filePath?.split('.').pop()?.toLowerCase();
    const languageMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
      java: 'java', c: 'c', cpp: 'cpp', h: 'c',
      css: 'css', scss: 'scss', less: 'less', html: 'html',
      json: 'json', yaml: 'yaml', yml: 'yaml', md: 'markdown',
      sql: 'sql', sh: 'shell', bash: 'shell', xml: 'xml',
      svg: 'xml', toml: 'ini', cfg: 'ini', ini: 'ini',
      dockerfile: 'dockerfile', makefile: 'makefile',
    };
    return languageMap[ext] || 'plaintext';
  };

  // ============================================================
  // SIDEBAR RESIZE
  // ============================================================
  const handleSidebarResize = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (e) => {
      const newWidth = Math.max(180, Math.min(500, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  // ============================================================
  // COMMAND PALETTE
  // ============================================================
  const allFiles = getAllFiles(fileTree);
  const paletteItems = paletteQuery.startsWith('>')
    ? [
      { label: 'Toggle Sidebar', action: () => setSidebarCollapsed(prev => !prev) },
      { label: 'Save File', action: () => saveActiveFile() },
      { label: 'Git: Stage All', action: () => gitStage(['*']) },
      { label: 'Git: Push', action: () => gitPush() },
      { label: 'Git: Pull', action: () => gitPull() },
      { label: 'Git: Fetch', action: () => gitFetch() },
      { label: 'Show Explorer', action: () => { setActiveSidebarPanel('explorer'); setSidebarCollapsed(false); } },
      { label: 'Show Search', action: () => { setActiveSidebarPanel('search'); setSidebarCollapsed(false); } },
      { label: 'Show Source Control', action: () => { setActiveSidebarPanel('git'); setSidebarCollapsed(false); } },
      { label: 'Show Git Graph', action: () => { setActiveSidebarPanel('gitlog'); setSidebarCollapsed(false); } },
    ].filter(item => item.label.toLowerCase().includes(paletteQuery.slice(1).toLowerCase()))
    : allFiles
      .filter(f => f.name.toLowerCase().includes(paletteQuery.toLowerCase()) || f.path.toLowerCase().includes(paletteQuery.toLowerCase()))
      .slice(0, 20);

  // ============================================================
  // RENDER: LOADING / ERROR
  // ============================================================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e1e1e', color: '#cccccc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1e1e1e', color: '#cccccc', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '18px', color: '#f48771' }}>Error: {error}</div>
        <button onClick={() => navigate('/code')} style={{ background: '#0e639c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          Back to Projects
        </button>
      </div>
    );
  }

  const changedFilesCount = gitStatus ? gitStatus.files?.length || 0 : 0;
  const isDiffActive = activeFile?.startsWith('__diff__:');
  const actualActiveFile = isDiffActive ? activeFile.replace('__diff__:', '') : activeFile;

  // ============================================================
  // RENDER: MAIN IDE
  // ============================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#1e1e1e', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* SAVE TOAST */}
      {saveMessage && (
        <div style={{
          position: 'fixed', top: '12px', right: '12px', zIndex: 10000,
          background: saveMessage.type === 'success' ? '#2ea043' : '#da3633',
          color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '13px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {saveMessage.text}
        </div>
      )}

      {/* COMMAND PALETTE */}
      {showCommandPalette && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '15vh' }}
          onClick={() => setShowCommandPalette(false)}>
          <div style={{ width: '500px', maxHeight: '400px', background: '#252526', border: '1px solid #454545', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}>
            <input
              ref={paletteRef}
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
              placeholder={paletteQuery.startsWith('>') ? 'Type a command...' : 'Search files by name...'}
              style={{
                width: '100%', background: '#3c3c3c', border: 'none', borderBottom: '1px solid #454545',
                color: '#cccccc', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && paletteItems.length > 0) {
                  const item = paletteItems[0];
                  if (item.action) item.action();
                  else openFile(item);
                  setShowCommandPalette(false);
                }
              }}
            />
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {paletteItems.map((item, i) => (
                <div key={i} onClick={() => { if (item.action) item.action(); else openFile(item); setShowCommandPalette(false); }}
                  style={{
                    padding: '8px 14px', cursor: 'pointer', color: '#cccccc', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #2d2d2d'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#04395e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  {item.label || (
                    <>
                      <Icon d={Icons.file} size={14} color={getFileIconColor(item.name)} />
                      <span>{item.name}</span>
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: 'auto' }}>{item.path}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BRANCH PICKER */}
      {showBranchPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '15vh' }}
          onClick={() => setShowBranchPicker(false)}>
          <div style={{ width: '400px', maxHeight: '400px', background: '#252526', border: '1px solid #454545', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #454545', fontSize: '13px', color: '#cccccc', fontWeight: 600 }}>
              Switch Branch
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {gitBranches.branches.map((b, i) => (
                <div key={i} onClick={() => !b.current && gitCheckout(b.name)}
                  style={{
                    padding: '8px 14px', cursor: b.current ? 'default' : 'pointer', color: '#cccccc', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '8px', background: b.current ? '#37373d' : 'transparent'
                  }}
                  onMouseEnter={(e) => { if (!b.current) e.currentTarget.style.background = '#04395e'; }}
                  onMouseLeave={(e) => { if (!b.current) e.currentTarget.style.background = 'transparent'; }}>
                  <Icon d={Icons.gitBranch} size={14} color={b.current ? '#569cd6' : '#888'} />
                  <span>{b.name}</span>
                  {b.current && <span style={{ color: '#569cd6', fontSize: '11px', marginLeft: 'auto' }}>current</span>}
                </div>
              ))}
              {gitBranches.remoteBranches.length > 0 && (
                <>
                  <div style={{ padding: '6px 14px', fontSize: '11px', color: '#888', textTransform: 'uppercase', borderTop: '1px solid #454545' }}>Remote Branches</div>
                  {gitBranches.remoteBranches.map((b, i) => (
                    <div key={`r-${i}`} onClick={() => gitCheckout(b.name.replace(/^origin\//, ''))}
                      style={{ padding: '8px 14px', cursor: 'pointer', color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#04395e'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <Icon d={Icons.gitBranch} size={14} color="#666" />
                      <span>{b.name}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN LAYOUT */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ACTIVITY BAR (leftmost icon strip) */}
        <div style={{
          width: '48px', background: '#333333', display: 'flex', flexDirection: 'column',
          alignItems: 'center', paddingTop: '4px', flexShrink: 0, borderRight: '1px solid #252526'
        }}>
          {[
            { id: 'explorer', icon: Icons.files, tooltip: 'Explorer (Ctrl+Shift+E)' },
            { id: 'search', icon: Icons.search, tooltip: 'Search (Ctrl+Shift+F)' },
            { id: 'git', icon: Icons.gitBranch, tooltip: 'Source Control (Ctrl+Shift+G)', badge: changedFilesCount > 0 ? changedFilesCount : null },
            { id: 'gitlog', icon: Icons.history, tooltip: 'Git Graph' },
          ].map(item => (
            <div key={item.id}
              onClick={() => {
                if (activeSidebarPanel === item.id && !sidebarCollapsed) {
                  setSidebarCollapsed(true);
                } else {
                  setActiveSidebarPanel(item.id);
                  setSidebarCollapsed(false);
                }
              }}
              title={item.tooltip}
              style={{
                width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                borderLeft: activeSidebarPanel === item.id && !sidebarCollapsed ? '2px solid #ffffff' : '2px solid transparent',
                opacity: activeSidebarPanel === item.id && !sidebarCollapsed ? 1 : 0.6,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => { if (activeSidebarPanel !== item.id || sidebarCollapsed) e.currentTarget.style.opacity = '0.6'; }}>
              <Icon d={item.icon} size={22} color="#cccccc" />
              {item.badge && (
                <span style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: '#007acc', color: 'white', fontSize: '10px',
                  minWidth: '16px', height: '16px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                }}>{item.badge}</span>
              )}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          {/* Back to projects button at bottom of activity bar */}
          <div
            onClick={() => navigate('/code')}
            title="Back to Projects"
            style={{
              width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: 0.6, marginBottom: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M8.5 1L1 8l7.5 7 .7-.7L3.4 8.5H15v-1H3.4l5.8-5.8-.7-.7z" fill="#cccccc" />
            </svg>
          </div>
        </div>

        {/* SIDEBAR PANEL */}
        {!sidebarCollapsed && (
          <>
            <div style={{
              width: `${sidebarWidth}px`, background: '#252526', display: 'flex', flexDirection: 'column',
              flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #1e1e1e'
            }}>
              {/* Sidebar Header */}
              <div style={{
                padding: '10px 16px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                color: '#bbbbbb', letterSpacing: '0.8px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexShrink: 0
              }}>
                <span>{activeSidebarPanel === 'explorer' ? 'Explorer' : activeSidebarPanel === 'search' ? 'Search' : activeSidebarPanel === 'git' ? 'Source Control' : 'Git Graph'}</span>
              </div>

              {/* EXPLORER PANEL */}
              {activeSidebarPanel === 'explorer' && (
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                  {/* Project name section header */}
                  <div style={{
                    padding: '4px 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                    color: '#cccccc', background: '#2d2d2d', display: 'flex', alignItems: 'center', gap: '6px',
                    cursor: 'pointer', userSelect: 'none'
                  }}>
                    <Icon d={Icons.chevronDown} size={10} color="#cccccc" />
                    {project?.name || id}
                  </div>
                  {fileTree.map(node => (
                    <TreeNode
                      key={node.path}
                      node={node}
                      depth={0}
                      onFileClick={openFile}
                      activeFile={actualActiveFile}
                      expandedDirs={expandedDirs}
                      toggleDir={toggleDir}
                    />
                  ))}
                </div>
              )}

              {/* SEARCH PANEL */}
              {activeSidebarPanel === 'search' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '8px', flexShrink: 0 }}>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search"
                      style={{
                        width: '100%', background: '#3c3c3c', border: '1px solid #3c3c3c', borderRadius: '4px',
                        color: '#cccccc', padding: '5px 8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#007acc'}
                      onBlur={(e) => e.target.style.borderColor = '#3c3c3c'}
                    />
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', fontSize: '13px' }}>
                    {searchLoading && <div style={{ padding: '8px 12px', color: '#888' }}>Searching...</div>}
                    {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div style={{ padding: '8px 12px', color: '#888' }}>No results found</div>
                    )}
                    {searchResults.map((result, i) => (
                      <div key={i}
                        onClick={() => openFile({ name: result.file.split('/').pop(), path: result.file, type: 'file' })}
                        style={{
                          padding: '4px 12px', cursor: 'pointer', color: '#cccccc',
                          borderBottom: '1px solid #2d2d2d'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Icon d={Icons.file} size={12} color={getFileIconColor(result.file)} />
                          <span style={{ fontSize: '12px' }}>{result.file.split('/').pop()}</span>
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: 'auto' }}>:{result.line}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', paddingLeft: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {result.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOURCE CONTROL PANEL */}
              {activeSidebarPanel === 'git' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {!gitStatus?.isRepo ? (
                    <div style={{ padding: '16px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                      Not a git repository
                    </div>
                  ) : (
                    <>
                      {/* Commit input */}
                      <div style={{ padding: '8px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Message (press Enter to commit)"
                            style={{
                              flex: 1, background: '#3c3c3c', border: '1px solid #3c3c3c', borderRadius: '4px',
                              color: '#cccccc', padding: '5px 8px', fontSize: '13px', outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#007acc'}
                            onBlur={(e) => e.target.style.borderColor = '#3c3c3c'}
                            onKeyDown={(e) => { if (e.key === 'Enter') gitCommit(); }}
                          />
                        </div>
                        <button
                          onClick={gitCommit}
                          disabled={!commitMessage.trim() || gitLoading}
                          style={{
                            width: '100%', marginTop: '6px', background: commitMessage.trim() ? '#0e639c' : '#3c3c3c',
                            border: 'none', borderRadius: '4px', color: 'white', padding: '5px 12px',
                            fontSize: '13px', cursor: commitMessage.trim() ? 'pointer' : 'default',
                            opacity: commitMessage.trim() ? 1 : 0.5
                          }}>
                          <Icon d={Icons.check} size={14} color="white" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                          Commit
                        </button>
                      </div>

                      {/* Git action buttons */}
                      <div style={{ display: 'flex', padding: '0 8px 8px', gap: '4px', flexShrink: 0 }}>
                        <button onClick={gitPush} title="Push" disabled={gitLoading}
                          style={{ flex: 1, background: '#3c3c3c', border: 'none', borderRadius: '4px', color: '#cccccc', padding: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Icon d={Icons.arrowUp} size={12} /> Push {gitStatus?.ahead > 0 && `(${gitStatus.ahead})`}
                        </button>
                        <button onClick={gitPull} title="Pull" disabled={gitLoading}
                          style={{ flex: 1, background: '#3c3c3c', border: 'none', borderRadius: '4px', color: '#cccccc', padding: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Icon d={Icons.arrowDown} size={12} /> Pull {gitStatus?.behind > 0 && `(${gitStatus.behind})`}
                        </button>
                        <button onClick={gitFetch} title="Fetch" disabled={gitLoading}
                          style={{ flex: 1, background: '#3c3c3c', border: 'none', borderRadius: '4px', color: '#cccccc', padding: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Icon d={Icons.refresh} size={12} /> Fetch
                        </button>
                      </div>

                      {/* View mode toggle */}
                      <div style={{ display: 'flex', padding: '0 8px 6px', gap: '2px', flexShrink: 0, justifyContent: 'flex-end' }}>
                        <button onClick={() => setScmViewMode('list')} title="View as List"
                          style={{
                            background: scmViewMode === 'list' ? '#454545' : 'transparent', border: 'none', borderRadius: '3px',
                            cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center'
                          }}>
                          <Icon d={Icons.listView} size={14} color={scmViewMode === 'list' ? '#ffffff' : '#888'} />
                        </button>
                        <button onClick={() => {
                          setScmViewMode('tree');
                          // Auto-expand all directories in the tree on first switch
                          const allFiles = [...(gitStatus?.staged || []), ...(gitStatus?.unstaged || []), ...(gitStatus?.untracked || [])];
                          const dirs = new Set();
                          allFiles.forEach(f => {
                            const parts = f.path.split('/');
                            for (let i = 1; i < parts.length; i++) {
                              dirs.add(parts.slice(0, i).join('/'));
                            }
                          });
                          setExpandedScmDirs(prev => new Set([...prev, ...dirs]));
                        }} title="View as Tree"
                          style={{
                            background: scmViewMode === 'tree' ? '#454545' : 'transparent', border: 'none', borderRadius: '3px',
                            cursor: 'pointer', padding: '3px 5px', display: 'flex', alignItems: 'center'
                          }}>
                          <Icon d={Icons.treeView} size={14} color={scmViewMode === 'tree' ? '#ffffff' : '#888'} />
                        </button>
                      </div>

                      {/* Changed files (list or tree) */}
                      <div style={{ flex: 1, overflowY: 'auto' }}>
                        {/* Staged Changes */}
                        {gitStatus?.staged?.length > 0 && (
                          <>
                            <div style={{
                              padding: '4px 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                              color: '#cccccc', background: '#2d2d2d', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon d={Icons.chevronDown} size={10} color="#cccccc" />
                                Staged Changes
                                <span style={{ background: '#454545', borderRadius: '8px', padding: '0 6px', fontSize: '10px' }}>{gitStatus.staged.length}</span>
                              </div>
                              <button onClick={() => gitUnstage(gitStatus.staged.map(f => f.path))} title="Unstage All"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                <Icon d={Icons.minus} size={14} color="#cccccc" />
                              </button>
                            </div>
                            {scmViewMode === 'tree' ? (
                              buildChangeTree(gitStatus.staged).map(node => (
                                <GitChangeTreeNode
                                  key={node.path}
                                  node={node}
                                  depth={0}
                                  onFileClick={(filePath) => openDiffView(filePath)}
                                  onUnstage={gitUnstage}
                                  isStaged={true}
                                  expandedScmDirs={expandedScmDirs}
                                  toggleScmDir={toggleScmDir}
                                />
                              ))
                            ) : (
                              gitStatus.staged.map((file, i) => (
                                <div key={`s-${i}`} style={{
                                  display: 'flex', alignItems: 'center', padding: '2px 8px 2px 24px',
                                  fontSize: '13px', cursor: 'pointer', color: getStatusColor(file.status)
                                }}
                                  onClick={() => openDiffView(file.path)}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.path.split('/').pop()}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#888', marginRight: '8px' }}>
                                    {file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : ''}
                                  </span>
                                  <button onClick={(e) => { e.stopPropagation(); gitUnstage([file.path]); }} title="Unstage"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                    <Icon d={Icons.minus} size={12} color="#cccccc" />
                                  </button>
                                  <span style={{ width: '14px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                                    {getStatusLetter(file.status)}
                                  </span>
                                </div>
                              ))
                            )}
                          </>
                        )}

                        {/* Changes (unstaged + untracked) */}
                        {(gitStatus?.unstaged?.length > 0 || gitStatus?.untracked?.length > 0) && (() => {
                          const allChanges = [...(gitStatus?.unstaged || []), ...(gitStatus?.untracked || [])];
                          return (
                            <>
                              <div style={{
                                padding: '4px 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                                color: '#cccccc', background: '#2d2d2d', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Icon d={Icons.chevronDown} size={10} color="#cccccc" />
                                  Changes
                                  <span style={{ background: '#454545', borderRadius: '8px', padding: '0 6px', fontSize: '10px' }}>
                                    {allChanges.length}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  <button onClick={() => gitStage(['*'])} title="Stage All"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                    <Icon d={Icons.add} size={14} color="#cccccc" />
                                  </button>
                                </div>
                              </div>
                              {scmViewMode === 'tree' ? (
                                buildChangeTree(allChanges).map(node => (
                                  <GitChangeTreeNode
                                    key={node.path}
                                    node={node}
                                    depth={0}
                                    onFileClick={(filePath) => openDiffView(filePath)}
                                    onStage={gitStage}
                                    onDiscard={gitDiscard}
                                    isStaged={false}
                                    expandedScmDirs={expandedScmDirs}
                                    toggleScmDir={toggleScmDir}
                                  />
                                ))
                              ) : (
                                allChanges.map((file, i) => (
                                  <div key={`u-${i}`} style={{
                                    display: 'flex', alignItems: 'center', padding: '2px 8px 2px 24px',
                                    fontSize: '13px', cursor: 'pointer', color: getStatusColor(file.status)
                                  }}
                                    onClick={() => openDiffView(file.path)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {file.path.split('/').pop()}
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#888', marginRight: '8px' }}>
                                      {file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : ''}
                                    </span>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                      {file.status !== 'untracked' && (
                                        <button onClick={(e) => { e.stopPropagation(); gitDiscard([file.path]); }} title="Discard Changes"
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                          <Icon d={Icons.discard} size={12} color="#cccccc" />
                                        </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); gitStage([file.path]); }} title="Stage"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                        <Icon d={Icons.add} size={12} color="#cccccc" />
                                      </button>
                                    </div>
                                    <span style={{ width: '14px', textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                                      {getStatusLetter(file.status)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </>
                          );
                        })()}

                        {changedFilesCount === 0 && (
                          <div style={{ padding: '16px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
                            No changes detected
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* GIT GRAPH / LOG PANEL */}
              {activeSidebarPanel === 'gitlog' && (
                <div style={{ flex: 1, overflowY: 'auto', fontSize: '13px' }}>
                  {/* Branch info */}
                  <div style={{
                    padding: '8px 12px', borderBottom: '1px solid #3c3c3c', display: 'flex',
                    alignItems: 'center', gap: '8px', flexShrink: 0
                  }}>
                    <Icon d={Icons.gitBranch} size={14} color="#569cd6" />
                    <span style={{ color: '#569cd6', fontWeight: 600 }}>{gitStatus?.branch || 'main'}</span>
                    {gitStatus?.ahead > 0 && <span style={{ color: '#73c991', fontSize: '11px' }}>↑{gitStatus.ahead}</span>}
                    {gitStatus?.behind > 0 && <span style={{ color: '#e2c08d', fontSize: '11px' }}>↓{gitStatus.behind}</span>}
                  </div>

                  {/* Commit list */}
                  {gitLog.map((commit, i) => (
                    <div key={commit.hash} style={{
                      padding: '8px 12px', borderBottom: '1px solid #2d2d2d', cursor: 'pointer'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      {/* Graph line */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {/* Simple graph dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '16px' }}>
                          {i > 0 && <div style={{ width: '2px', height: '4px', background: '#454545' }} />}
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: i === 0 ? '#569cd6' : commit.refs.length > 0 ? '#73c991' : '#454545',
                            border: `2px solid ${i === 0 ? '#569cd6' : commit.refs.length > 0 ? '#73c991' : '#666'}`,
                            flexShrink: 0
                          }} />
                          {i < gitLog.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '20px', background: '#454545' }} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Refs/tags */}
                          {commit.refs.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '2px' }}>
                              {commit.refs.map((ref, j) => (
                                <span key={j} style={{
                                  fontSize: '10px', padding: '0 5px', borderRadius: '3px',
                                  background: ref.includes('HEAD') ? '#569cd6' : ref.includes('origin') ? '#388a34' : '#6f42c1',
                                  color: 'white', fontWeight: 600
                                }}>{ref.replace('HEAD -> ', '')}</span>
                              ))}
                            </div>
                          )}
                          {/* Commit message */}
                          <div style={{ color: '#cccccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {commit.message}
                          </div>
                          {/* Author & date */}
                          <div style={{ display: 'flex', gap: '8px', color: '#888', fontSize: '11px', marginTop: '2px' }}>
                            <span>{commit.author}</span>
                            <span>{new Date(commit.date).toLocaleDateString()} {new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: '#666' }}>{commit.shortHash}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {gitLog.length === 0 && (
                    <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>No commits found</div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Resize Handle */}
            <div
              onMouseDown={handleSidebarResize}
              style={{
                width: '4px', cursor: 'ew-resize', background: 'transparent', flexShrink: 0,
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#007acc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            />
          </>
        )}

        {/* ============================================================ */}
        {/* EDITOR AREA */}
        {/* ============================================================ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* TAB BAR */}
          <div style={{
            display: 'flex', background: '#252526', minHeight: '35px', flexShrink: 0,
            overflowX: 'auto', scrollbarWidth: 'none'
          }}>
            {openFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => {
                  setActiveFile(file.path);
                  if (file.isDiff) {
                    // Re-fetch diff data if needed
                    const realPath = file.path.replace('__diff__:', '');
                    openDiffView(realPath);
                  } else {
                    setDiffView(null);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', padding: '0 4px 0 12px', height: '35px',
                  cursor: 'pointer', borderRight: '1px solid #1e1e1e', fontSize: '13px',
                  whiteSpace: 'nowrap', gap: '6px', minWidth: 0,
                  background: activeFile === file.path ? '#1e1e1e' : '#2d2d2d',
                  color: activeFile === file.path ? '#ffffff' : '#969696',
                  borderTop: activeFile === file.path ? '1px solid #007acc' : '1px solid transparent',
                }}
                onMouseEnter={(e) => { if (activeFile !== file.path) e.currentTarget.style.background = '#2d2d2d'; }}
                onMouseLeave={(e) => { if (activeFile !== file.path) e.currentTarget.style.background = '#2d2d2d'; }}>
                {file.isDiff ? (
                  <Icon d={Icons.diffModified} size={14} color="#e2c08d" />
                ) : (
                  <Icon d={Icons.file} size={14} color={getFileIconColor(file.name)} />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                {modifiedFiles.has(file.path) && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', flexShrink: 0 }} />
                )}
                <button
                  onClick={(e) => closeFile(file.path, e)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#969696', borderRadius: '3px', flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#969696'; }}>
                  <Icon d={Icons.close} size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* BREADCRUMB BAR */}
          {activeFile && !isDiffActive && (
            <div style={{
              padding: '4px 12px', background: '#1e1e1e', borderBottom: '1px solid #2d2d2d',
              fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0
            }}>
              {actualActiveFile.split('/').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {i > 0 && <Icon d={Icons.chevronRight} size={10} color="#666" />}
                  <span style={{ color: i === arr.length - 1 ? '#cccccc' : '#888' }}>{part}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* EDITOR / DIFF VIEWER / WELCOME */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {isDiffActive && diffView ? (
              <DiffEditor
                height="100%"
                language={getLanguageFromPath(diffView.file)}
                original={diffView.original}
                modified={diffView.modified}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: '"Fira Code", "JetBrains Mono", Monaco, Menlo, monospace',
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : activeFile && !isDiffActive ? (
              <Editor
                height="100%"
                language={getLanguageFromPath(activeFile)}
                value={fileContents[activeFile] || ''}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: '"Fira Code", "JetBrains Mono", Monaco, Menlo, monospace',
                  fontLigatures: true,
                  minimap: { enabled: true, maxColumn: 80 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'off',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  padding: { top: 8 },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            ) : (
              /* WELCOME SCREEN */
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
                flexDirection: 'column', gap: '20px', color: '#6e6e6e', userSelect: 'none'
              }}>
                <div style={{ fontSize: '52px', opacity: 0.15, fontWeight: 200 }}>
                  {'</>'}
                </div>
                <div style={{ fontSize: '16px', color: '#555' }}>{project?.name || 'Code Editor'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '13px' }}>
                  <div><span style={{ color: '#888' }}>Open File</span> <span style={{ color: '#569cd6', background: '#2d2d2d', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>Ctrl+P</span></div>
                  <div><span style={{ color: '#888' }}>Command Palette</span> <span style={{ color: '#569cd6', background: '#2d2d2d', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>Ctrl+Shift+P</span></div>
                  <div><span style={{ color: '#888' }}>Toggle Sidebar</span> <span style={{ color: '#569cd6', background: '#2d2d2d', padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>Ctrl+B</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* STATUS BAR */}
      {/* ============================================================ */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 8px', height: '22px',
        background: '#007acc', color: '#ffffff', fontSize: '12px', flexShrink: 0, gap: '2px'
      }}>
        {/* Left side: Branch */}
        {gitStatus?.isRepo && (
          <div onClick={() => setShowBranchPicker(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 6px', height: '100%' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <Icon d={Icons.gitBranch} size={12} color="white" />
            <span>{gitStatus.branch}</span>
            {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
              <span style={{ fontSize: '11px' }}>
                {gitStatus.ahead > 0 && `↑${gitStatus.ahead}`}
                {gitStatus.behind > 0 && `↓${gitStatus.behind}`}
              </span>
            )}
          </div>
        )}

        {/* Sync button */}
        {gitStatus?.isRepo && (
          <div onClick={() => { gitPull(); gitPush(); }}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 4px', height: '100%' }}
            title="Synchronize Changes"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <Icon d={Icons.refresh} size={12} color="white" />
          </div>
        )}

        {/* Errors/warnings placeholder */}
        {changedFilesCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 6px' }}>
            <Icon d={Icons.diffModified} size={10} color="white" />
            <span>{changedFilesCount} changed</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Right side: File info */}
        {activeFile && !isDiffActive && (
          <>
            <div style={{ padding: '0 6px' }}>
              Ln {editorRef.current?.getPosition()?.lineNumber || 1}, Col {editorRef.current?.getPosition()?.column || 1}
            </div>
            <div style={{ padding: '0 6px' }}>{getLanguageFromPath(activeFile)}</div>
            <div style={{ padding: '0 6px' }}>UTF-8</div>
          </>
        )}

        {/* Modified files indicator */}
        {modifiedFiles.size > 0 && (
          <div onClick={() => { for (const f of modifiedFiles) saveFile(f); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 6px' }}
            title="Save All"
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />
            {modifiedFiles.size} unsaved
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDetail;
