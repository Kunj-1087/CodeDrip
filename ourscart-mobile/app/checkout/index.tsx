import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Svg, { Rect, Circle, Text as TextSvg } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { SafeScreen } from '../../components/layout/SafeScreen';
import { Header } from '../../components/layout/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OrderSummaryCard } from '../../components/cart/OrderSummaryCard';
import { useScreenPerformance } from '../../hooks/useScreenPerformance';
import { apiGet, apiPost, APIError, resolveAssetUrl } from '../../lib/api';
import { computeTotals } from '../../lib/pricing';
import { formatCurrency } from '../../lib/formatters';
import {
  formatCardNumber,
  formatExpiry,
  detectCardBrand,
  validateRequired,
  validatePincode,
  validatePhone,
} from '../../utils/validators';
import { FontFamily, FontSize } from '../../constants/typography';
import { Radius } from '../../constants/radius';
import { Space } from '../../constants/spacing';
import type { Address, AddressInput, CreatedOrder, MockCheckoutResult, ShippingAddressInput } from '../../types';

const CardBrandLogo = ({ brand }: { brand: string }) => {
  if (brand === 'visa') {
    return (
      <Svg width={40} height={25} viewBox="0 0 40 25">
        <Rect width={40} height={25} rx={4} fill="#1434CB" />
        <TextSvg
          x={20}
          y={17}
          fontSize={12}
          fontWeight="bold"
          fontStyle="italic"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          VISA
        </TextSvg>
      </Svg>
    );
  }
  if (brand === 'mastercard') {
    return (
      <Svg width={40} height={25} viewBox="0 0 40 25">
        <Rect width={40} height={25} rx={4} fill="#111111" />
        <Circle cx={15} cy={12.5} r={7} fill="#EB001B" />
        <Circle cx={25} cy={12.5} r={7} fill="#F79E1B" opacity={0.8} />
      </Svg>
    );
  }
  if (brand === 'amex') {
    return (
      <Svg width={40} height={25} viewBox="0 0 40 25">
        <Rect width={40} height={25} rx={4} fill="#007CC3" />
        <TextSvg
          x={20}
          y={16}
          fontSize={8}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          AMEX
        </TextSvg>
      </Svg>
    );
  }
  return (
    <View style={{ width: 40, height: 25, borderRadius: 4, backgroundColor: '#555555', justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="card" size={16} color="#FFFFFF" />
    </View>
  );
};

const STEPS = ['Shipping', 'Review', 'Payment'];

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const { cart, coupon, clear, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  useScreenPerformance('CheckoutScreen');

  const [step, setStep] = useState(1);
  const totals = computeTotals(cart.subtotal, coupon?.discount ?? 0);

  // --- Step 1: shipping ---
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [phone, setPhone] = useState('');
  const [form, setForm] = useState<AddressInput>({ line1: '', city: '', country: 'India' });
  const [savingAddress, setSavingAddress] = useState(false);

  // --- Step 3: payment ---
  const [card, setCard] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    apiGet<{ addresses: Address[] }>('/addresses')
      .then((r) => {
        setAddresses(r.addresses);
        const def = r.addresses.find((a) => a.isDefault) ?? r.addresses[0];
        if (def) setSelectedId(def.id);
        else setShowForm(true);
      })
      .catch(() => setShowForm(true));
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedId) ?? null;

  const saveAddress = async () => {
    const err =
      validateRequired(form.line1, 'Address') ??
      validateRequired(form.city, 'City') ??
      validatePincode(form.postalCode ?? '');
    if (err) {
      toast.warning(err);
      return;
    }
    setSavingAddress(true);
    try {
      const { address } = await apiPost<{ address: Address }>('/addresses', {
        ...form,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [address, ...prev]);
      setSelectedId(address.id);
      setShowForm(false);
      setForm({ line1: '', city: '', country: 'India' });
      toast.success('Address saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const goToReview = () => {
    if (!selectedAddress) {
      toast.warning('Please select or add a shipping address');
      return;
    }
    const nameErr = validateRequired(fullName, 'Full name');
    const phoneErr = validatePhone(phone);
    if (nameErr || phoneErr) {
      toast.warning(nameErr ?? phoneErr ?? '');
      return;
    }
    setStep(2);
  };

  const placeOrder = async () => {
    if (!selectedAddress) return;
    if (card.replace(/\s/g, '').length < 12 || cvv.length < 3 || expiry.length < 5) {
      toast.warning('Enter valid (demo) card details');
      return;
    }

    const shippingAddress: ShippingAddressInput = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      line1: selectedAddress.line1,
      line2: selectedAddress.line2 ?? undefined,
      city: selectedAddress.city,
      state: selectedAddress.state ?? undefined,
      postalCode: selectedAddress.postalCode ?? undefined,
      country: selectedAddress.country,
    };

    setPlacing(true);
    try {
      const { order } = await apiPost<{ order: CreatedOrder }>('/orders', {
        shippingAddress,
        couponCode: coupon?.code,
      });
      // Mock gateway: 95% approve. A decline returns 402 and throws below.
      const result = await apiPost<MockCheckoutResult>('/payments/mock-checkout', { orderId: order.id });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await clear();
        router.replace(`/checkout/success?orderNumber=${order.orderNumber}&orderId=${order.id}`);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      if (e instanceof APIError && e.status === 402) {
        toast.error(e.message);
        // The order exists but is unpaid — bounce the shopper to their orders.
        await refresh();
        router.replace('/orders');
      } else {
        toast.error(e instanceof Error ? e.message : 'Could not place order');
      }
    } finally {
      setPlacing(false);
    }
  };

  const brand = detectCardBrand(card);

  return (
    <SafeScreen edges={['top']}>
      <Header title="Checkout" onBack={() => (step > 1 ? setStep(step - 1) : router.back())} />

      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((label, i) => {
          const index = i + 1;
          const done = step > index;
          const active = step === index;
          return (
            <View key={label} style={styles.stepWrapper}>
              <View style={styles.circleRow}>
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: i === 0 ? colors.transparent : (step >= index ? colors.brandPrimary : colors.borderDefault),
                    },
                  ]}
                />
                <View
                  style={[
                    styles.stepCircle,
                    {
                      backgroundColor: done ? colors.brandPrimary : (active ? colors.brandPrimaryLight : colors.transparent),
                      borderColor: done || active ? colors.brandPrimary : colors.borderDefault,
                      borderWidth: active ? 2 : 1.5,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: active ? colors.brandPrimary : colors.textMuted,
                        fontFamily: FontFamily.bold,
                        fontSize: FontSize.xs,
                      }}
                    >
                      {index}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: i === STEPS.length - 1 ? colors.transparent : (step > index ? colors.brandPrimary : colors.borderDefault),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.stepLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contact</Text>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
              <View style={styles.gap} />
              <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit mobile" />

              <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Space[6] }]}>
                Shipping Address
              </Text>
              {addresses.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedId(a.id)}
                  style={[
                    styles.addressCard,
                    {
                      borderColor: selectedId === a.id ? colors.brandPrimary : colors.borderSubtle,
                      backgroundColor: selectedId === a.id ? colors.brandPrimaryLight : colors.bgPrimary,
                      borderWidth: selectedId === a.id ? 2 : 1.5,
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedId === a.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedId === a.id ? colors.brandPrimary : colors.textMuted}
                  />
                  <View style={styles.addressBody}>
                    {a.label ? <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>{a.label}</Text> : null}
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                      {[a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </Pressable>
              ))}

              {showForm ? (
                <View style={[styles.form, { borderColor: colors.borderSubtle }]}>
                  <Input label="Address Line 1" value={form.line1} onChangeText={(t) => setForm((f) => ({ ...f, line1: t }))} />
                  <View style={styles.gap} />
                  <Input label="Address Line 2 (optional)" value={form.line2 ?? ''} onChangeText={(t) => setForm((f) => ({ ...f, line2: t }))} />
                  <View style={styles.gap} />
                  <View style={styles.row}>
                    <View style={styles.half}>
                      <Input label="City" value={form.city} onChangeText={(t) => setForm((f) => ({ ...f, city: t }))} />
                    </View>
                    <View style={styles.half}>
                      <Input label="State" value={form.state ?? ''} onChangeText={(t) => setForm((f) => ({ ...f, state: t }))} />
                    </View>
                  </View>
                  <View style={styles.gap} />
                  <Input
                    label="Pincode"
                    value={form.postalCode ?? ''}
                    onChangeText={(t) => setForm((f) => ({ ...f, postalCode: t }))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <View style={styles.gap} />
                  <Button label="Save Address" onPress={saveAddress} loading={savingAddress} fullWidth />
                </View>
              ) : (
                <Pressable style={styles.addNew} onPress={() => setShowForm(true)}>
                  <Ionicons name="add-circle-outline" size={20} color={colors.brandPrimary} />
                  <Text style={[styles.addNewText, { color: colors.brandPrimary }]}>Add New Address</Text>
                </Pressable>
              )}

              <Button label="Continue to Review" onPress={goToReview} fullWidth size="lg" style={{ marginTop: Space[6] }} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Review Order</Text>
              {cart.items.map((item) => (
                <View key={item.id} style={[styles.reviewItem, { borderBottomColor: colors.borderSubtle }]}>
                  <Image source={resolveAssetUrl(item.imageUrl)} style={[styles.reviewThumb, { backgroundColor: colors.bgTertiary }]} contentFit="cover" />
                  <View style={styles.reviewBody}>
                    <Text style={[styles.reviewName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                    <Text style={[styles.reviewQty, { color: colors.textMuted }]}>Qty {item.quantity}</Text>
                  </View>
                  <Text style={[styles.reviewPrice, { color: colors.textPrimary }]}>{formatCurrency(item.lineTotal)}</Text>
                </View>
              ))}

              <Pressable onPress={() => router.push('/(tabs)/cart')} style={styles.editCart}>
                <Ionicons name="create-outline" size={16} color={colors.brandPrimary} />
                <Text style={[styles.editCartText, { color: colors.brandPrimary }]}>Edit Cart</Text>
              </Pressable>

              <View style={{ marginTop: Space[4] }}>
                <OrderSummaryCard
                  subtotal={totals.subtotal}
                  discount={totals.discount}
                  shipping={totals.shipping}
                  tax={totals.tax}
                  total={totals.total}
                />
              </View>

              <Button label="Continue to Payment" onPress={() => setStep(3)} fullWidth size="lg" style={{ marginTop: Space[6] }} />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment</Text>

              {/* Faux card */}
              <LinearGradient
                colors={['#1F1E1B', '#151412']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardPreview}
              >
                <View style={styles.cardTop}>
                  <Ionicons name="hardware-chip" size={28} color="#D4AF37" />
                  <CardBrandLogo brand={brand} />
                </View>
                <Text style={[styles.cardNumber, { color: colors.white }]}>
                  {card || '•••• •••• •••• ••••'}
                </Text>
                <View style={styles.cardBottom}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardLabel, { color: '#8F8D88' }]}>CARDHOLDER</Text>
                    <Text style={[styles.cardHolder, { color: colors.white }]} numberOfLines={1}>
                      {cardName.toUpperCase() || 'CARDHOLDER NAME'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.cardLabel, { color: '#8F8D88' }]}>EXPIRES</Text>
                    <Text style={[styles.cardExpiry, { color: colors.white }]}>
                      {expiry || 'MM/YY'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              <Input label="Card Number" value={card} onChangeText={(t) => setCard(formatCardNumber(t))} keyboardType="number-pad" placeholder="4242 4242 4242 4242" style={{ fontFamily: FontFamily.mono, letterSpacing: 1.5 }} />
              <View style={styles.gap} />
              <Input label="Name on Card" value={cardName} onChangeText={setCardName} autoCapitalize="words" />
              <View style={styles.gap} />
              <View style={styles.row}>
                <View style={styles.half}>
                  <Input label="Expiry" value={expiry} onChangeText={(t) => setExpiry(formatExpiry(t))} keyboardType="number-pad" placeholder="MM/YY" maxLength={5} style={{ fontFamily: FontFamily.mono }} />
                </View>
                <View style={styles.half}>
                  <Input label="CVV" value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="123" maxLength={4} style={{ fontFamily: FontFamily.mono }} />
                </View>
              </View>

              <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
                Demo checkout — no real payment is processed.
              </Text>

              <Button label={`Place Order · ${formatCurrency(totals.total)}`} onPress={placeOrder} loading={placing} fullWidth size="lg" style={{ marginTop: Space[4] }} />
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Space[4], paddingBottom: Space[10] },
  steps: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Space[4] },
  stepWrapper: { flex: 1, alignItems: 'center' },
  circleRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  stepLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.xs, marginTop: Space[2], textAlign: 'center' },
  stepLine: { flex: 1, height: 2 },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.xl, marginBottom: Space[3] },
  gap: { height: Space[4] },
  row: { flexDirection: 'row', gap: Space[3] },
  half: { flex: 1 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[3],
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Space[4],
    marginBottom: Space[3],
  },
  addressBody: { flex: 1 },
  addressLabel: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm, marginBottom: 2 },
  addressText: { fontFamily: FontFamily.regular, fontSize: FontSize.sm },
  form: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, padding: Space[4] },
  addNew: { flexDirection: 'row', alignItems: 'center', gap: Space[2], paddingVertical: Space[3] },
  addNewText: { fontFamily: FontFamily.semibold, fontSize: FontSize.base },
  reviewItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space[3], borderBottomWidth: StyleSheet.hairlineWidth },
  reviewThumb: { width: 48, height: 48, borderRadius: Radius.md },
  reviewBody: { flex: 1, marginHorizontal: Space[3] },
  reviewName: { fontFamily: FontFamily.medium, fontSize: FontSize.sm },
  reviewQty: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, marginTop: 2 },
  reviewPrice: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  editCart: { flexDirection: 'row', alignItems: 'center', gap: Space[1], marginTop: Space[3] },
  editCartText: { fontFamily: FontFamily.semibold, fontSize: FontSize.sm },
  cardPreview: { borderRadius: Radius.xl, padding: Space[5], marginBottom: Space[5], minHeight: 160, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontFamily: FontFamily.mono, fontSize: FontSize.lg, letterSpacing: 2, marginVertical: Space[3] },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontFamily: FontFamily.medium, fontSize: 8, letterSpacing: 1, marginBottom: 2 },
  cardHolder: { fontFamily: FontFamily.mono, fontSize: FontSize.sm, letterSpacing: 1 },
  cardExpiry: { fontFamily: FontFamily.mono, fontSize: FontSize.sm, letterSpacing: 1 },
  disclaimer: { fontFamily: FontFamily.regular, fontSize: FontSize.xs, textAlign: 'center', marginTop: Space[4] },
});
