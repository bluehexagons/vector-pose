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

  const handleWheel = useCallback((e: React.WheelEvent<HTMLUListElement>) => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    // Prevent vertical scrolling if this is a horizontal scroll gesture
    if (e.deltaX !== 0) {
      e.preventDefault();
      return;
    }

    // Handle regular mouse wheel - convert vertical to horizontal scroll
    // Use shift + wheel for horizontal scroll (standard browser behavior)
    const delta = e.shiftKey ? e.deltaY : e.deltaX;

    // If device supports horizontal scroll (like touchpad), use it directly
    const scrollDelta = delta || e.deltaY;

    tabList.scrollBy({
      left: scrollDelta,
      behavior: e.deltaMode === 1 ? 'smooth' : 'auto', // Use smooth scrolling for line-based delta
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
      <ul ref={tabListRef} onWheel={handleWheel}>
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
