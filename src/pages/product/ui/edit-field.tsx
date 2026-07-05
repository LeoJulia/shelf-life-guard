import { FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

export const EditField = ({ onChange, value, children }) => {
  return (
    <FieldGroup>
      <FieldLabel>{children}</FieldLabel>
      <Input value={value} onChange={onChange} />
    </FieldGroup>
  );
};
