const Login = () => {
const supabase = useSupabaseClient();

const isLoading = ref(false);

const fields = ref<AuthFormField[]>([
  {
    name: "email",
    type: "text",
    label: "Почта",
  },
  {
    name: "password",
    type: "password",
    label: "Пароль",
  },
]);

const onSubmit = async (payload) => {
  isLoading.value = true;
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    console.error("error", error);
    isLoading.value = false;
    return;
  }

  await navigateTo("/dashboard");
};

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <UPageCard className="w-full max-w-md">
        <UAuthForm
          loadingAuto
          title="Вход"
          :fields="fields"
          className="max-w-md"
          :disabled="isLoading"
          @submit="onSubmit"
          :submit="{
            label: 'Войти',
          }"
        />
      </UPageCard>
    </div>
  );
}

export default Login;