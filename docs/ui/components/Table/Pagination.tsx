import React from 'react';
import { Button } from '@expo/styleguide';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ current, pageSize, total, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);

  const handlePrev = () => {
    if (current > 1) {
      onChange(current - 1, pageSize);
    }
  };

  const handleNext = () => {
    if (current < totalPages) {
      onChange(current + 1, pageSize);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== current) {
      onChange(page, pageSize);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-3 py-1 mx-1 rounded ${current === i ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-500'}`}>
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center space-x-2">
      <Button theme='secondary' onClick={handlePrev} disabled={current === 1}>
        上一页
      </Button>
      {renderPageNumbers()}
      <Button theme='secondary' onClick={handleNext} disabled={current === totalPages}>
        下一页
      </Button>
    </div>
  );
};

export default Pagination;
