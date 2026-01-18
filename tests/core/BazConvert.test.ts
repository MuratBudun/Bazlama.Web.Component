import { describe, it, expect } from "vitest";
import { BazConvert } from "@bazlama/core";

describe("BazConvert", () => {
  describe("anyToString", () => {
    it("should convert number to string", () => {
      expect(BazConvert.anyToString(42)).toBe("42");
    });

    it("should convert boolean to string", () => {
      expect(BazConvert.anyToString(true)).toBe("true");
      expect(BazConvert.anyToString(false)).toBe("false");
    });

    it("should convert object to JSON string", () => {
      expect(BazConvert.anyToString({ a: 1 })).toBe('{"a":1}');
    });

    it("should return default value for null/undefined", () => {
      expect(BazConvert.anyToString(null, "default")).toBe("default");
      expect(BazConvert.anyToString(undefined, "default")).toBe("default");
    });

    it("should convert bigint to string", () => {
      expect(BazConvert.anyToString(BigInt(123))).toBe("123");
    });
  });

  describe("anyToNumber", () => {
    it("should convert string to number", () => {
      expect(BazConvert.anyToNumber("42")).toBe(42);
      expect(BazConvert.anyToNumber("3.14159", 0, 2)).toBe(3.14);
    });

    it("should convert boolean to number", () => {
      expect(BazConvert.anyToNumber(true)).toBe(1);
      expect(BazConvert.anyToNumber(false)).toBe(0);
    });

    it("should return default for invalid string", () => {
      expect(BazConvert.anyToNumber("invalid", -1)).toBe(-1);
    });

    it("should return default for null/undefined", () => {
      expect(BazConvert.anyToNumber(null, 99)).toBe(99);
      expect(BazConvert.anyToNumber(undefined, 99)).toBe(99);
    });

    it("should convert bigint to number", () => {
      expect(BazConvert.anyToNumber(BigInt(42))).toBe(42);
    });
  });

  describe("anyToBoolean", () => {
    it("should convert truthy strings", () => {
      expect(BazConvert.anyToBoolean("true")).toBe(true);
      expect(BazConvert.anyToBoolean("TRUE")).toBe(true);
      expect(BazConvert.anyToBoolean("1")).toBe(true);
      expect(BazConvert.anyToBoolean("yes")).toBe(true);
      expect(BazConvert.anyToBoolean("on")).toBe(true);
      expect(BazConvert.anyToBoolean("ok")).toBe(true);
      expect(BazConvert.anyToBoolean("evet")).toBe(true);
      expect(BazConvert.anyToBoolean("doğru")).toBe(true);
    });

    it("should convert falsy strings", () => {
      expect(BazConvert.anyToBoolean("false")).toBe(false);
      expect(BazConvert.anyToBoolean("0")).toBe(false);
      expect(BazConvert.anyToBoolean("no")).toBe(false);
    });

    it("should convert number to boolean", () => {
      expect(BazConvert.anyToBoolean(1)).toBe(true);
      expect(BazConvert.anyToBoolean(0)).toBe(false);
      expect(BazConvert.anyToBoolean(42)).toBe(false); // Only 1 is true
    });

    it("should return default for null/undefined", () => {
      expect(BazConvert.anyToBoolean(null, true)).toBe(true);
      expect(BazConvert.anyToBoolean(undefined, true)).toBe(true);
    });
  });

  describe("anyToBigint", () => {
    it("should convert string to bigint", () => {
      expect(BazConvert.anyToBigint("123")).toBe(BigInt(123));
    });

    it("should convert number to bigint", () => {
      expect(BazConvert.anyToBigint(42.9)).toBe(BigInt(42)); // floors the value
    });

    it("should convert boolean to bigint", () => {
      expect(BazConvert.anyToBigint(true)).toBe(BigInt(1));
      expect(BazConvert.anyToBigint(false)).toBe(BigInt(0));
    });

    it("should return default for invalid string", () => {
      expect(BazConvert.anyToBigint("invalid", BigInt(99))).toBe(BigInt(99));
    });

    it("should return default for null/undefined", () => {
      expect(BazConvert.anyToBigint(null, BigInt(99))).toBe(BigInt(99));
    });
  });

  describe("Unit Conversions", () => {
    it("should convert px to rem and back", () => {
      // Assuming default 16px font size
      const px = 32;
      const rem = BazConvert.pxToRem(px);
      const backToPx = BazConvert.remToPx(rem);
      expect(backToPx).toBeCloseTo(px, 2);
    });

    it("should convert px to em and back", () => {
      const px = 32;
      const em = BazConvert.pxToEm(px);
      expect(em).toBe(2); // 32px / 16 = 2em
      expect(BazConvert.emToPx(em)).toBe(32);
    });

    it("should convert px to pt and back", () => {
      const px = 16;
      const pt = BazConvert.pxToPt(px);
      expect(pt).toBe(12); // 16 * 0.75 = 12pt
      expect(BazConvert.ptToPx(pt)).toBeCloseTo(16, 2);
    });
  });
});
