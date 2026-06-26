'use client';
import type { ShippingAddress } from '@/components/checkout/types';

// Controlled shipping-address form. The parent owns the value so it can submit
// it with the order. Required fields mirror the API's order validation.
export function AddressForm({
  value,
  onChange,
}: {
  value: ShippingAddress;
  onChange: (next: ShippingAddress) => void;
}) {
  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          className="input h-[52px]"
          required
          autoComplete="name"
          value={value.fullName}
          onChange={set('fullName')}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="line1">Address line 1</label>
        <input
          id="line1"
          className="input h-[52px]"
          required
          autoComplete="address-line1"
          value={value.line1}
          onChange={set('line1')}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="line2">Address line 2 (optional)</label>
        <input
          id="line2"
          className="input h-[52px]"
          autoComplete="address-line2"
          value={value.line2 ?? ''}
          onChange={set('line2')}
        />
      </div>
      <div>
        <label className="label" htmlFor="city">City</label>
        <input
          id="city"
          className="input h-[52px]"
          required
          autoComplete="address-level2"
          value={value.city}
          onChange={set('city')}
        />
      </div>
      <div>
        <label className="label" htmlFor="state">State</label>
        <input
          id="state"
          className="input h-[52px]"
          autoComplete="address-level1"
          value={value.state ?? ''}
          onChange={set('state')}
        />
      </div>
      <div>
        <label className="label" htmlFor="postalCode">Postal code</label>
        <input
          id="postalCode"
          className="input h-[52px]"
          autoComplete="postal-code"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value.postalCode ?? ''}
          onChange={set('postalCode')}
        />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          className="input h-[52px]"
          autoComplete="tel"
          inputMode="tel"
          value={value.phone ?? ''}
          onChange={set('phone')}
        />
      </div>
    </div>
  );
}
