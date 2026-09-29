import React from 'react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { sfx } from '../../lib/soundEngine';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onSelect?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'separator')[];
  label?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  contentClassName?: string;
}

/** Radix-powered menu with Lear glass styling, motion, and sound. */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  label,
  align = 'end',
  side = 'bottom',
  contentClassName = '',
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <RadixDropdown.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        sfx(v ? 'nav.open' : 'nav.close');
      }}
    >
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align={align}
          side={side}
          sideOffset={8}
          className={[
            'z-[70] min-w-[200px] glass-heavy rounded-2xl border border-border-subtle shadow-2xl p-1.5',
            'data-[state=open]:fx-zoom-in',
            contentClassName,
          ].join(' ')}
          asChild
        >
          <motion.div
            initial={false}
            animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.96, y: open ? 0 : -4 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            {label && (
              <RadixDropdown.Label className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500">
                {label}
              </RadixDropdown.Label>
            )}
            <AnimatePresence>
              {items.map((item, idx) => {
                if (item === 'separator') {
                  return (
                    <RadixDropdown.Separator
                      key={`sep-${idx}`}
                      className="my-1 h-px bg-border-subtle"
                    />
                  );
                }
                return (
                  <RadixDropdown.Item
                    key={item.id}
                    disabled={item.disabled}
                    onMouseEnter={() => sfx('ui.hover.04', { minGapMs: 60 })}
                    onSelect={() => {
                      sfx(item.danger ? 'ui.click.09' : 'ui.select.02');
                      item.onSelect?.();
                    }}
                    className={[
                      'group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none outline-none',
                      'data-[highlighted]:bg-white/[0.07] data-[highlighted]:translate-x-0.5 transition-all duration-100',
                      item.danger
                        ? 'text-rose-400 data-[highlighted]:text-rose-300 data-[highlighted]:bg-danger/10'
                        : 'text-neutral-200 data-[highlighted]:text-white',
                      item.disabled ? 'opacity-40 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {item.icon && <span className="shrink-0 opacity-70 group-data-[highlighted]:opacity-100">{item.icon}</span>}
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    {item.hint && (
                      <span className="text-[10px] font-mono text-neutral-500 group-data-[highlighted]:text-neutral-400">
                        {item.hint}
                      </span>
                    )}
                    {item.checked && <Check size={13} className="text-accent shrink-0" />}
                  </RadixDropdown.Item>
                );
              })}
            </AnimatePresence>
            <RadixDropdown.Arrow className="fill-neutral-800" />
          </motion.div>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
};

/** Convenience: a labelled "submenu-like" section header inside dropdowns. */
export const DropdownSection: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
    <ChevronRight size={10} className="text-accent" />
    {children}
  </div>
);

export default Dropdown;
