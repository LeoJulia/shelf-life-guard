import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { TProduct } from "../model";
import { Rating } from "./rating";
import { Tags } from "./tags";
import { ExpiryBar } from "./expiry-bar";
import { BadgeRussianRuble, Calendar, Store } from "lucide-react";

export const ProductCard = ({ product }: { product: TProduct }) => {
  const lastDate = product?.finished_at
    ? new Date(product.finished_at)
    : new Date();
  const costPerDay = product?.opened_at
    ? (product?.actual_price ?? 0) /
      ((lastDate.getTime() - new Date(product.opened_at).getTime()) / 8.64e7)
    : null;

  return (
    <div className='group relative'>
      <Link href={`/product/${product.id}`} key={product.id} className='block'>
        <Card className='break-inside-avoid mb-4 group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'>
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
          <CardContent>
            <ExpiryBar product={product} />

            <div className='mt-4 grid grid-cols-3 gap-2'>
              <div className='rounded-lg bg-[oklch(0.92_0.06_200)] p-2.5'>
                <div className='flex items-center gap-1 text-[oklch(0.5_0.08_200)]'>
                  <Calendar className='size-4' />
                  <span className='text-[10px] font-medium uppercase tracking-wide'>
                    Открыт
                  </span>
                </div>
                <p className='mt-1 text-xs font-semibold text-[oklch(0.4_0.08_200)]'>
                  {product.opened_at
                    ? new Date(product.opened_at).toLocaleDateString("ru-RU", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Баночка еще не открыта"}
                </p>
              </div>
              <div className='rounded-lg bg-[oklch(0.9_0.08_165)] p-2.5'>
                <div className='flex items-center gap-1 text-[oklch(0.45_0.1_165)]'>
                  <Store className='size-4' />
                  <span className='text-[10px] font-medium uppercase tracking-wide'>
                    Магазин
                  </span>
                </div>
                <p className='mt-1 text-xs font-semibold text-[oklch(0.35_0.1_165)]'>
                  {product.shop}
                </p>
              </div>
              <div className='rounded-lg bg-[oklch(0.9_0.08_340)] p-2.5'>
                <div className='flex items-center gap-1 text-[oklch(0.5_0.1_340)]'>
                  <BadgeRussianRuble className='size-4' />
                  <span className='text-[10px] font-medium uppercase tracking-wide'>
                    Цена за день
                  </span>
                </div>
                <p className='mt-1 text-xs font-semibold text-[oklch(0.5_0.1_340)]'>
                  {typeof costPerDay === "number"
                    ? costPerDay?.toFixed(2)
                    : "Начни банку, чтобы узнать"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};
