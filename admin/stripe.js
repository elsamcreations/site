import Stripe from 'stripe'
import { products } from '../app/data.js'

// TODO: save customers

const allowed_countries = ['US', 'FR', 'BE', 'GB', 'PT', 'DK', 'CH', 'ES']

const costs = Object.fromEntries(Object.entries(products)
  .flatMap(([key, { options, sizes, cost }]) => options
    ? Object.entries(options).map(([k, option]) => [`${key}_${k}`, cost || option.cost])
    : [[key, cost]]))

const stripe = Stripe(process.env.STRIPE_TOKEN)
const endpointSecret = 'whsec_LmUnLQftmkIx8EGiZy4gtTbLQTtyI1dU'

export const makeProduct = ({ product, quantity, size, sheet, note }) => ({
  quantity,
  price_data: {
    currency: 'euro',
    unit_amount: costs[product],
    product_data: { name: product, metadata: { size, sheet, note } },
  },
})

export const parseWebhook = request => {
  const sig = request.headers['stripe-signature']
  return Stripe.webhooks.constructEventAsync(request.body, sig, endpointSecret)
  // get session data
  // find customer email
}

export const createSession = async items => {
  const session = await stripe.checkout.sessions.create({
    line_items: items.map(makeProduct),
    mode: 'payment',
    payment_method_types: ['card'],
    shipping_address_collection: { allowed_countries },
    // success_url: 'https://example.com/success',
    // cancel_url: 'https://example.com/cancel',
  })

  return session.url
}
