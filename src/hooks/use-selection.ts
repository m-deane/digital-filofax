import { useCallback, useState, useEffect } from "react";

export interface UseSelectionOptions<T> {
  items: T[];
  getId: (item: T) => string;
}

export interface UseSelectionReturn {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string, shiftKey?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  hasSelection: boolean;
  selectedCount: number;
  allSelected: boolean;
  getSelectedIds: () => string[];
}

export function useSelection<T>({ items, getId }: UseSelectionOptions<T>): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Clear selection when items change significantly
  useEffect(() => {
    setSelectedIds((prev) => {
      const currentIds = new Set(items.map(getId));
      const filtered = new Set(Array.from(prev).filter((id) => currentIds.has(id)));
      return filtered.size === prev.size ? prev : filtered;
    });
  }, [items, getId]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelect = useCallback(
    (id: string, shiftKey = false) => {
      const currentIndex = items.findIndex((item) => getId(item) === id);

      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        // Handle shift+click for range selection
        if (shiftKey && lastSelectedIndex !== null && currentIndex !== -1) {
          const start = Math.min(lastSelectedIndex, currentIndex);
          const end = Math.max(lastSelectedIndex, currentIndex);

          // Select all items in range
          for (let i = start; i <= end; i++) {
            if (items[i]) {
              newSet.add(getId(items[i]));
            }
          }
        } else {
          // Normal toggle
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
        }

        return newSet;
      });

      setLastSelectedIndex(currentIndex);
    },
    [items, getId, lastSelectedIndex]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(getId)));
    setLastSelectedIndex(null);
  }, [items, getId]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedIndex(null);
  }, []);

  const getSelectedIds = useCallback(() => Array.from(selectedIds), [selectedIds]);

  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return {
    selectedIds,
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    hasSelection,
    selectedCount,
    allSelected,
    getSelectedIds,
  };
}
