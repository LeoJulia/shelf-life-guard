// import { useState } from "react";
import { ProductList } from "./product-list";

export const Dashboard = () => {
  // const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <>
      {/* <Filter :setViewMode :viewMode />  */}
      <ProductList />
      {/* TODO: move to layout */}
      {/* <SidebarFilter /> */}
    </>
  );
};
