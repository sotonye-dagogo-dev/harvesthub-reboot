"use client";

import { useRouter } from "next/navigation";
import UserSelect from "./components/UserSelect";
import { useFormData } from "../providers";
import { UserFormData } from "../types";

export default function SignUp(): React.ReactElement {
  const router = useRouter();
  const { updateFormData } = useFormData();

  // Handle selection of user type and navigation to next step
  const handleSelection = (data: Partial<UserFormData>): void => {
    updateFormData(data);
    if (data.userType) {
      router.push("/signup/user-info");
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <UserSelect onNext={() => {}} updateFormData={handleSelection} formData={{}} />
    </div>
  );
}
