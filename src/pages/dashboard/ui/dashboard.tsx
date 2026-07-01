// import { useState } from "react";
import { ProductList } from "./product-list";

export const Dashboard = () => {
  // const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className='mx-auto max-w-7xl px-6 py-8'>
      {/* <Statistic />
    <Filter :setViewMode :viewMode /> */}
      {/* <Loader v-if="pending" /> */}
      <ProductList />
      {/* TODO: move to layout */}
      {/* <SidebarFilter /> */}
    </div>
  );
};
