import { loadEnv } from './_env';
loadEnv();
import Stripe from 'stripe';

// Creates a Stripe Billing Portal *configuration* that:
//   • allows updating the payment method
//   • allows viewing/downloading invoices
//   • allows updating billing email / address
//   • DISABLES subscription cancellation
//   • DISABLES plan switching
// Print the resulting id and set STRIPE_PORTAL_CONFIGURATION_ID in your env.
const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY is required in .env.local.');
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

async function main() {
  const cfg = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Teleforce — manage your billing',
    },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address', 'phone', 'tax_id'],
      },
      subscription_cancel: { enabled: false },
      // subscription_update (plan switching) is intentionally omitted — billing
      // portal features default to disabled, so plans cannot be changed here.
    },
  });

  console.log('\n✅ Billing Portal configuration created');
  console.log('   Configuration ID:', cfg.id);
  console.log('\n   Add this to your env (.env.local and Vercel):');
  console.log('   STRIPE_PORTAL_CONFIGURATION_ID=' + cfg.id + '\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
