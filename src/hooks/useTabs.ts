import {useCallback, useState} from 'react';
import type {FabData, TabData, UiNode} from '../shared/types';
import type {ImagePropsRef} from '../utils/Renderer';
import {SkeleNode} from '../utils/SkeleNode';

const deduper = (props: ImagePropsRef) => props;

const renderSkele = (skele: SkeleNode) => ({
  renderedInfo: skele
    ? skele.render(1, deduper).filter(i => i.node.id !== skele.id)
    : [],
  renderedNodes: skele
    ? Array.from(skele.walk()).filter(i => i.id !== skele.id)
    : [],
});

let atomicCounter = 0;

const createEmptyTab = (
  defaultSkele?: SkeleNode,
  fabData?: FabData,
  filePath?: string
) => {
  const skele =
    defaultSkele ??
    SkeleNode.fromData({
      angle: 0,
      mag: 1,
      children: [{angle: 0, mag: 0}],
      id: `#ROOT_${++atomicCounter}`,
    });

  return {
    ...renderSkele(skele),
    name: fabData?.name ?? 'Untitled',
    description: fabData?.description ?? '',
    skele,
    isModified: false,
    rotation: 270, // Add default rotation
    filePath,
    fabData,
  };
};

export function useTabs() {
  const [tabs, setTabs] = useState<TabData[]>(() => [createEmptyTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].skele.id);

  const updateTab = useCallback(
    (base: SkeleNode, filePath?: string, fabData?: FabData) => {
      setTabs(current => {
        // First try to find tab by ID
        const existingTab = current.find(tab => tab.skele.id === base.id);
        if (existingTab) {
          return current.map(tab =>
            tab === existingTab
              ? {
                  ...tab,
                  ...renderSkele(base),
                  skele: base,
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
                    ...renderSkele(base),
                    skele: base,
                    isModified: true,
                  }
                : tab
            );
          }

          // Check for an open empty tab to use
          const emptyTab = current.find(
            tab => !tab.filePath && !tab.isModified
          );
          if (emptyTab) {
            return current.map(tab =>
              tab === emptyTab ? createEmptyTab(base, fabData, filePath) : tab
            );
          }
        }

        // Create new tab as last resort
        return [
          ...current,
          {
            ...createEmptyTab(base, fabData),
            filePath,
          },
        ];
      });

      setActiveTabId(base.id);
    },
    []
  );

  const addNewTab = useCallback(
    (skele: SkeleNode) => {
      const newTab = createEmptyTab(skele);
      setTabs(current => [...current, newTab]);
      setActiveTabId(newTab.skele.id);
    },
    [createEmptyTab]
  );

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

  const setRotation = useCallback((tabId: string, degrees: number) => {
    setTabs(current =>
      current.map(tab =>
        tab.skele.id === tabId ? {...tab, rotation: degrees} : tab
      )
    );
  }, []);

  const setActiveNode = useCallback((tabId: string, node?: UiNode) => {
    setTabs(current =>
      current.map(tab =>
        tab.skele.id === tabId
          ? {
              ...tab,
              activeNode: node,
              lastActiveNode: tab.activeNode,
            }
          : tab
      )
    );
  }, []);

  const setLastActiveNode = useCallback((tabId: string, node?: UiNode) => {
    setTabs(current =>
      current.map(tab =>
        tab.skele.id === tabId
          ? {
              ...tab,
              lastActiveNode: node,
            }
          : tab
      )
    );
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
    setRotation, // Add new rotation setter
    setActiveNode,
    setLastActiveNode,
  };
}
