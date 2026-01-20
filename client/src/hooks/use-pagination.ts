import { useState, useEffect, useMemo } from "react";

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  dependencies?: any[]; // Dependências para resetar a página
}

interface UsePaginationReturn {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  paginatedItems: any[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToPage: (page: number) => void;
  getPageNumbers: () => (number | 'ellipsis')[];
}

export function usePagination<T>({
  items = [],
  itemsPerPage = 20,
  dependencies = [],
}: UsePaginationProps<T>): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);

  // Resetar página quando dependências mudarem (filtros, busca, etc)
  useEffect(() => {
    setCurrentPage(1);
  }, dependencies);

  const totalPages = useMemo(
    () => Math.ceil((items?.length || 0) / itemsPerPage),
    [items?.length, itemsPerPage]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = useMemo(
    () => startIndex + itemsPerPage,
    [startIndex, itemsPerPage]
  );

  const paginatedItems = useMemo(
    () => items?.slice(startIndex, endIndex) || [],
    [items, startIndex, endIndex]
  );

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Garantir que currentPage não exceda totalPages quando itens mudam
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Gerar números de página com ellipsis quando necessário
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Mostra todas as páginas se forem poucas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostra primeira página
      pages.push(1);

      if (currentPage <= 4) {
        // Páginas iniciais: 1 2 3 4 5 ... totalPages
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Páginas finais: 1 ... (totalPages-4) (totalPages-3) ... totalPages
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Páginas do meio: 1 ... (currentPage-1) currentPage (currentPage+1) ... totalPages
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    getPageNumbers,
  };
}
