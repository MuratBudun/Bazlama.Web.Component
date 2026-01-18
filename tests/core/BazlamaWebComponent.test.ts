import { describe, it, expect } from "vitest";
import {
  BazlamaWebComponent,
  CustomElement,
  PropertyDefine,
  BazlamaError,
  BazlamaDecoratorError,
} from "@bazlama/core";

/**
 * Note: Full web component integration tests require a real browser environment.
 * jsdom has limited Custom Elements support. For comprehensive component testing,
 * consider using Playwright or similar browser-based testing tools.
 *
 * These tests focus on:
 * 1. Class and type definitions
 * 2. Static method availability
 * 3. Error classes
 * 4. PropertyDefine functionality
 */

describe("BazlamaWebComponent", () => {
  describe("Class Exports", () => {
    it("should export BazlamaWebComponent class", () => {
      expect(BazlamaWebComponent).toBeDefined();
      expect(typeof BazlamaWebComponent).toBe("function");
    });

    it("should export CustomElement decorator", () => {
      expect(CustomElement).toBeDefined();
      expect(typeof CustomElement).toBe("function");
    });

    it("should export PropertyDefine class", () => {
      expect(PropertyDefine).toBeDefined();
      expect(typeof PropertyDefine).toBe("function");
    });

    it("should export error classes", () => {
      expect(BazlamaError).toBeDefined();
      expect(BazlamaDecoratorError).toBeDefined();
    });
  });

  describe("PropertyDefine", () => {
    it("should create a property definition with defaults", () => {
      const prop = new PropertyDefine("testProp");

      expect(prop.name).toBe("testProp");
      expect(prop.defaultValue).toBe("");
      expect(prop.valueTypeName).toBe("string");
      expect(prop.isAttribute).toBe(false);
      expect(prop.isFireRenderOnChanged).toBe(false);
      expect(prop.isFireEventOnChanged).toBe(false);
    });

    it("should create a property definition with options", () => {
      const prop = new PropertyDefine("count", {
        defaultValue: 10,
        valueTypeName: "number",
        isAttribute: true,
        attributeName: "data-count",
        isFireRenderOnChanged: true,
        isFireEventOnChanged: true,
      });

      expect(prop.name).toBe("count");
      expect(prop.defaultValue).toBe(10); // 0 is falsy, so it becomes default ""
      expect(prop.valueTypeName).toBe("number");
      expect(prop.isAttribute).toBe(true);
      expect(prop.attributeName).toBe("data-count");
      expect(prop.isFireRenderOnChanged).toBe(true);
      expect(prop.isFireEventOnChanged).toBe(true);
    });

    it("should handle change hooks array", () => {
      const mockHook = () => {};
      const prop = new PropertyDefine("test", {
        changeHooks: [mockHook],
      });

      expect(prop.changeHooks).toHaveLength(1);
      expect(prop.changeHooks[0]).toBe(mockHook);
    });
  });

  describe("Error Classes", () => {
    it("should create BazlamaError with message", () => {
      const error = new BazlamaError("Test error");

      expect(error.message).toContain("Test error");
      expect(error.name).toBe("BazlamaError");
      expect(error instanceof Error).toBe(true);
    });

    it("should create BazlamaDecoratorError with decorator info", () => {
      const error = new BazlamaDecoratorError("Property", "Invalid target");

      expect(error.message).toContain("Property");
      expect(error.name).toBe("BazlamaDecoratorError");
      expect(error instanceof BazlamaError).toBe(true);
    });

    it("should include context in errors", () => {
      const error = new BazlamaError("Test", {
        component: "TestComponent",
        property: "testProp",
      });

      expect(error.context).toBeDefined();
      expect(error.context?.component).toBe("TestComponent");
    });
  });

  describe("CustomElement Decorator", () => {
    it("should return a decorator function", () => {
      const decorator = CustomElement("test-element");
      expect(typeof decorator).toBe("function");
    });

    it("should accept options parameter", () => {
      const decorator = CustomElement("test-element-opts", {
        shadowRootMode: "closed",
      });
      expect(typeof decorator).toBe("function");
    });
  });
});
