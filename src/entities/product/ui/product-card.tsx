import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Rating } from "./rating";
import { Tags } from "./tags";

export const ProductCard = ({ product }: { product: any }) => {
  const url = `/product/${product.id}`;

  return (
    <Link href={url} key={product.id}>
      <Card className='group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'>
        <CardHeader className='flex-row gap-4'>
          <div className='relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-input'>
            <Image
              width={240}
              height={240}
              src={product.imageUrl ?? ""}
              alt='product.name'
              className='object-cover transition-transform duration-300 group-hover:scale-105 h-full'
            />
          </div>
          <div className='flex flex-1 flex-col'>
            <CardDescription>{product.brand}</CardDescription>
            <CardTitle>{product.name}</CardTitle>

            <Rating rating={product.rating} />
            <Tags product={product} />
          </div>
        </CardHeader>
        <CardContent>{product.id}</CardContent>
      </Card>
    </Link>
  );
};
