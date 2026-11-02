import { RequestResetForm } from "./request-reset-form";

export const ForgotPassword = () => {
  return (
    <div className='flex min-h-screen w-full items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <RequestResetForm />
      </div>
    </div>
  );
};
