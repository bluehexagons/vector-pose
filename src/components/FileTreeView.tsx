import React from 'react';
import {FileTreeNode} from '../shared/types';

interface FileTreeViewProps {
  nodes: FileTreeNode[];
  level?: number;
  onFileClick: (file: FileTreeNode) => void;
  activeFile?: string;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({
  nodes,
  level = 0,
  onFileClick,
  activeFile,
}) => {
  const indent = level * 16;

  // Sort nodes: directories first, then by name
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {sortedNodes.map(node => (
        <React.Fragment key={node.path}>
          {node.type === 'directory' ? (
            <>
              <h3 style={{marginLeft: indent}}>📁 {node.name}</h3>
              <FileTreeView
                nodes={node.children}
                level={level + 1}
                onFileClick={onFileClick}
                activeFile={activeFile}
              />
            </>
          ) : (
            <li
              className={`file-list-item ${
                activeFile === node.path ? 'selected' : ''
              }`}
              style={{paddingLeft: indent + 8}}
              onClick={() => onFileClick(node)}
            >
              <span className={`file-type-${node.type}`}>{node.name}</span>
            </li>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
