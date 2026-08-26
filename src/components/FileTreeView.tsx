import React, {useState} from 'react';
import {FileTreeNode} from '../shared/types';
import './FileTreeView.css';

interface FileTreeViewProps {
  nodes: FileTreeNode[];
  onFileClick: (file: FileTreeNode) => void;
  activeFile?: string;
  level?: number;
  expandAll?: boolean;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  nodes,
  onFileClick,
  activeFile,
  level = 0,
  expandAll = false,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<{[key: string]: boolean}>(
    {}
  );

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="file-tree-list">
      {sortedNodes.map(node => (
        <div key={node.path} title={node.path}>
          {node.type === 'directory' ? (
            <>
              <button
                type="button"
                className="tree-item directory"
                style={{paddingLeft: `${level * 20}px`}}
                onClick={() =>
                  setExpandedDirs(prev => ({
                    ...prev,
                    [node.path]: !prev[node.path],
                  }))
                }
              >
                <span className="folder-icon">
                  {expandAll || expandedDirs[node.path] ? '📂' : '📁'}
                </span>
                {node.name}
              </button>
              {(expandAll || expandedDirs[node.path]) &&
                node.children.length > 0 && (
                  <FileTreeView
                    nodes={node.children}
                    onFileClick={onFileClick}
                    activeFile={activeFile}
                    level={level + 1}
                    expandAll={expandAll}
                  />
                )}
            </>
          ) : (
            <button
              type="button"
              className={`tree-item file ${
                activeFile === node.path ? 'selected' : ''
              }`}
              style={{paddingLeft: `${level * 20 + 20}px`}}
              onClick={() => onFileClick(node)}
            >
              <span className={`file-icon file-type-${node.type}`} />
              <span className="file-name">{node.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
