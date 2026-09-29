import {
  Droplets,
  Gift,
  MessageCircleHeart,
  Package,
  Pipette,
  SoapDispenserDroplet,
  Star,
  Store,
} from "lucide-react";

export const DashboardLoading = () => (
  <div className='mt-12 h-full flex flex-col items-center justify-center text-center'>
    <h3 className='mb-10 text-lg font-medium text-foreground'>Поиск баночек</h3>
    <div className='flex animate-pulse w-200'>
      <Star className='h-12 w-12 text-muted-foreground' />
      <Droplets className='h-12 w-12 text-muted-foreground' />
      <Package className='h-12 w-12 text-muted-foreground' />
      <Pipette className='h-12 w-12 text-muted-foreground' />
      <SoapDispenserDroplet className='h-12 w-12 text-muted-foreground' />
      <Gift className='h-12 w-12 text-muted-foreground' />
      <MessageCircleHeart className='h-12 w-12 text-muted-foreground' />
      <Store className='h-12 w-12 text-muted-foreground' />
    </div>
  </div>
);
