"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { useCallback, useState } from "react";
import { EditField } from "./edit-field";
import { TProduct } from "@/entities/product";

export const ProductForm = ({ product }: { product: TProduct }) => {
  const [editedProduct, setEditedProduct] = useState(product ?? {});
  const router = useRouter();

  const updateField = useCallback(
    <K extends keyof TProduct>(field: K) =>
      ({ target }: { target: { value: TProduct[K] } }) => {
        setEditedProduct((prev) => ({ ...prev, [field]: target.value }));
      },
    [],
  );

  return (
    <Card className='group relative overflow-hidden rounded-xl border border-border bg-card'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-0'>
        <div className='flex flex-col'>
          <CardHeader>
            <CardTitle className='text-xl font-bold text-foreground'>
              Редактирование продукта
            </CardTitle>
          </CardHeader>
          <CardContent className='h-full space-y-4'>
            <EditField
              value={editedProduct.brand}
              onChange={updateField("brand")}
            >
              Бренд
            </EditField>
            <EditField
              value={editedProduct.name}
              onChange={updateField("name")}
            >
              Название
            </EditField>
          </CardContent>
          <CardFooter className='flex gap-3 mt-8'>
            <Button
              onClick={() => {
                console.log(editedProduct);
              }}
            >
              <Save />
              Сохранить
            </Button>
            <Button variant='secondary' onClick={() => router.back()}>
              Отмена
            </Button>
          </CardFooter>
        </div>
        <div className='bg-muted flex items-center justify-center p-8 lg:p-12 min-h-[400px]'>
          <div className='relative w-full max-w-xs'>
            <Image
              src={editedProduct.imageUrl ?? ""}
              alt={editedProduct.name}
              width={615}
              height={832}
              className='w-full h-auto object-contain rounded-2xl'
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
