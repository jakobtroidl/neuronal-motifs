export const EdgeFields = {
  weight: {
    label: "weight",
    type: "number",
    operators: ["equal", "less", "greater"],
    valueSources: ["value"],
  },
  allow: {
    label: "allow",
    type: "boolean",
    operators: ["equal"],
    valueSources: ["value"],
  },
};
