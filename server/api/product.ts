import productJson from "../../__mocks__/product.json";

export default defineEventHandler((event) => {
  return productJson;
});
