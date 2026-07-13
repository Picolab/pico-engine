/**
 * Loaded by AVA before any test file. Clears inherited engine env so tests never
 * touch a developer's running engine (~/.pico-engine, PORT 3000, etc.).
 */
delete process.env.PORT;
delete process.env.PICO_ENGINE_HOME;
delete process.env.PICO_ENGINE_BASE_URL;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}
