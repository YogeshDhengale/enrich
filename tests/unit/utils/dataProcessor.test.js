const dataProcessor = require("../../../src/utils/dataProcessor");

describe("Data Processor", () => {
  describe("cleanData", () => {
    it("should trim strings", () => {
      const input = { name: "  John Doe  ", age: 30 };
      const result = dataProcessor.cleanData(input);
      expect(result.name).toBe("John Doe");
    });

    it("should remove PII fields", () => {
      const input = {
        name: "John Doe",
        ssn: "123-45-6789",
        email: "john@example.com",
        phone: "555-1234",
      };
      const result = dataProcessor.cleanData(input);
      expect(result).not.toHaveProperty("ssn");
      expect(result.name).toBe("John Doe");
    });

    it("should handle nested objects", () => {
      const input = {
        user: {
          name: "  Jane Doe  ",
          ssn: "987-65-4321",
        },
      };
      const result = dataProcessor.cleanData(input);
      expect(result.user.name).toBe("Jane Doe");
      expect(result.user).not.toHaveProperty("ssn");
    });
  });
});
