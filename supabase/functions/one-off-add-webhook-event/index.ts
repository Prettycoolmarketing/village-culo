import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

serve(async () => {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
  const pcm = endpoints.data.find(e => e.url.includes('stripe-pcm-webhook'))
  if (!pcm) return new Response(JSON.stringify({ error: 'pcm webhook endpoint not found', all: endpoints.data.map(e => e.url) }), { headers: { 'Content-Type': 'application/json' } })

  const currentEvents = pcm.enabled_events as string[]
  const needed = ['checkout.session.completed', 'invoice.paid', 'customer.subscription.deleted']
  const merged = Array.from(new Set([...currentEvents, ...needed]))

  const updated = await stripe.webhookEndpoints.update(pcm.id, { enabled_events: merged as Stripe.WebhookEndpointUpdateParams.EnabledEvent[] })

  return new Response(JSON.stringify({ id: updated.id, url: updated.url, enabled_events: updated.enabled_events }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
