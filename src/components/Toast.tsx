'use client';

import { useStore } from '@/lib/store';
import { cx } from '@/lib/util';

export function Toast() {
  const msg = useStore((s) => s.toastMsg);
  return <div className={cx('toast', msg && 'show')}>{msg}</div>;
}
