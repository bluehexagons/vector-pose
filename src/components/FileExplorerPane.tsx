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

  return (
    <div className="file-explorer-pane">
      <h2 className="title">Files</h2>
      <ul className="file-list">
        <FileTreeView
          nodes={createFileTree(availableFiles)}
          onFileClick={handleTreeNodeClick}
          activeFile={activeFile}
        />
      </ul>

      <div className="row">
        <button onClick={onFileSelect}>Add Files</button>
      </div>

      <button onClick={onDirectorySelect}>
        Change Directory (currently: {gameDirectory})
      </button>
    </div>
  );
};
