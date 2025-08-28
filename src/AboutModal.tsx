import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { Button } from "@heroui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  repo?: string;
  donateUrl?: string;
};

export default function AboutModal({
  isOpen,
  onClose,
  username = "omid",
  repo = "calf",
  donateUrl = "https://github.com/sponsors/omid",
}: Props) {
  if (!isOpen) return null;

  const repoUrl = `https://github.com/${username}/${repo}`;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="about-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative w-[92vw] max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 id="about-title" className="text-xl font-bold text-black">
            Calf (Calendar Factory) — About & Disclaimer
          </h2>
          <Button
            className="bg-white min-w-auto"
            onPress={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </Button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-gray-700 text-left">
          <p>
            <strong>Calf</strong> helps you create a calendar event and share it
            with a single link. Anyone with the link can add the event to their
            calendar or download an iCal (<code>.ics</code>) file. Everything
            runs entirely in your browser — no accounts, no backend.
          </p>

          <div>
            <h3 className="font-semibold">Links</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                Repository:{" "}
                <a
                  className="text-blue-600 underline"
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {repoUrl}
                </a>
              </li>
              <li>
                Donate:{" "}
                <a
                  className="text-blue-600 underline"
                  href={donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {donateUrl}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Privacy</h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                All event generation happens locally in your browser; the iCal
                file is created client-side.
              </li>
              <li>
                When searching for places, the app may query a geocoding service
                (e.g., OpenStreetMap’s Nominatim) to fetch suggestions.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
            <h3 className="font-semibold text-amber-900">Disclaimer</h3>
            <ul className="ml-5 list-disc space-y-1 text-amber-900">
              <li>
                <strong>GitHub may track created links.</strong> Links you open
                via GitHub Pages can appear in repository traffic or analytics.
              </li>
              <li>
                <strong>Updates may break older links.</strong> I aim to keep
                things backward-compatible, but breaking changes can happen.
              </li>
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            MIT License. Feedback and contributions are welcome!
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            className="rounded-lg border bg-white px-4 py-2 text-gray-800 hover:shadow-sm"
            onPress={onClose}
          >
            Close
          </Button>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-800"
          >
            View on GitHub
            <ArrowTopRightOnSquareIcon className="ml-2 inline h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
