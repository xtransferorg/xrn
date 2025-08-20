import { mergeClasses } from '@expo/styleguide';
import { ChevronDownIcon } from '@expo/styleguide-icons/outline/ChevronDownIcon';
import React from 'react';

export const Selector: React.FC<{
  title: string;
  value?: string;
  selectOptions: { label: string; value: string }[];
  onChange: (value: string) => void;
}> = ({ title, value, selectOptions, onChange }) => {
  return (
    <div className="flex items-center">
      <div className="mr-1 text-secondary">{title}：</div>
      <div className="relative">
        <select
          title={title}
          className={mergeClasses(
            'flex items-center justify-center h-9 text-default leading-[1.3] p-0 m-0 min-w-[110px] border border-default shadow-xs rounded-md indent-[-9999px] appearance-none bg-default text-sm',
            'hocus:bg-element',
            'max-lg-gutters:w-auto max-lg-gutters:min-w-[100px] max-lg-gutters:px-2 max-lg-gutters:text-secondary max-lg-gutters:indent-0 max-lg-gutters:pl-8'
          )}
          defaultChecked={false}
          value={value}
          onChange={e => {
            const option = e.target.value;
            onChange(option);
          }}>
          <option value="" selected disabled>
            请选择一个选项
          </option>
          {selectOptions.map(option => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="icon-sm absolute left-2.5 top-2.5 text-icon-secondary pointer-events-none text-nowrap">
          {selectOptions.find(it => it.value === value)?.label || value}
        </span>
        <ChevronDownIcon className="icon-xs text-icon-secondary absolute right-2 top-3 pointer-events-none" />
      </div>
    </div>
  );
};
