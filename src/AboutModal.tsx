import {
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { Button } from "@heroui/react";
import { useMemo } from "react";
// import { useCallback } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
  repo?: string;
};

export default function AboutModal({
  isOpen,
  onClose,
  username = "omid",
  repo = "calf",
}: Props) {
  useMemo(
    () => (document.body.style.overflow = isOpen ? "hidden" : "auto"),
    [isOpen]
  );

  if (!isOpen) return null;

  const repoUrl = `https://github.com/${username}/${repo}`;
  const reportBugUrl = `${repoUrl}/issues`;
  const changeLogUrl = `${repoUrl}/blob/master/CHANGELOG.md`;
  const donateUrl = `https://github.com/sponsors/${username}`;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="about-title"
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 backdrop-blur-sm ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative w-[92vw] max-w-2xl max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl transform transition-all duration-300 flex flex-col overflow-hidden ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-2 scale-95"
        }`}
      >
        <div className="flex items-start justify-between">
          <h2 id="about-title" className="text-xl font-bold">
            Calf (Calendar Factory) — About &amp; Disclaimer
          </h2>

          <Button
            className="bg-white min-w-auto"
            onPress={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 text-sm text-gray-700 dark:text-gray-300 text-left pr-1">
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
              <li>
                Bugs:{" "}
                <a
                  className="text-blue-600 underline"
                  href={reportBugUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {reportBugUrl}
                </a>
              </li>
              <li>
                Changelog:{" "}
                <a
                  className="text-blue-600 underline"
                  href={changeLogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {changeLogUrl}
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
              <li>
                GoatCounter is used as a privacy-friendly visit counter. No
                personal data is collected.
              </li>
              <li>
                No cookies or local storage are used. The app does not track or
                store any personal information.
              </li>
              <li>
                The source code is open and available for review on GitHub.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-none dark:bg-amber-900 p-3 pb-5">
            <h3 className="font-semibold text-amber-900 dark:text-amber-50">
              Disclaimer
            </h3>
            <ul className="ml-5 list-disc space-y-1 text-amber-900 dark:text-amber-50">
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

        <div className="mt-6 flex justify-end gap-2 flex-shrink-0">
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
            <ArrowTopRightOnSquareIcon className="ml-2 inline text-gray-400 h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
