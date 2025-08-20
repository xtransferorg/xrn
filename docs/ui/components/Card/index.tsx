import React from 'react';

type CardProps = {
  title: string;
  content: React.ReactNode;
  subtitle?: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ title, content, subtitle }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-sm min-h-60">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{title}</div>

        <div className="text-gray-500 text-sm mb-2">{subtitle}</div>

        <div className="text-gray-700 text-base">{content}</div>
      </div>
      {/* <div className="px-6 pt-4 pb-2">
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #tailwind
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #react
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #component
        </span>
      </div> */}
    </div>
  );
};
