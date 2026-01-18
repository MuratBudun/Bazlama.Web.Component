import { describe, it, expect } from "vitest";
import { BazGeneral } from "@bazlama/core";

describe("BazGeneral", () => {
  describe("createId", () => {
    it("should create unique IDs", () => {
      const id1 = BazGeneral.createId();
      const id2 = BazGeneral.createId();
      expect(id1).not.toBe(id2);
    });

    it("should include prefix", () => {
      const id = BazGeneral.createId("btn");
      expect(id.startsWith("btn-")).toBe(true);
    });

    it("should include suffix", () => {
      const id = BazGeneral.createId("", "end");
      expect(id.endsWith("-end")).toBe(true);
    });

    it("should include both prefix and suffix", () => {
      const id = BazGeneral.createId("start", "end");
      expect(id.startsWith("start-")).toBe(true);
      expect(id.endsWith("-end")).toBe(true);
    });
  });

  describe("Type Guards", () => {
    describe("isObject", () => {
      it("should return true for objects", () => {
        expect(BazGeneral.isObject({})).toBe(true);
        expect(BazGeneral.isObject({ a: 1 })).toBe(true);
        expect(BazGeneral.isObject([])).toBe(true); // Arrays are objects
      });

      it("should return false for null", () => {
        expect(BazGeneral.isObject(null)).toBe(false);
      });

      it("should return false for primitives", () => {
        expect(BazGeneral.isObject("string")).toBe(false);
        expect(BazGeneral.isObject(42)).toBe(false);
        expect(BazGeneral.isObject(true)).toBe(false);
      });
    });

    describe("isString", () => {
      it("should return true for strings", () => {
        expect(BazGeneral.isString("")).toBe(true);
        expect(BazGeneral.isString("hello")).toBe(true);
      });

      it("should return false for non-strings", () => {
        expect(BazGeneral.isString(42)).toBe(false);
        expect(BazGeneral.isString(null)).toBe(false);
        expect(BazGeneral.isString(undefined)).toBe(false);
      });
    });

    describe("isNumber", () => {
      it("should return true for numbers", () => {
        expect(BazGeneral.isNumber(0)).toBe(true);
        expect(BazGeneral.isNumber(42)).toBe(true);
        expect(BazGeneral.isNumber(3.14)).toBe(true);
        expect(BazGeneral.isNumber(NaN)).toBe(true); // NaN is still typeof number
      });

      it("should return false for non-numbers", () => {
        expect(BazGeneral.isNumber("42")).toBe(false);
        expect(BazGeneral.isNumber(null)).toBe(false);
      });
    });

    describe("isBoolean", () => {
      it("should return true for booleans", () => {
        expect(BazGeneral.isBoolean(true)).toBe(true);
        expect(BazGeneral.isBoolean(false)).toBe(true);
      });

      it("should return false for non-booleans", () => {
        expect(BazGeneral.isBoolean(0)).toBe(false);
        expect(BazGeneral.isBoolean("true")).toBe(false);
        expect(BazGeneral.isBoolean(null)).toBe(false);
      });
    });

    describe("isArray", () => {
      it("should return true for arrays", () => {
        expect(BazGeneral.isArray([])).toBe(true);
        expect(BazGeneral.isArray([1, 2, 3])).toBe(true);
      });

      it("should return false for non-arrays", () => {
        expect(BazGeneral.isArray({})).toBe(false);
        expect(BazGeneral.isArray("array")).toBe(false);
        expect(BazGeneral.isArray(null)).toBe(false);
      });
    });

    describe("isFunction", () => {
      it("should return true for functions", () => {
        expect(BazGeneral.isFunction(() => {})).toBe(true);
        expect(BazGeneral.isFunction(function () {})).toBe(true);
        expect(BazGeneral.isFunction(class {})).toBe(true);
      });

      it("should return false for non-functions", () => {
        expect(BazGeneral.isFunction({})).toBe(false);
        expect(BazGeneral.isFunction(null)).toBe(false);
      });
    });

    describe("isDate", () => {
      it("should return true for Date instances", () => {
        expect(BazGeneral.isDate(new Date())).toBe(true);
      });

      it("should return false for non-dates", () => {
        expect(BazGeneral.isDate("2024-01-01")).toBe(false);
        expect(BazGeneral.isDate(Date.now())).toBe(false);
        expect(BazGeneral.isDate(null)).toBe(false);
      });
    });

    describe("isNull", () => {
      it("should return true for null", () => {
        expect(BazGeneral.isNull(null)).toBe(true);
      });

      it("should return false for non-null", () => {
        expect(BazGeneral.isNull(undefined)).toBe(false);
        expect(BazGeneral.isNull(0)).toBe(false);
        expect(BazGeneral.isNull("")).toBe(false);
      });
    });
  });
});
