import React, {useState, useEffect} from 'react';
import {FileTreeNode} from '../shared/types';
import './FileTreeView.css';

interface FileTreeViewProps {
  nodes: FileTreeNode[];
  onFileClick: (file: FileTreeNode) => void;
  activeFile?: string;
  level?: number;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  nodes,
  onFileClick,
  activeFile,
  level = 0,
}) => {
  const [expandedDirs, setExpandedDirs] = useState<{[key: string]: boolean}>(
    {}
  );

  // Debug logging to verify tree structure
  useEffect(() => {
    console.log('FileTreeView nodes:', nodes);
  }, [nodes]);

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="file-tree-list">
      {sortedNodes.map(node => (
        <div key={node.path}>
          {node.type === 'directory' ? (
            <>
              <div
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
                  {expandedDirs[node.path] ? '📂' : '📁'}
                </span>
                {node.name}
              </div>
              {expandedDirs[node.path] && node.children.length > 0 && (
                <FileTreeView
                  nodes={node.children}
                  onFileClick={onFileClick}
                  activeFile={activeFile}
                  level={level + 1}
                />
              )}
            </>
          ) : (
            <div
              className={`tree-item file ${
                activeFile === node.path ? 'selected' : ''
              }`}
              style={{paddingLeft: `${level * 20 + 20}px`}}
              onClick={() => onFileClick(node)}
            >
              <span className={`file-icon file-type-${node.type}`} />
              {node.name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
