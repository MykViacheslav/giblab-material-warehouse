import test from "node:test";
import assert from "node:assert/strict";
import { getConstructorProjectName, parseConstructorProjectParts } from "../src/constructorProject.js";

test("3D Constructor import reads dimensioned parts and ignores operation references", () => {
  const xml = `
    <project name="Kuchnia test">
      <good>
        <part id="1" l="756" w="794" count="2" part.code="A1" part.name="front" part.drill="true" part.mill="true"/>
      </good>
      <operation><part id="1"/></operation>
    </project>
  `;

  const parts = parseConstructorProjectParts(xml);

  assert.equal(getConstructorProjectName(xml), "Kuchnia test");
  assert.equal(parts.length, 1);
  assert.deepEqual(parts[0], {
    length: 756,
    width: 794,
    quantity: 2,
    texture: 1,
    name: "A1 - front",
    description: "",
    work_milling: 1,
    work_drilling: 1,
    work_lacquer: 0,
    work_other: 0
  });
});

test("3D Constructor import rounds decimal dimensions and detects grooves as milling", () => {
  const xml = `
    <project>
      <part id="2" dl="279.33" dw="223.2" count="1" name="GOFRA" part.groove="true" description="FrK Paz"/>
    </project>
  `;

  const parts = parseConstructorProjectParts(xml);

  assert.equal(parts.length, 1);
  assert.equal(parts[0].length, 279);
  assert.equal(parts[0].width, 223);
  assert.equal(parts[0].work_milling, 1);
});

test("3D Constructor import reads Project3dc Obj sheet parts", () => {
  const xml = `
    <Project3dc name="Kuchnia-7">
      <Obj id="6931" class="18" code="TOP.001" name="formatka" quantity="2"
        l="1448.4" w="538.4" dl="1450" dw="540" cutting="true" opFlag="Paz" />
      <Obj id="400332" class="18" code="GLASS" name="Szklo" quantity="1"
        dl="1198" dw="319" cutting="false" />
      <Obj id="9:67" class="19" code="FITTING" name="Okucie" quantity="1" />
    </Project3dc>
  `;

  const parts = parseConstructorProjectParts(xml);

  assert.equal(getConstructorProjectName(xml), "Kuchnia-7");
  assert.equal(parts.length, 1);
  assert.equal(parts[0].length, 1450);
  assert.equal(parts[0].width, 540);
  assert.equal(parts[0].quantity, 2);
  assert.equal(parts[0].name, "TOP.001 - formatka");
  assert.equal(parts[0].work_milling, 1);
});
