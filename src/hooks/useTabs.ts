import {useState, useCallback} from 'react';
import type {TabData} from '../shared/types';
import {SkeleNode} from '../utils/SkeleNode';
import type {ImagePropsRef} from '../utils/Renderer';

const deduper = (props: ImagePropsRef) => props;

const createEmptyTab = () => {
  const skele = SkeleNode.fromData({
    angle: 0,
    mag: 1,
    children: [{angle: 0, mag: 0}],
    id: SkeleNode.randomLetters(), // Explicitly set a new ID
  });
  const renderedInfo = skele.render(1, deduper).slice(1);
  const renderedNodes = Array.from(skele.walk()).slice(1);
  return {
    name: 'Untitled',
    description: '',
    skele,
    renderedInfo,
    renderedNodes,
    isModified: false,
  };
};

export function useTabs() {
  const [tabs, setTabs] = useState<TabData[]>(() => [createEmptyTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].skele.id);

  const updateTab = useCallback((base: SkeleNode, filePath?: string) => {
    setTabs(current => {
      // First try to find tab by ID
      const existingTab = current.find(tab => tab.skele.id === base.id);
      if (existingTab) {
        const newRenderedInfo = base.render(1, deduper).slice(1);
        const newRenderedNodes = Array.from(base.walk()).slice(1);

        return current.map(tab =>
          tab === existingTab
            ? {
                ...tab,
                skele: base,
                renderedInfo: newRenderedInfo,
                renderedNodes: newRenderedNodes,
                isModified: true,
              }
            : tab
        );
      }

      // If loading a file, check for existing file path
      if (filePath) {
        const fileTab = current.find(tab => tab.filePath === filePath);
        if (fileTab) {
          return current.map(tab =>
            tab === fileTab
              ? {
                  ...tab,
                  skele: base,
                  isModified: false,
                  renderedInfo: base.render(1, deduper).slice(1),
                  renderedNodes: Array.from(base.walk()).slice(1),
                }
              : tab
          );
        }
      }

      // Create new tab as last resort
      return [
        ...current,
        {
          name: filePath ? filePath.split('/').pop() : 'Untitled',
          description: '',
          skele: base,
          filePath,
          renderedInfo: base.render(1, deduper).slice(1),
          renderedNodes: Array.from(base.walk()).slice(1),
          isModified: false,
        },
      ];
    });

    setActiveTabId(base.id);
  }, []);

  const addNewTab = useCallback(() => {
    const newTab = createEmptyTab();
    setTabs(current => [...current, newTab]);
    setActiveTabId(newTab.skele.id);
  }, [createEmptyTab]);

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs(current => {
        const newTabs = current.filter(tab => tab.skele.id !== tabId);
        if (newTabs.length === 0) {
          const newTab = createEmptyTab();
          setActiveTabId(newTab.skele.id);
          return [newTab];
        }
        if (activeTabId === tabId) {
          setActiveTabId(newTabs[0].skele.id);
        }
        return newTabs;
      });
    },
    [activeTabId, createEmptyTab]
  );

  const selectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const activeTab = tabs.find(tab => tab.skele.id === activeTabId);

  return {
    tabs,
    activeTab,
    activeTabId,
    updateTab,
    addNewTab,
    closeTab,
    selectTab,
    setActiveTabId,
    setTabs,
  };
}
