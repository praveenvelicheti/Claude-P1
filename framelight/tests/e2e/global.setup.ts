/**
 * Global setup — runs once before all tests.
 * Nothing to set up since all tests use mocked Supabase routes.
 */
export default async function globalSetup() {
  console.log('\n✓ Framelight E2E suite — using mocked Supabase APIs (no network required)')
}
