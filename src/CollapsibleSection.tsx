import React, { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

type CollapsibleSectionProps = {
  title: ReactNode;
  children: ReactNode;
  initiallyOpen?: boolean;
  className?: string;
  icon?: ReactNode;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initiallyOpen = false,
  className = "",
  icon,
}) => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <div className={`rounded border border-gray-200 bg-white ${className}`}>
      <button
        className="cursor-pointer flex items-center w-full px-4 py-3 text-lg font-semibold text-left hover:bg-gray-50 focus:outline-none transition"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        {open ? (
          <ChevronDownIcon className="h-5 w-5 mr-1 text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 mr-1 text-gray-400" />
        )}
        {icon}
        <span>{title}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-2">{children}</div>
      )}
    </div>
  );
};

export default CollapsibleSection;
