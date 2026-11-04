import { SessionsCard } from "./sessions-card";

export const SessionsSection = () => (
  <div className='flex flex-col gap-6'>
    <h1 className='text-2xl font-bold'>Устройства и выход</h1>
    <SessionsCard />
  </div>
);
