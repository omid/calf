import { useState, useRef, useEffect } from 'react';
import { Alert } from '@heroui/react';
import { GlobeAltIcon } from '@heroicons/react/16/solid';

type Props = {
  originalTimezone: string;
  selectedTimezone: string;
  className?: string;
};

export default function TimezonePopover({ originalTimezone, selectedTimezone, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!(ref.current as HTMLElement).contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <span className={`relative ${className}`} ref={ref}>
      <button
        className="ml-2 p-0 text-sm text-gray-600 hover:underline focus:outline-none cursor-pointer"
        onClick={() => setOpen((s) => !s)}
        aria-label="Show timezone info"
        type="button"
      >
        <GlobeAltIcon className="h-4 w-4 inline text-gray-500" />
      </button>

      {open && (
        <span className="absolute mt-2 w-80 z-50">
          <Alert
            color="default"
            variant="faded"
            className="text-sm"
            description={
              <div>
                <div className="mb-1">
                  Original timezone: <strong>{originalTimezone}</strong>
                </div>
                <div>
                  Selected timezone: <strong>{selectedTimezone}</strong>
                </div>
              </div>
            }
          />
        </span>
      )}
    </span>
  );
}
