import { useMemo, useState } from 'react';

const focusRing = 'focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-400 focus-visible:outline-offset-2';

const textSizePreview = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl'
};

const buttonSizes = {
  normal: 'px-4 py-2 text-sm',
  large: 'px-5 py-3 text-base',
  xlarge: 'px-6 py-3.5 text-lg'
};

const spacingGaps = {
  snug: 'gap-2',
  roomy: 'gap-4',
  airy: 'gap-6'
};

const ToggleRow = ({ label, description, active, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    onClick={onToggle}
    className={`flex w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition ${active ? 'border-lime-500 bg-lime-50 text-slate-900' : 'border-slate-300 bg-white text-slate-900'} ${focusRing}`}
  >
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
    <span
      aria-hidden
      className={`ml-4 inline-flex h-6 w-10 items-center rounded-full transition ${active ? 'bg-lime-500' : 'bg-slate-300'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow transition ${active ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </span>
  </button>
);

const PillOption = ({ label, active, onClick, ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel || label}
    aria-pressed={active}
    onClick={onClick}
    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${active ? 'border-lime-500 bg-lime-50 text-lime-900' : 'border-slate-300 bg-white text-slate-800'} ${focusRing}`}
  >
    {label}
  </button>
);

export default function Settings() {
  const [textSize, setTextSize] = useState('medium');
  const [highContrastText, setHighContrastText] = useState(false);
  const [captionsAlways, setCaptionsAlways] = useState(true);
  const [visualAlerts, setVisualAlerts] = useState(true);
  const [keyboardNav, setKeyboardNav] = useState(true);
  const [focusIndicator, setFocusIndicator] = useState(true);
  const [buttonSize, setButtonSize] = useState('large');
  const [spacing, setSpacing] = useState('roomy');
  const [reducePrecision, setReducePrecision] = useState(true);

  const sampleTextClasses = useMemo(() => {
    const sizeClass = textSizePreview[textSize] || textSizePreview.medium;
    const contrast = highContrastText ? 'bg-slate-900 text-lime-100' : 'bg-slate-50 text-slate-900';
    return `${sizeClass} ${contrast}`;
  }, [textSize, highContrastText]);

  const spacingClass = spacingGaps[spacing] || spacingGaps.roomy;
  const sampleButtonClass = buttonSizes[buttonSize] || buttonSizes.normal;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-lime-700">Settings</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Accessibility first</h1>
          <p className="max-w-3xl text-lg text-slate-700">
            Minimal, chunked controls for hearing-impaired and motor-impaired players. Mirrors the Search page tone with clear
            focus states and roomy hit targets.
          </p>
        </header>

        <div className="mt-10">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Accessibility</h2>
                <p className="mt-1 text-sm text-slate-600">Text, captions, keyboard, and motor controls grouped for quick scanning.</p>
              </div>
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-800">Priority</span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Text size</span>
                  {['small', 'medium', 'large'].map(size => (
                    <PillOption
                      key={size}
                      label={size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large'}
                      active={textSize === size}
                      onClick={() => setTextSize(size)}
                    />
                  ))}
                  <PillOption
                    label="High-contrast text"
                    active={highContrastText}
                    onClick={() => setHighContrastText(v => !v)}
                    ariaLabel="Toggle high contrast text"
                  />
                </div>
                <div className={`mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-3 ${sampleTextClasses}`}>
                  “Sample text stays readable. Adjust size and contrast to taste.”
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Captions & visual feedback</h3>
                <div className="mt-3 space-y-3">
                  <ToggleRow
                    label="Always show captions for videos"
                    description="Hearing-impaired safe default."
                    active={captionsAlways}
                    onToggle={() => setCaptionsAlways(v => !v)}
                  />
                  <ToggleRow
                    label="Replace audio alerts with visual indicators"
                    description="Flash banners or subtle pulses instead of sounds."
                    active={visualAlerts}
                    onToggle={() => setVisualAlerts(v => !v)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Keyboard navigation</h3>
                <div className="mt-3 space-y-3">
                  <ToggleRow
                    label="Enable keyboard navigation"
                    description="Tab, arrow keys, and shortcuts as a first-class path."
                    active={keyboardNav}
                    onToggle={() => setKeyboardNav(v => !v)}
                  />
                  <ToggleRow
                    label="Show focus indicator (always visible)"
                    description="Bright focus ring mirrors the search page."
                    active={focusIndicator}
                    onToggle={() => setFocusIndicator(v => !v)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Motor accessibility</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Button size</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { id: 'normal', label: 'Normal' },
                        { id: 'large', label: 'Large' },
                        { id: 'xlarge', label: 'Extra Large' }
                      ].map(opt => (
                        <PillOption
                          key={opt.id}
                          label={opt.label}
                          active={buttonSize === opt.id}
                          onClick={() => setButtonSize(opt.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">Spacing between elements</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { id: 'snug', label: 'Tight' },
                        { id: 'roomy', label: 'Roomy' },
                        { id: 'airy', label: 'Extra room' }
                      ].map(opt => (
                        <PillOption
                          key={opt.id}
                          label={opt.label}
                          active={spacing === opt.id}
                          onClick={() => setSpacing(opt.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 ${spacingClass}`}>
                    <button type="button" className={`rounded-lg bg-lime-600 font-semibold text-white shadow-sm transition hover:bg-lime-700 ${sampleButtonClass}`}>Tap</button>
                    <button type="button" className={`rounded-lg bg-slate-900 font-semibold text-white shadow-sm transition hover:bg-slate-800 ${sampleButtonClass}`}>Confirm</button>
                    <button type="button" className={`rounded-lg bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 ${sampleButtonClass}`}>Cancel</button>
                  </div>

                  <ToggleRow
                    label="Reduce precision requirements"
                    description="Swap drag/press gestures for tap/step-by-step controls."
                    active={reducePrecision}
                    onToggle={() => setReducePrecision(v => !v)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
