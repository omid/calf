import { XMarkIcon } from '@heroicons/react/16/solid';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

type Props = {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  aiFormError: string;
};

export default function AIModal({ isOpen, isDark, onClose, onApply, aiFormError }: Props) {
  useMemo(() => (document.body.style.overflow = isOpen ? 'hidden' : 'auto'), [isOpen]);

  const [value, setValue] = useState('');
  const [nlValue, setNlValue] = useState('');
  const [notice, setNotice] = useState('');

  const buildPrompt = (nl: string) => {
    return `Generate a json (Do not include any explanation) with the root elements of title, description, sDate and sTime (for start date), eDate and eTime (for end date, if applicable, otherwise set one-hour meeting), timezone, location (if applicable), and isAllDay (if it's all day event or not) based on this info:\n\`\`\`\n${nl}\n\`\`\``;
  };

  const handleAIOpen = async (type: string) => {
    if (!nlValue || !nlValue.trim()) {
      setNotice('Please enter a short description in the box above.');
      setTimeout(() => setNotice(''), 4000);
      return;
    }

    const prompt = buildPrompt(nlValue || '');
    const enc = encodeURI(prompt);

    let urlToOpen;
    if (type === 'openai') {
      urlToOpen = `https://chat.openai.com/?prompt=${enc}`;
    } else if (type === 'mistral') {
      urlToOpen = `https://chat.mistral.ai/chat?q=${enc}`;
    } else if (type === 'gemini') {
      urlToOpen = `https://aistudio.google.com/prompts/new_chat?prompt=${enc}`;
    } else if (type === 'grok') {
      urlToOpen = `https://grok.com/?q=${enc}`;
    } else if (type === 'copy') {
      try {
        await navigator.clipboard.writeText(prompt);
        setNotice('Prompt copied. Paste it into your desired AI tool and copy the generated JSON.');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        setNotice('Could not copy prompt to clipboard.');
      }
      setTimeout(() => setNotice(''), 5000);
    } else {
      return;
    }

    try {
      if (urlToOpen) {
        window.open(urlToOpen, '_blank');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-[92vw] max-w-2xl max-h-[90vh] rounded-2xl p-6 shadow-xl transform transition-all duration-300 flex flex-col overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Fill the form with AI</h2>
          <Button
            className={`min-w-auto -mr-6 -mt-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            onPress={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto text-sm text-gray-700 dark:text-gray-300 text-left pr-1">
          <p className="mb-3">
            Describe your event in plain text and use one of the AI buttons below to generate JSON:
          </p>

          <textarea
            className="w-full min-h-28 border rounded p-2 text-sm focus:outline-none focus:ring-0"
            value={nlValue}
            placeholder="Describe event in plain text here or paste it from the email you got, e.g. Meeting with John to discuss project updates on January 1, 2032, at 3 PM at Eifel tower"
            onChange={(e) => setNlValue(e.target.value)}
          />

          <p className="my-3">
            Send the prompt to one of the free AI chat pages. The AI page will open with the prompt. Or you can copy the
            prompt and manually paste it into your desired the AI chat system. Then copy that JSON result and paste it
            into the text box below.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white px-3 py-2"
                onPress={async () => handleAIOpen('mistral')}
                startContent={<img src="assets/mistral.png" alt="Mistral AI" className="w-4 h-4 inline" />}
              >
                Mistral AI
              </Button>

              <Button
                size="sm"
                className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white px-3 py-2"
                onPress={async () => handleAIOpen('openai')}
                startContent={<img src="assets/chatgpt.avif" alt="ChatGPT" className="w-4 h-4 inline" />}
              >
                ChatGPT
              </Button>

              <Button
                size="sm"
                className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white"
                onPress={async () => handleAIOpen('gemini')}
                startContent={<img src="assets/gemini.avif" alt="Gemini" className="w-4 h-4 inline" />}
              >
                Gemini
              </Button>

              <Button
                size="sm"
                className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white px-3 py-2"
                onPress={async () => handleAIOpen('grok')}
                startContent={<img src="assets/grok.avif" alt="Grok" className="w-4 h-4 inline" />}
              >
                Grok
              </Button>

              <Button
                size="sm"
                className="rounded-lg bg-white border px-3 py-2"
                onPress={async () => handleAIOpen('copy')}
              >
                Manual (Copy Prompt)
              </Button>
            </div>

            {notice && <div className="text-xs text-green-600 mt-1">{notice}</div>}
          </div>

          <label className="block text-sm font-medium my-4">Copy and paste the generated JSON here:</label>
          <textarea
            className="w-full min-h-40 border rounded p-2 text-sm focus:outline-none focus:ring-0"
            value={value}
            placeholder='Paste the generated JSON here, e.g. {"title":"Meeting","sDate":"2025-12-15"}'
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        {aiFormError && <div className="text-xs text-red-600 mt-1">{aiFormError}</div>}

        <div className="mt-4 flex justify-between gap-2 shrink-0">
          <Button className="rounded-lg border bg-white px-4 py-2 text-gray-800 hover:shadow-sm" onPress={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-lg font-bold bg-linear-to-r from-indigo-500 via-pink-500 to-yellow-400 text-white px-4 py-2 hover:shadow-2xl"
            onPress={() => onApply(value)}
          >
            Fill the form
          </Button>
        </div>
      </div>
    </div>
  );
}
