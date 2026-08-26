import {useMemo, useState} from 'react';
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
  onBrowserWorkspaceReset: () => void;
  browserWorkspace?: boolean;
}

export const FileExplorerPane: React.FC<FileExplorerPaneProps> = ({
  availableFiles,
  activeFile,
  gameDirectory,
  onFileClick,
  onFileSelect,
  onDirectorySelect,
  onBrowserWorkspaceReset,
  browserWorkspace = false,
}) => {
  const [search, setSearch] = useState('');
  const handleTreeNodeClick = (node: FileTreeNode) => {
    if (node.type === 'directory') return;
    onFileClick({
      path: node.path,
      relativePath: node.name,
      type: node.type as 'fab' | 'image',
    });
  };

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? availableFiles.filter(file =>
          file.relativePath.toLocaleLowerCase().includes(query)
        )
      : availableFiles;
  }, [availableFiles, search]);

  const availableFileNodes = useMemo(
    () => createFileTree(filteredFiles),
    [filteredFiles]
  );

  return (
    <div className="file-explorer-pane">
      <div className="file-explorer-header">
        <h2>Files</h2>
        <span title={`${availableFiles.length} files`}>
          {filteredFiles.length}
          {filteredFiles.length !== availableFiles.length &&
            ` / ${availableFiles.length}`}
        </span>
      </div>
      <div className="file-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={search}
          placeholder="Filter files…"
          aria-label="Filter files"
          onChange={event => setSearch(event.target.value)}
        />
        {search && (
          <button
            type="button"
            aria-label="Clear file filter"
            title="Clear filter"
            onClick={() => setSearch('')}
          >
            ×
          </button>
        )}
      </div>
      <div className="file-list">
        {availableFileNodes.length > 0 ? (
          <FileTreeView
            nodes={availableFileNodes}
            onFileClick={handleTreeNodeClick}
            activeFile={activeFile}
            expandAll={Boolean(search.trim())}
          />
        ) : (
          <div className="file-empty-state">
            <span aria-hidden="true">{search ? '⌕' : '◇'}</span>
            <strong>
              {search ? 'No matching files' : 'No files here yet'}
            </strong>
            <small>
              {search
                ? 'Try a shorter name or clear the filter.'
                : browserWorkspace
                  ? 'Import a project or image to get started.'
                  : 'Choose a workspace or add a project file.'}
            </small>
          </div>
        )}
      </div>

      <div className="file-explorer-actions">
        <button
          type="button"
          onClick={onFileSelect}
          title={
            browserWorkspace
              ? 'Copy prefab and image files into this browser workspace.'
              : 'Add prefab and image files to this workspace.'
          }
        >
          {browserWorkspace ? 'Import files…' : 'Add files…'}
        </button>
        {!browserWorkspace && (
          <button
            type="button"
            onClick={onDirectorySelect}
            title="Choose a workspace containing data/fabs and gfx folders."
          >
            Change workspace…
          </button>
        )}
        {browserWorkspace && (
          <button
            type="button"
            className="file-explorer-reset"
            onClick={onBrowserWorkspaceReset}
            title="Remove imported and saved browser files, then restore the bundled examples."
          >
            Clear browser data…
          </button>
        )}
        <div className="game-directory" title={gameDirectory}>
          <span aria-hidden="true">{browserWorkspace ? '◉' : '⌑'}</span>
          <small>
            {browserWorkspace ? (
              <>Stored privately in this browser</>
            ) : (
              <>{gameDirectory}</>
            )}
          </small>
        </div>
      </div>
    </div>
  );
};
