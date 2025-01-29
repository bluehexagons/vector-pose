import React from 'react';
import {TabData} from '../shared/types';
import './TabPane.css';

interface TabPaneProps {
  tabs: TabData[];
  activeTabId: string;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onSelectTab: (id: string) => void;
}

export const TabPane: React.FC<TabPaneProps> = ({
  tabs,
  activeTabId,
  onNewTab,
  onCloseTab,
  onSelectTab,
}) => {
  return (
    <div className="tab-pane">
      <ul>
        {tabs.map(tab => (
          <li
            key={tab.skele.id}
            className={`tab ${tab.skele.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.skele.id)}
          >
            <span className="tab-name">
              {tab.name}
              {tab?.isModified && (
                <span title="This tab has been modified.">*</span>
              )}
            </span>
            <button
              className="tab-close"
              onClick={e => {
                e.stopPropagation();
                onCloseTab(tab.skele.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button className="new-tab" onClick={onNewTab}>
        +
      </button>
    </div>
  );
};
