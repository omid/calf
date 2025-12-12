import { XMarkIcon } from '@heroicons/react/16/solid';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
};

export default function AIModal({ isOpen, onClose, onApply }: Props) {
  useMemo(() => (document.body.style.overflow = isOpen ? 'hidden' : 'auto'), [isOpen]);

  const [value, setValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-[92vw] max-w-2xl max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl transform transition-all duration-300 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Create event with AI</h2>
          <Button className="bg-white min-w-auto" onPress={onClose} aria-label="Close">
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 text-left pr-1">
          <p className="mb-3">Paste a JSON object with event fields to prefill the form. Example keys:</p>
          <div className="px-3 py-1 rounded text-xs mb-3 overflow-auto border-l-4 border-blue-500">
            Generate a json with title, description, sDate and sTime (for start date), eDate and eTime (for end date, if
            applicable, otherwise set one-hour meeting), timezone, location, and isAllDay (if it's all day event or not)
            based on this info:
            <br />
            ```
            <br />
            Meeting with John to discuss project updates on December 15, 2025, at 3 PM at Eifel tower.
            <br />
            ```
          </div>

          <label className="block text-sm font-medium mb-1">Event JSON</label>
          <textarea
            className="w-full min-h-40 border rounded p-2 text-sm"
            value={value}
            placeholder='Paste JSON here, e.g. {"title":"Meeting","sDate":"2025-12-15"}'
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2 shrink-0">
          <Button className="rounded-lg border bg-white px-4 py-2 text-gray-800 hover:shadow-sm" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-lg bg-linear-to-r from-indigo-500 via-pink-500 to-yellow-400 text-white px-4 py-2 hover:shadow-2xl"
            onPress={() => onApply(value)}
          >
            Apply JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
