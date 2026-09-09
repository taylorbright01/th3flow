// Safe browser configuration. Never put Supabase secret keys or payment/feed tokens here.
window.TH3FLOW_CONFIG = {
  mode: 'demo', // change to 'live' after Supabase is deployed
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabasePublishableKey: 'sb_publishable_REPLACE_ME',
  paymentsEnabled: false,
  brandUrl: 'https://th3flow.world',
  defaultSymbol: 'EURUSD'
};
