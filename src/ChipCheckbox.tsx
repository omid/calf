// ChipCheckbox.tsx
import * as React from "react";
import { useCheckbox, Chip, VisuallyHidden, tv } from "@heroui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/16/solid";

type ChipCheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "children" | "defaultChecked" | "onChange" | "value"
> & {
  /** Label text or per-state texts */
  text?: string | { on: string; off: string };
  /** Custom icon when selected (defaults to Heroicons Check) */
  icon?: React.ReactNode;
  /** Slot class overrides for the Chip */
  classNames?: { base?: string; content?: string };

  /** HeroUI-style control props */
  isSelected?: boolean;
  defaultSelected?: boolean;
  onValueChange?: (next: boolean) => void;

  /** Narrowed value (will be coerced to string for the hook) */
  value?: string | number;

  /** Optional aria-state props mirroring HeroUI naming */
  isDisabled?: boolean;
  isReadOnly?: boolean;

  /** Optional native onChange listener (merged with the hook’s) */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const ChipCheckbox = React.forwardRef<HTMLInputElement, ChipCheckboxProps>((props, ref) => {
  const {
    // extra
    text = { on: "Enabled", off: "Disabled" },
    icon,
    classNames,

    // control (HeroUI)
    isSelected,
    defaultSelected,
    onValueChange,

    // accessibility / state
    isDisabled,
    isReadOnly,

    // native input listeners/attrs
    onChange: onInputChange,
    disabled,
    readOnly,
    name,
    value,
    autoFocus,
    required,
    id,

    // everything else goes to the hidden input (NOT to the hook)
    ...restInputProps
  } = props;

  const coercedValue = value == null ? undefined : String(value);

  // Only pass the props the hook expects (avoid DOM props like className/color/etc.)
  const {
    isSelected: selected,
    getBaseProps,
    getLabelProps,
    getInputProps,
  } = useCheckbox({
    isSelected,
    defaultSelected,
    onValueChange, // (next: boolean) => void
    isDisabled: isDisabled ?? disabled,
    isReadOnly: isReadOnly ?? readOnly,
    name,
    value: coercedValue,
    autoFocus,
  });

  const checkbox = tv({
    slots: {
      base: "border-default hover:bg-default-200 transition-colors rounded-xl",
      content: "text-default-500",
    },
    variants: {
      isSelected: {
        true: {
          base: "border-[#e3b344] bg-[#e3b344] hover:bg-[#e3b344]-500 hover:border-[#e3b344]-500",
          content: "text-white pl-1",
        },
      },
    },
  });

  const styles = checkbox({ isSelected: selected });

  // Merge the hook's onChange with any user-provided native onChange
  const inputFromHook = getInputProps();
  const mergedOnChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    inputFromHook.onChange?.(e);
    onInputChange?.(e);
  };

  const labelText = typeof text === "string" ? text : selected ? text.on : text.off;

  return (
    <label {...getBaseProps()}>
      <VisuallyHidden>
        <input
          ref={ref}
          id={id}
          {...inputFromHook}
          onChange={mergedOnChange}
          // safe native attrs that won't fight the hook
          name={name}
          value={coercedValue}
          disabled={isDisabled ?? disabled}
          readOnly={isReadOnly ?? readOnly}
          required={required}
          autoFocus={autoFocus}
          {...restInputProps}
        />
      </VisuallyHidden>

      <Chip
        classNames={{
          base: `${styles.base()} ${classNames?.base ?? ""}`,
          content: `${styles.content()} ${classNames?.content ?? ""}`,
        }}
        startContent={
          selected ? (
            (icon ?? <CheckIcon className="ml-1 h-4 w-4 text-white" />)
          ) : (
            <XMarkIcon className="ml-1 h-4 w-4 text-gray-400" />
          )
        }
        variant="faded"
        {...getLabelProps()}
      >
        {labelText}
      </Chip>
    </label>
  );
});

export default ChipCheckbox;
