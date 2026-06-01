import productJson from "../../__mocks__/product.json";

export default defineEventHandler((event) => {
  return new Array<typeof productJson>(20).fill(productJson);
});
