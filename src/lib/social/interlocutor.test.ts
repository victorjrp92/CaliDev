import { test } from "node:test";
import assert from "node:assert/strict";
import { interlocutor } from "./instagram";

const u = (id: string, username: string) => ({ id, username });

test("chat uno a uno: devuelve a la otra persona", () => {
  assert.deepEqual(interlocutor({ participants: { data: [u("1", "calidevdev"), u("2", "ana")] } }), u("2", "ana"));
});

test("grupo: null (Instagram no deja leer sus mensajes)", () => {
  assert.equal(interlocutor({ participants: { data: [u("1", "calidevdev"), u("2", "ana"), u("3", "luis")] } }), null);
});

test("sin participantes: null", () => {
  assert.equal(interlocutor({}), null);
});
