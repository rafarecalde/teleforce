import { loadEnv } from './_env';
loadEnv();
import Stripe from 'stripe';

// Creates a TEST customer + an active 3-month subscription carrying the metadata
// the portal reads. Usage:  npm run seed  [email]
const key = process.env.STRIPE_SECRET_KEY;
if (!key || !key.startsWith('sk_test_')) {
  console.error('Refusing to seed: STRIPE_SECRET_KEY must be a TEST key (sk_test_...).');
  process.exit(1);
}
const price3 = process.env.STRIPE_PRICE_3MO;
if (!price3) {
  console.error('STRIPE_PRICE_3MO is required in .env.local.');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
const email = (process.argv[2] || 'test.client@example.com').toLowerCase();
const eaName = 'María González';

async function main() {
  const customer = await stripe.customers.create({
    email,
    name: 'Test Client',
    description: 'Portal seed (test)',
  });

  // Attach a test card and make it the default so the subscription goes active.
  const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  });

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 3);

  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price3 }],
    default_payment_method: pm.id,
    metadata: {
      term: '3',
      ea_name: eaName,
      service_start: now.toISOString(),
      commitment_end: end.toISOString(),
    },
  });

  console.log('\n✅ Seed complete (TEST mode)');
  console.log('   Customer:     ', customer.id, `<${email}>`);
  console.log('   Subscription: ', sub.id, `(status: ${sub.status}, EA: ${eaName})`);
  console.log(`\n   Sign in at ${process.env.APP_URL || 'http://localhost:3000'} using: ${email}`);
  console.log('   (the sign-in link prints to the server console if RESEND_API_KEY is unset)\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
