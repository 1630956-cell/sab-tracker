import { toast } from "sonner";
import { BRAND, profileUrl } from "@/lib/brand";
import { demoProfile } from "@/lib/demo-profile";

export function copyProfileLink() {
  navigator.clipboard?.writeText(`https://${profileUrl(demoProfile.username)}`).catch(() => {});
  toast.success("Link copied", { description: `Your ${BRAND.name} link is ready to share.` });
}
