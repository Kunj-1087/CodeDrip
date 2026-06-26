import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';

// A vertical progress timeline derived from the order's payment + fulfillment
// status. We don't have an order_status_history table, so the timeline is
// computed from current state rather than logged transitions — accurate for the
// happy path (placed → paid → processing → shipped → delivered) and it surfaces
// the terminal cancelled/refunded states clearly.

type StepState = 'done' | 'current' | 'todo';
interface Step {
  label: string;
  hint?: string;
  state: StepState;
}

const FULFILMENT_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

function buildSteps(paymentStatus: string, fulfillmentStatus: string, placedAt: string): Step[] {
  // Terminal states short-circuit the normal progression.
  if (fulfillmentStatus === 'cancelled' || paymentStatus === 'cancelled') {
    return [
      { label: 'Order placed', hint: formatDateTime(placedAt), state: 'done' },
      { label: 'Order cancelled', hint: 'This order was cancelled.', state: 'current' },
    ];
  }
  if (paymentStatus === 'refunded') {
    return [
      { label: 'Order placed', hint: formatDateTime(placedAt), state: 'done' },
      { label: 'Payment refunded', hint: 'The amount was returned to your payment method.', state: 'current' },
    ];
  }

  const paid = ['paid', 'refunded'].includes(paymentStatus);
  const fIndex = FULFILMENT_ORDER.indexOf(fulfillmentStatus);

  const raw: Array<{ label: string; hint?: string; reached: boolean }> = [
    { label: 'Order placed', hint: formatDateTime(placedAt), reached: true },
    {
      label: 'Payment confirmed',
      hint: paymentStatus === 'failed' ? 'Payment failed — please retry checkout.' : undefined,
      reached: paid,
    },
    { label: 'Processing', hint: 'We’re picking and packing your parts.', reached: fIndex >= 1 },
    { label: 'Shipped', hint: 'On its way to your address.', reached: fIndex >= 2 },
    { label: 'Delivered', reached: fIndex >= 3 },
  ];

  // The "current" step is the last reached one; everything after is upcoming.
  const lastReached = raw.reduce((acc, s, i) => (s.reached ? i : acc), 0);
  return raw.map((s, i) => ({
    label: s.label,
    hint: s.hint,
    state: !s.reached ? 'todo' : i === lastReached ? 'current' : 'done',
  }));
}

export function OrderStatusTimeline({
  paymentStatus,
  fulfillmentStatus,
  placedAt,
}: {
  paymentStatus: string;
  fulfillmentStatus: string;
  placedAt: string;
}) {
  const steps = buildSteps(paymentStatus, fulfillmentStatus, placedAt);
  const cancelled = steps.some((s) => s.label === 'Order cancelled' || s.label === 'Payment refunded');

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const terminalBad = cancelled && step.state === 'current';
        return (
          <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Connector line between dots (not after the last). */}
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[7px] top-5 h-full w-px',
                  step.state === 'done' ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
            {/* Status dot. */}
            <span className="relative z-10 mt-1 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
              {step.state === 'done' && <span className="h-3.5 w-3.5 rounded-full bg-primary" />}
              {step.state === 'current' && (
                <span
                  className={cn(
                    'h-3.5 w-3.5 rounded-full ring-4',
                    terminalBad ? 'bg-danger ring-danger/20' : 'bg-primary ring-primary/20',
                  )}
                />
              )}
              {step.state === 'todo' && <span className="h-3.5 w-3.5 rounded-full border-2 border-border-strong bg-surface" />}
            </span>

            <div className="-mt-0.5">
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.state === 'todo' ? 'text-faint' : terminalBad ? 'text-danger' : 'text-ink',
                )}
              >
                {step.label}
              </p>
              {step.hint && <p className="mt-0.5 text-xs text-muted">{step.hint}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
