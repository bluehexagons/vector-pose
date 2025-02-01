import React, {useCallback, useRef} from 'react';
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
  const tabListRef = useRef<HTMLUListElement>(null);

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    const scrollAmount = tabList.clientWidth * 0.8; // Scroll 80% of visible width
    const targetScroll =
      tabList.scrollLeft +
      (direction === 'left' ? -scrollAmount : scrollAmount);

    // Ensure smooth scrolling behavior
    tabList.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div className="tab-pane">
      <button
        className="tab-scroll-button left"
        onClick={() => scrollTabs('left')}
        title="Scroll left"
      >
        ‹
      </button>
      <ul ref={tabListRef}>
        {tabs.map(tab => (
          <li
            key={tab.skele.id}
            className={`tab ${tab.skele.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.skele.id)}
            title={tab.filePath ? `${tab.name} (${tab.filePath})` : tab.name}
          >
            <span className="tab-name">
              {tab.name}
              {tab?.isModified && (
                <span
                  style={{color: 'var(--text-muted)'}}
                  title="This object has been modified."
                >
                  *
                </span>
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
      <button
        className="tab-scroll-button right"
        onClick={() => scrollTabs('right')}
        title="Scroll right"
      >
        ›
      </button>
      <button className="new-tab" onClick={onNewTab}>
        +
      </button>
    </div>
  );
};
