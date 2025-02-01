import {useMemo} from 'react';
import {FileEntry, FileTreeNode, createFileTree} from '../shared/types';
import './FileExplorerPane.css';
import {FileTreeView} from './FileTreeView';

interface FileExplorerPaneProps {
  availableFiles: FileEntry[];
  activeFile?: string;
  gameDirectory: string;
  onFileClick: (file: FileEntry) => void;
  onFileSelect: () => void;
  onDirectorySelect: () => void;
}

export const FileExplorerPane: React.FC<FileExplorerPaneProps> = ({
  availableFiles,
  activeFile,
  gameDirectory,
  onFileClick,
  onFileSelect,
  onDirectorySelect,
}) => {
  const handleTreeNodeClick = (node: FileTreeNode) => {
    if (node.type === 'directory') return;
    onFileClick({
      path: node.path,
      relativePath: node.name,
      type: node.type as 'fab' | 'image',
    });
  };

  const availableFileNodes = useMemo(
    () => createFileTree(availableFiles),
    [availableFiles]
  );

  return (
    <div className="file-explorer-pane">
      <h2 className="title">Files</h2>
      <ul className="file-list">
        <FileTreeView
          nodes={availableFileNodes}
          onFileClick={handleTreeNodeClick}
          activeFile={activeFile}
        />
      </ul>

      <div className="open-file">
        <button
          onClick={onFileSelect}
          title="Open and add a file to the tile list. (Image import incomplete)"
        >
          Open/Import File (WIP)
        </button>
      </div>

      <div className="game-directory" title={gameDirectory}>
        <small>
          Base Directory: <strong>{gameDirectory}</strong>
        </small>
      </div>
      <button
        onClick={onDirectorySelect}
        className="change-directory"
        title="Select a new game directory. Should be the renderer folder, with data and gfx folders."
      >
        <div>Choose Base Directory</div>
      </button>
    </div>
  );
};
