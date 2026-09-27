import { test } from "node:test";
import assert from "node:assert/strict";
import { enlaceTarjeta, codigoPersona, landingPermitida } from "./enlaces";

test("código estable, corto y sin el igsid", () => {
  const a = codigoPersona("1010871755112354", "sal");
  assert.equal(a, codigoPersona("1010871755112354", "sal"));
  assert.match(a, /^[a-z0-9]{10}$/);
  assert.ok(!a.includes("1010871755"));
});
test("enlace con UTM y código", () => {
  const u = new URL(enlaceTarjeta("https://calidev.dev/servinomic/limpiaexpress", "abc123xyz0", "testimonio-deisy"));
  assert.equal(u.searchParams.get("utm_source"), "instagram");
  assert.equal(u.searchParams.get("utm_medium"), "dm");
  assert.equal(u.searchParams.get("utm_campaign"), "testimonio-deisy");
  assert.equal(u.searchParams.get("c"), "abc123xyz0");
});
test("solo landings de dominios propios", () => {
  assert.equal(landingPermitida("https://calidev.dev/servinomic/limpiaexpress"), true);
  assert.equal(landingPermitida("https://seiricon.com/go/juntos"), true);
  assert.equal(landingPermitida("https://evil.com/x"), false);
  assert.equal(landingPermitida("javascript:alert(1)"), false);
});
